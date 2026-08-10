import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BatchProcessor } from "@/components/BatchProcessor";
import { EmptyState, Metric, Notice, PageHeader, StatusPill } from "@/components/Ui";
import { all, getBindings, one } from "@/db";
import { canViewIndividual, hasOrganizationAccess, requireAuthorizedUser } from "@/lib/auth";
import { confidenceLabel } from "@/lib/batches";
import { formatDateTime } from "@/lib/format";
import { issueCsrf } from "@/lib/security";

export const dynamic = "force-dynamic";

type Batch = {
  id: string;
  name: string;
  requested_form: string;
  status: string;
  delete_originals_after_confirmation: number;
  created_at: string;
  campaign_id: string;
  campaign_name: string;
  organization_id: string;
  organization_name: string;
};
type DocumentRow = {
  id: string;
  original_name: string;
  source_type: string;
  r2_key: string | null;
  byte_size: number;
  status: string;
  detected_form: string | null;
  participant_code: string | null;
  document_confidence: number | null;
  warnings_json: string;
  error_message: string | null;
  imported_submission_id: string | null;
  answer_count: number;
  created_at: string;
};

function warnings(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export default async function BatchDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireAuthorizedUser(`/lotes/${id}`);
  if (!canViewIndividual(user)) redirect("/acceso-denegado");
  const batch = await one<Batch>(
    `SELECT scoring_batches.*,campaigns.name AS campaign_name,campaigns.organization_id,
      organizations.name AS organization_name
     FROM scoring_batches
     JOIN campaigns ON campaigns.id=scoring_batches.campaign_id
     JOIN organizations ON organizations.id=campaigns.organization_id
     WHERE scoring_batches.id=?`,
    id,
  );
  if (!batch || !hasOrganizationAccess(user, batch.organization_id)) notFound();
  const documents = await all<DocumentRow>(
    `SELECT batch_documents.*,
      (SELECT COUNT(*) FROM batch_answers WHERE batch_answers.document_id=batch_documents.id) AS answer_count
     FROM batch_documents WHERE batch_documents.batch_id=?
     ORDER BY batch_documents.created_at`,
    id,
  );
  const confirmed = documents.filter((document) => ["tabulated", "scored"].includes(document.status)).length;
  const needsReview = documents.filter((document) => ["review", "reviewed"].includes(document.status)).length;
  const failed = documents.filter((document) => document.status === "failed").length;
  const pending = documents.filter((document) => ["uploaded", "failed"].includes(document.status));
  const pendingWithCsrf = await Promise.all(
    pending.map(async (document) => ({
      id: document.id,
      name: document.original_name,
      csrf: await issueCsrf(user.email, `batch:process:${document.id}`, 120),
    })),
  );
  const deleteTokens = new Map(
    await Promise.all(
      documents
        .filter((document) => document.r2_key)
        .map(async (document) => [
          document.id,
          await issueCsrf(user.email, `batch:delete-original:${document.id}`, 60),
        ] as const),
    ),
  );
  const ocrEnabled = Boolean(getBindings().OPENAI_API_KEY?.trim());

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow={`${batch.organization_name} · ${batch.campaign_name}`}
        title={batch.name}
        description={`Forma ${batch.requested_form === "auto" ? "por detectar" : batch.requested_form} · creado ${formatDateTime(batch.created_at)}`}
        action={<><Link className="button button-secondary" href="/lotes">Todos los lotes</Link><a className="button button-primary" href={`/api/admin/batches/${id}/export`}>Exportar tabulación</a></>}
      />
      {query.created && <Notice tone="success">Se guardaron {query.created} PDF en almacenamiento privado.</Notice>}
      {query.processed && <Notice tone="success">La lectura quedó lista para revisión profesional.</Notice>}
      {query.tabulated && <Notice tone="success">Tabulación confirmada.</Notice>}
      {query.scored && <Notice tone="success">Plantilla demostrativa calificada e incorporada a la campaña.</Notice>}
      {query.deleted && <Notice tone="success">El PDF original fue eliminado; la tabulación y la auditoría permanecen.</Notice>}
      {query.warning && <Notice tone="warning">{query.warning}</Notice>}
      {query.error && <Notice tone="danger">{query.error}</Notice>}
      {!ocrEnabled && pending.length > 0 && (
        <Notice tone="warning">Configura <code>OPENAI_API_KEY</code> como secreto del Site para habilitar la lectura de los PDF guardados.</Notice>
      )}

      <section className="metrics-grid batch-metrics">
        <Metric label="Documentos" value={documents.length} detail="en el lote" />
        <Metric label="Pendientes" value={pending.length} detail="por procesar" tone="teal" />
        <Metric label="Por revisar" value={needsReview} detail="borradores" tone="gold" />
        <Metric label="Confirmados" value={confirmed} detail="tabulados o demo" tone="aqua" />
        <Metric label="Con error" value={failed} detail="reintentables" tone="gold" />
      </section>

      {ocrEnabled && pendingWithCsrf.length > 0 && (
        <section className="card processor-card">
          <BatchProcessor batchId={id} documents={pendingWithCsrf} />
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <div><h2>Documentos</h2><p>Revisa toda lectura antes de confirmar</p></div>
          <span className="retention-note">{batch.delete_originals_after_confirmation ? "Originales: eliminar al confirmar" : "Originales: conservar"}</span>
        </div>
        {documents.length ? (
          <div className="table-wrap">
            <table className="batch-table">
              <thead><tr><th>Archivo</th><th>Origen</th><th>Lectura</th><th>Confianza</th><th>Ítems</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {documents.map((document) => {
                  const documentWarnings = warnings(document.warnings_json);
                  const processToken = pendingWithCsrf.find((item) => item.id === document.id)?.csrf;
                  return (
                    <tr key={document.id}>
                      <td><span className="cell-stack"><strong>{document.original_name}</strong><small>{Math.max(1, Math.round(document.byte_size / 1024))} KB · {formatDateTime(document.created_at)}</small>{document.error_message && <small className="text-danger">{document.error_message}</small>}{documentWarnings[0] && <small className="text-warning">{documentWarnings[0]}</small>}</span></td>
                      <td>{document.source_type === "drive" ? "Drive" : "Carga"}</td>
                      <td><span className="cell-stack"><strong>{document.participant_code || "—"}</strong><small>{document.detected_form && document.detected_form !== "unknown" ? `Forma ${document.detected_form}` : "Forma sin confirmar"}</small></span></td>
                      <td><span className={`confidence confidence-${confidenceLabel(document.document_confidence).toLowerCase()}`}>{confidenceLabel(document.document_confidence)}{document.document_confidence !== null ? ` · ${Math.round(document.document_confidence * 100)}%` : ""}</span></td>
                      <td>{document.answer_count || "—"}</td>
                      <td><StatusPill value={document.status} /></td>
                      <td>
                        <div className="table-actions">
                          {["review", "reviewed", "tabulated", "scored"].includes(document.status) && <Link className="table-link" href={`/lotes/${id}/documentos/${document.id}`}>{document.status === "scored" ? "Ver" : "Revisar"}</Link>}
                          {processToken && ocrEnabled && <form action={`/api/admin/batches/${id}/documents/${document.id}/process`} method="post"><input type="hidden" name="csrf" value={processToken} /><button className="table-link" type="submit">{document.status === "failed" ? "Reintentar" : "Procesar"}</button></form>}
                          {document.r2_key && <a className="table-link" href={`/api/admin/batches/${id}/documents/${document.id}/file`} target="_blank" rel="noreferrer">PDF</a>}
                          {document.r2_key && <form action={`/api/admin/batches/${id}/documents/${document.id}/delete`} method="post"><input type="hidden" name="csrf" value={deleteTokens.get(document.id)} /><button className="table-link table-link-danger" type="submit">Eliminar original</button></form>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Lote vacío" text="No se guardó ningún documento en este lote." />}
      </section>
    </AppShell>
  );
}
