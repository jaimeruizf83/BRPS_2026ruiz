import { audit, getBucket, one, run } from "@/db";
import {
  fetchDrivePdf,
  isPdfBytes,
  MAX_BATCH_BYTES,
  MAX_BATCH_FILES,
  MAX_DRIVE_LINKS,
  MAX_PDF_BYTES,
  parseDriveReference,
  sanitizePdfName,
  sha256Bytes,
  type RequestedForm,
} from "@/lib/batches";
import { canViewIndividual, hasOrganizationAccess } from "@/lib/auth";
import { authenticatedForm, isResponse, redirectTo, textField } from "@/lib/http";
import { isSameOrigin } from "@/lib/security";

type Campaign = { id: string; organization_id: string };

async function storeDocument(options: {
  batchId: string;
  organizationId: string;
  campaignId: string;
  name: string;
  sourceType: "upload" | "drive";
  sourceReference: string | null;
  bytes: Uint8Array;
}) {
  const hash = await sha256Bytes(options.bytes);
  const duplicate = await one<{ id: string }>(
    "SELECT id FROM batch_documents WHERE batch_id = ? AND file_sha256 = ?",
    options.batchId,
    hash,
  );
  if (duplicate) throw new Error(`${options.name}: archivo duplicado en el lote`);

  const documentId = crypto.randomUUID();
  const r2Key = `batch-pdfs/${options.organizationId}/${options.campaignId}/${options.batchId}/${documentId}.pdf`;
  const bucket = getBucket();
  await bucket.put(r2Key, options.bytes, {
    httpMetadata: { contentType: "application/pdf" },
    customMetadata: { batchId: options.batchId, documentId },
  });
  try {
    await run(
      `INSERT INTO batch_documents
        (id,batch_id,original_name,source_type,source_reference,r2_key,byte_size,file_sha256)
       VALUES (?,?,?,?,?,?,?,?)`,
      documentId,
      options.batchId,
      sanitizePdfName(options.name),
      options.sourceType,
      options.sourceReference,
      r2Key,
      options.bytes.byteLength,
      hash,
    );
  } catch (error) {
    await bucket.delete(r2Key);
    throw error;
  }
  return documentId;
}

export async function POST(request: Request) {
  let batchId = "";
  try {
    if (!isSameOrigin(request)) return new Response("Origen no permitido", { status: 403 });
    const form = await request.formData();
    const user = await authenticatedForm(request, form, "batch:create");
    if (isResponse(user)) return user;
    if (!canViewIndividual(user)) return new Response("No autorizado", { status: 403 });

    const campaignId = textField(form, "applicationId", { required: true, max: 80 });
    const campaign = await one<Campaign>(
      "SELECT id, organization_id FROM campaigns WHERE id = ?",
      campaignId,
    );
    if (!campaign || !hasOrganizationAccess(user, campaign.organization_id)) {
      return new Response("Aplicación no encontrada", { status: 404 });
    }
    const name = textField(form, "name", { required: true, max: 100 });
    const requested = textField(form, "requestedForm", { required: true, max: 8 });
    if (!["auto", "A", "B"].includes(requested)) {
      throw new Error("Selecciona una Forma válida");
    }
    const requestedForm = requested as RequestedForm;
    const uploads = form
      .getAll("files")
      .filter((value): value is File => value instanceof File && value.size > 0);
    const driveLinks = textField(form, "driveLinks", { max: 8000 })
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (!uploads.length && !driveLinks.length) {
      throw new Error("Carga al menos un PDF o pega un enlace individual de Drive");
    }
    if (uploads.length > MAX_BATCH_FILES) {
      throw new Error(`Puedes cargar hasta ${MAX_BATCH_FILES} PDF por lote`);
    }
    if (driveLinks.length > MAX_DRIVE_LINKS) {
      throw new Error(`Puedes pegar hasta ${MAX_DRIVE_LINKS} enlaces por lote`);
    }
    if (uploads.length + driveLinks.length > MAX_BATCH_FILES) {
      throw new Error(`El lote admite como máximo ${MAX_BATCH_FILES} documentos`);
    }

    batchId = crypto.randomUUID();
    await run(
      `INSERT INTO scoring_batches
        (id,campaign_id,name,requested_form,delete_originals_after_confirmation,created_by)
       VALUES (?,?,?,?,?,?)`,
      batchId,
      campaignId,
      name,
      requestedForm,
      form.get("deleteOriginals") === "yes" ? 1 : 0,
      user.email,
    );

    const errors: string[] = [];
    let stored = 0;
    let totalBytes = 0;
    for (const file of uploads) {
      try {
        if (file.size > MAX_PDF_BYTES) throw new Error(`${file.name}: supera 15 MB`);
        if (totalBytes + file.size > MAX_BATCH_BYTES) {
          throw new Error("El lote supera el límite total de 50 MB");
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (!isPdfBytes(bytes)) throw new Error(`${file.name}: no es un PDF válido`);
        await storeDocument({
          batchId,
          organizationId: campaign.organization_id,
          campaignId,
          name: file.name,
          sourceType: "upload",
          sourceReference: null,
          bytes,
        });
        totalBytes += bytes.byteLength;
        stored += 1;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `${file.name}: no se pudo guardar`);
      }
    }

    for (const link of driveLinks) {
      try {
        const reference = parseDriveReference(link);
        if (reference.kind === "folder") {
          throw new Error(
            "Las carpetas de Drive requieren OAuth; pega enlaces individuales a PDF compartidos",
          );
        }
        const downloaded = await fetchDrivePdf(reference.id);
        if (totalBytes + downloaded.bytes.byteLength > MAX_BATCH_BYTES) {
          throw new Error("El lote supera el límite total de 50 MB");
        }
        await storeDocument({
          batchId,
          organizationId: campaign.organization_id,
          campaignId,
          name: downloaded.name,
          sourceType: "drive",
          sourceReference: reference.id,
          bytes: downloaded.bytes,
        });
        totalBytes += downloaded.bytes.byteLength;
        stored += 1;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "No se pudo importar un enlace de Drive");
      }
    }

    if (!stored) {
      await run("DELETE FROM scoring_batches WHERE id = ?", batchId);
      batchId = "";
      throw new Error(errors[0] || "No se pudo guardar ningún PDF");
    }
    await audit(user.email, "batch.created", "scoring_batch", batchId, {
      campaignId,
      stored,
      rejected: errors.length,
      requestedForm,
      totalBytes,
    });
    return redirectTo(request, `/lotes/${batchId}`, {
      created: String(stored),
      ...(errors.length
        ? { warning: `${errors.length} archivo(s) omitido(s): ${errors.slice(0, 2).join(" · ")}` }
        : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible crear el lote";
    return redirectTo(request, "/lotes", { error: message.slice(0, 420) });
  }
}
