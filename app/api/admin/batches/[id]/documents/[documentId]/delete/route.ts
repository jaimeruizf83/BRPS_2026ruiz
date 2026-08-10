import { audit, getBucket, one, run } from "@/db";
import { canViewIndividual, hasOrganizationAccess } from "@/lib/auth";
import { authenticatedForm, isResponse, redirectTo } from "@/lib/http";

type DocumentAccess = { r2_key: string | null; organization_id: string };

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; documentId: string }> },
) {
  const { id, documentId } = await context.params;
  try {
    const form = await request.formData();
    const user = await authenticatedForm(
      request,
      form,
      `batch:delete-original:${documentId}`,
    );
    if (isResponse(user)) return user;
    if (!canViewIndividual(user)) return new Response("No autorizado", { status: 403 });
    const document = await one<DocumentAccess>(
      `SELECT batch_documents.r2_key,campaigns.organization_id
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
    if (document.r2_key) await getBucket().delete(document.r2_key);
    await run(
      `UPDATE batch_documents
       SET r2_key=NULL,original_deleted_at=COALESCE(original_deleted_at,CURRENT_TIMESTAMP)
       WHERE id=?`,
      documentId,
    );
    await audit(user.email, "batch_document.original_deleted", "batch_document", documentId, {
      batchId: id,
    });
    return redirectTo(request, `/lotes/${id}`, { deleted: documentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible eliminar el PDF";
    return redirectTo(request, `/lotes/${id}`, { error: message.slice(0, 420) });
  }
}
