import { audit, getBucket, getD1, one, run } from "@/db";
import { canViewIndividual, hasOrganizationAccess } from "@/lib/auth";
import { isPdfBytes, suggestedParticipantCode } from "@/lib/batches";
import { authenticatedForm, isResponse, redirectTo } from "@/lib/http";
import { extractPdfAnswers } from "@/lib/openai-extraction";

type DocumentAccess = {
  id: string;
  batch_id: string;
  original_name: string;
  r2_key: string | null;
  status: string;
  requested_form: "auto" | "A" | "B";
  organization_id: string;
};

function wantsJson(request: Request) {
  return request.headers.get("accept")?.includes("application/json");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; documentId: string }> },
) {
  const { id, documentId } = await context.params;
  let userEmail: string | null = null;
  let mayRecordFailure = false;
  try {
    const form = await request.formData();
    const user = await authenticatedForm(request, form, `batch:process:${documentId}`);
    if (isResponse(user)) return user;
    userEmail = user.email;
    if (!canViewIndividual(user)) return new Response("No autorizado", { status: 403 });
    const document = await one<DocumentAccess>(
      `SELECT batch_documents.id,batch_documents.batch_id,batch_documents.original_name,
        batch_documents.r2_key,batch_documents.status,scoring_batches.requested_form,
        campaigns.organization_id
       FROM batch_documents
       JOIN scoring_batches ON scoring_batches.id=batch_documents.batch_id
       JOIN campaigns ON campaigns.id=scoring_batches.campaign_id
       WHERE batch_documents.id=? AND batch_documents.batch_id=?`,
      documentId,
      id,
    );
    if (!document || !hasOrganizationAccess(user, document.organization_id)) {
      return new Response("Documento no encontrado", { status: 404 });
    }
    if (!document.r2_key) throw new Error("El PDF original ya fue eliminado");
    if (document.status === "processing") {
      throw new Error("El documento ya se está procesando");
    }

    const claimed = await run(
      `UPDATE batch_documents SET status='processing',error_message=NULL
       WHERE id=? AND status!='processing'`,
      documentId,
    );
    if (Number(claimed.meta?.changes || 0) !== 1) {
      throw new Error("El documento ya se está procesando");
    }
    mayRecordFailure = true;
    const object = await getBucket().get(document.r2_key);
    if (!object) throw new Error("No se encontró el PDF en el almacenamiento privado");
    const bytes = new Uint8Array(await object.arrayBuffer());
    if (!isPdfBytes(bytes)) throw new Error("El archivo almacenado no es un PDF válido");
    const { extraction, model } = await extractPdfAnswers(
      bytes,
      document.original_name,
      document.requested_form,
    );

    const db = getD1();
    await db.prepare("DELETE FROM batch_answers WHERE document_id=?").bind(documentId).run();
    for (let offset = 0; offset < extraction.answers.length; offset += 50) {
      const chunk = extraction.answers.slice(offset, offset + 50);
      await db.batch(
        chunk.map((answer) =>
          db
            .prepare(
              `INSERT INTO batch_answers
                (id,document_id,item_number,selected_value,confidence,multiple_marks,notes)
               VALUES (?,?,?,?,?,?,?)`,
            )
            .bind(
              crypto.randomUUID(),
              documentId,
              answer.itemNumber,
              answer.selectedValue,
              answer.confidence,
              answer.multipleMarks ? 1 : 0,
              answer.notes,
            ),
        ),
      );
    }
    await run(
      `UPDATE batch_documents SET
        status='review',detected_form=?,participant_code=?,document_confidence=?,
        warnings_json=?,extraction_model=?,error_message=NULL,processed_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      extraction.detectedForm,
      extraction.participantCode || suggestedParticipantCode(documentId),
      extraction.documentConfidence,
      JSON.stringify(extraction.warnings),
      model,
      documentId,
    );
    await audit(user.email, "batch_document.extracted", "batch_document", documentId, {
      batchId: id,
      answerCount: extraction.answers.length,
      confidence: extraction.documentConfidence,
      warningCount: extraction.warnings.length,
      model,
    });
    if (wantsJson(request)) {
      return Response.json({ ok: true, documentId, status: "review" });
    }
    return redirectTo(request, `/lotes/${id}`, { processed: documentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible procesar el PDF";
    if (mayRecordFailure) {
      await run(
        "UPDATE batch_documents SET status='failed',error_message=? WHERE id=? AND batch_id=?",
        message.slice(0, 300),
        documentId,
        id,
      ).catch(() => undefined);
      await audit(userEmail, "batch_document.extraction_failed", "batch_document", documentId, {
        batchId: id,
        reason: message.slice(0, 160),
      }).catch(() => undefined);
    }
    if (wantsJson(request)) {
      return Response.json({ ok: false, documentId, error: message }, { status: 422 });
    }
    return redirectTo(request, `/lotes/${id}`, { error: message.slice(0, 420) });
  }
}
