import { all, audit, getBucket, getD1, one, run } from "@/db";
import {
  canViewIndividual,
  hasOrganizationAccess,
} from "@/lib/auth";
import { isDemoCompatible } from "@/lib/batches";
import { authenticatedForm, isResponse, redirectTo, textField } from "@/lib/http";
import { FORM_BY_ROLE, INSTRUMENTS } from "@/lib/instruments";
import { scoreSubmission } from "@/lib/scoring";
import { randomToken, sha256 } from "@/lib/security";
import type { RoleLevel } from "@/lib/types";

type DocumentAccess = {
  id: string;
  status: string;
  r2_key: string | null;
  delete_originals_after_confirmation: number;
  campaign_id: string;
  organization_id: string;
};

type AnswerRow = {
  id: string;
  item_number: number;
  selected_value: number | null;
  reviewed_value: number | null;
};

type ParticipantRow = {
  id: string;
  instrument_form: "A" | "B";
  submission_id: string | null;
};

async function deleteOriginal(documentId: string, r2Key: string | null) {
  if (!r2Key) return true;
  try {
    await getBucket().delete(r2Key);
    await run(
      `UPDATE batch_documents
       SET r2_key=NULL,original_deleted_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      documentId,
    );
    return true;
  } catch {
    return false;
  }
}

async function refreshBatchStatus(batchId: string) {
  const pending = await one<{ count: number }>(
    `SELECT COUNT(*) AS count FROM batch_documents
     WHERE batch_id=? AND status NOT IN ('tabulated','scored')`,
    batchId,
  );
  if (Number(pending?.count || 0) === 0) {
    await run(
      `UPDATE scoring_batches
       SET status='completed',completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP)
       WHERE id=?`,
      batchId,
    );
  } else {
    await run(
      "UPDATE scoring_batches SET status='open',completed_at=NULL WHERE id=?",
      batchId,
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; documentId: string }> },
) {
  const { id, documentId } = await context.params;
  try {
    const form = await request.formData();
    const user = await authenticatedForm(request, form, `batch:review:${documentId}`);
    if (isResponse(user)) return user;
    if (!canViewIndividual(user)) return new Response("No autorizado", { status: 403 });
    const document = await one<DocumentAccess>(
      `SELECT batch_documents.id,batch_documents.status,batch_documents.r2_key,
        scoring_batches.delete_originals_after_confirmation,scoring_batches.campaign_id,
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
    if (document.status === "scored") {
      throw new Error("El documento ya fue calificado y no puede modificarse");
    }

    const action = textField(form, "action", { required: true, max: 20 });
    if (!["save", "tabulate", "score"].includes(action)) {
      throw new Error("Acción no válida");
    }
    const participantCode = textField(form, "participantCode", {
      required: true,
      max: 40,
    }).toUpperCase();
    if (!/^[A-Z0-9_-]{1,40}$/.test(participantCode)) {
      throw new Error("Usa un código seudónimo con letras, números, guion o guion bajo");
    }
    const instrumentForm = textField(form, "instrumentForm", {
      required: true,
      max: 8,
    });
    if (!["A", "B", "unknown"].includes(instrumentForm)) {
      throw new Error("Selecciona una Forma válida");
    }
    const roleRaw = textField(form, "roleLevel", { max: 40 });
    const validRoles = ["leadership", "professional_technical", "assistant", "operator"];
    const roleLevel = validRoles.includes(roleRaw) ? (roleRaw as RoleLevel) : null;

    const answers = await all<AnswerRow>(
      `SELECT id,item_number,selected_value,reviewed_value
       FROM batch_answers WHERE document_id=? ORDER BY item_number`,
      documentId,
    );
    if (!answers.length) throw new Error("El documento no contiene respuestas extraídas");
    const reviewed = answers.map((answer) => {
      const raw = String(form.get(`answer_${answer.id}`) ?? "").trim();
      if (raw === "") return { ...answer, reviewed_value: -1 };
      const value = Number(raw);
      if (!Number.isInteger(value) || value < 0 || value > 4) {
        throw new Error(`Respuesta inválida para el ítem ${answer.item_number}`);
      }
      return { ...answer, reviewed_value: value };
    });

    const db = getD1();
    for (let offset = 0; offset < reviewed.length; offset += 50) {
      await db.batch(
        reviewed.slice(offset, offset + 50).map((answer) =>
          db
            .prepare("UPDATE batch_answers SET reviewed_value=? WHERE id=? AND document_id=?")
            .bind(answer.reviewed_value, answer.id, documentId),
        ),
      );
    }
    await run(
      `UPDATE batch_documents SET
        participant_code=?,detected_form=?,role_level=?,status='reviewed',
        reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,error_message=NULL
       WHERE id=?`,
      participantCode,
      instrumentForm,
      roleLevel,
      user.email,
      documentId,
    );

    if (action === "save") {
      await refreshBatchStatus(id);
      await audit(user.email, "batch_document.review_saved", "batch_document", documentId, {
        batchId: id,
        answerCount: reviewed.length,
      });
      return redirectTo(request, `/lotes/${id}/documentos/${documentId}`, {
        saved: "1",
      });
    }

    if (form.get("reviewConfirmed") !== "yes") {
      throw new Error("Confirma que comparaste la tabulación con el PDF original");
    }
    if (action === "tabulate") {
      await run(
        `UPDATE batch_documents SET status='tabulated',confirmed_at=CURRENT_TIMESTAMP
         WHERE id=?`,
        documentId,
      );
      const deleted = document.delete_originals_after_confirmation
        ? await deleteOriginal(documentId, document.r2_key)
        : true;
      await refreshBatchStatus(id);
      await audit(user.email, "batch_document.tabulated", "batch_document", documentId, {
        batchId: id,
        answerCount: reviewed.length,
        originalDeleted: document.delete_originals_after_confirmation ? deleted : false,
      });
      return redirectTo(request, `/lotes/${id}`, {
        tabulated: documentId,
        ...(!deleted ? { warning: "Se tabuló, pero no fue posible eliminar el PDF original" } : {}),
      });
    }

    if (instrumentForm !== "A" && instrumentForm !== "B") {
      throw new Error("Selecciona la Forma A o B antes de calificar");
    }
    if (!roleLevel || FORM_BY_ROLE[roleLevel] !== instrumentForm) {
      throw new Error("Selecciona un nivel de cargo compatible con la Forma");
    }
    if (form.get("consentVerified") !== "yes") {
      throw new Error("Debes verificar el soporte de consentimiento de la aplicación en papel");
    }
    const instrument = INSTRUMENTS[instrumentForm];
    if (!isDemoCompatible(reviewed, instrument.questions.length)) {
      throw new Error(
        `La calificación disponible es solo para la plantilla demostrativa de ${instrument.questions.length} ítems. Conserva esta lectura como tabulación hasta integrar una plantilla autorizada.`,
      );
    }
    const answerMap = Object.fromEntries(
      instrument.questions.map((question, index) => [
        question.id,
        String(
          reviewed[index].reviewed_value === null
            ? reviewed[index].selected_value
            : reviewed[index].reviewed_value,
        ),
      ]),
    );
    const results = scoreSubmission(instrument, answerMap);
    const existing = await one<ParticipantRow>(
      `SELECT participants.id,participants.instrument_form,submissions.id AS submission_id
       FROM participants
       LEFT JOIN submissions ON submissions.participant_id=participants.id
       WHERE participants.campaign_id=? AND participants.participant_code=?`,
      document.campaign_id,
      participantCode,
    );
    if (existing?.submission_id) {
      throw new Error("Ese código ya tiene una evaluación calificada en la aplicación");
    }
    if (existing && existing.instrument_form !== instrumentForm) {
      throw new Error("Ese código ya está asociado con otra Forma en la aplicación");
    }

    const participantId = existing?.id || crypto.randomUUID();
    const submissionId = crypto.randomUUID();
    const statements = [];
    if (!existing) {
      statements.push(
        db
          .prepare(
            `INSERT INTO participants
              (id,campaign_id,participant_code,role_level,instrument_form,invite_token_hash,status,consent_at,consent_version)
             VALUES (?,?,?,?,?,?, 'completed',CURRENT_TIMESTAMP,'paper-admin-verified-v1')`,
          )
          .bind(
            participantId,
            document.campaign_id,
            participantCode,
            roleLevel,
            instrumentForm,
            await sha256(randomToken()),
          ),
      );
    } else {
      statements.push(
        db
          .prepare(
            `UPDATE participants SET
              role_level=?,status='completed',consent_at=CURRENT_TIMESTAMP,
              consent_version='paper-admin-verified-v1'
             WHERE id=?`,
          )
          .bind(roleLevel, participantId),
      );
    }
    statements.push(
      db
        .prepare(
          `INSERT INTO submissions
            (id,participant_id,instrument_id,instrument_version,answers_json,results_json,ip_hash)
           VALUES (?,?,?,?,?,?,?)`,
        )
        .bind(
          submissionId,
          participantId,
          instrument.id,
          instrument.version,
          JSON.stringify(answerMap),
          JSON.stringify(results),
          "not-collected:paper-batch",
        ),
      db
        .prepare(
          `UPDATE batch_documents SET
            status='scored',imported_submission_id=?,confirmed_at=CURRENT_TIMESTAMP
           WHERE id=?`,
        )
        .bind(submissionId, documentId),
      db
        .prepare(
          `INSERT INTO audit_logs
            (actor_email,action,entity_type,entity_id,details_json)
           VALUES (?,'batch_document.scored','batch_document',?,?)`,
        )
        .bind(
          user.email,
          documentId,
          JSON.stringify({
            batchId: id,
            submissionId,
            participantId,
            form: instrumentForm,
            demo: true,
          }),
        ),
    );
    await db.batch(statements);
    const deleted = document.delete_originals_after_confirmation
      ? await deleteOriginal(documentId, document.r2_key)
      : true;
    await refreshBatchStatus(id);
    return redirectTo(request, `/lotes/${id}`, {
      scored: submissionId,
      ...(!deleted ? { warning: "Se calificó, pero no fue posible eliminar el PDF original" } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible guardar la revisión";
    return redirectTo(request, `/lotes/${id}/documentos/${documentId}`, {
      error: message.slice(0, 420),
    });
  }
}
