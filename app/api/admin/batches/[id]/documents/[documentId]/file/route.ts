import { getAuthorizedUser, canViewIndividual, hasOrganizationAccess } from "@/lib/auth";
import { getBucket, one } from "@/db";
import { sanitizePdfName } from "@/lib/batches";

type DocumentAccess = {
  original_name: string;
  r2_key: string | null;
  organization_id: string;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; documentId: string }> },
) {
  const { id, documentId } = await context.params;
  const user = await getAuthorizedUser();
  if (!user) return new Response("No autorizado", { status: 401 });
  if (!canViewIndividual(user)) return new Response("No autorizado", { status: 403 });
  const document = await one<DocumentAccess>(
    `SELECT batch_documents.original_name,batch_documents.r2_key,campaigns.organization_id
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
  if (!document.r2_key) {
    return new Response("El original fue eliminado conforme a la política del lote", {
      status: 410,
    });
  }
  const object = await getBucket().get(document.r2_key);
  if (!object) return new Response("PDF no encontrado", { status: 404 });
  const disposition = new URL(request.url).searchParams.get("download") === "1"
    ? "attachment"
    : "inline";
  const filename = sanitizePdfName(document.original_name).replace(/["\\]/g, "-");
  const asciiFilename =
    filename
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9._() -]+/g, "-") || "documento.pdf";
  return new Response(object.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, noarchive",
    },
  });
}
