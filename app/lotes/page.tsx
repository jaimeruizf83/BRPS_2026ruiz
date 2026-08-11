import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EmptyState, Metric, Notice, PageHeader, StatusPill } from "@/components/Ui";
import { all, getBindings } from "@/db";
import { canViewIndividual, requireAuthorizedUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { issueCsrf } from "@/lib/security";

export const dynamic = "force-dynamic";

type Campaign = { id: string; name: string; organization_name: string; status: string };
type Batch = {
  id: string;
  name: string;
  requested_form: string;
  status: string;
  created_at: string;
  campaign_name: string;
  organization_name: string;
  document_count: number;
  confirmed_count: number;
  review_count: number;
};

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const user = await requireAuthorizedUser("/lotes");
  if (!canViewIndividual(user)) redirect("/acceso-denegado");
  const campaigns = await all<Campaign>(
    `SELECT campaigns.id,campaigns.name,campaigns.status,organizations.name AS organization_name
     FROM campaigns JOIN organizations ON organizations.id=campaigns.organization_id
     ORDER BY organizations.name,campaigns.created_at DESC`,
  );
  const batches = await all<Batch>(
    `SELECT scoring_batches.id,scoring_batches.name,scoring_batches.requested_form,
      scoring_batches.status,scoring_batches.created_at,campaigns.name AS campaign_name,
      organizations.name AS organization_name,COUNT(batch_documents.id) AS document_count,
      SUM(CASE WHEN batch_documents.status IN ('tabulated','scored') THEN 1 ELSE 0 END) AS confirmed_count,
      SUM(CASE WHEN batch_documents.status IN ('review','reviewed') THEN 1 ELSE 0 END) AS review_count
     FROM scoring_batches
     JOIN campaigns ON campaigns.id=scoring_batches.campaign_id
     JOIN organizations ON organizations.id=campaigns.organization_id
     LEFT JOIN batch_documents ON batch_documents.batch_id=scoring_batches.id
     GROUP BY scoring_batches.id ORDER BY scoring_batches.created_at DESC`,
  );
  const csrf = await issueCsrf(user.email, "batch:create", 60);
  const totalDocuments = batches.reduce((sum, batch) => sum + Number(batch.document_count), 0);
  const confirmed = batches.reduce((sum, batch) => sum + Number(batch.confirmed_count || 0), 0);
  const pendingReview = batches.reduce((sum, batch) => sum + Number(batch.review_count || 0), 0);
  const ocrEnabled = Boolean(getBindings().OPENAI_API_KEY?.trim());

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow="Operación asistida"
        title="Calificación por lotes"
        description="Carga PDF escaneados, pretabula sus marcas y confirma cada resultado antes de incorporarlo a los reportes."
      />
      {query.error && <Notice tone="danger">{query.error}</Notice>}
      {!ocrEnabled && (
        <Notice tone="warning">
          La carga privada está disponible, pero la lectura automática requiere configurar el secreto <code>OPENAI_API_KEY</code> en el Site. Ningún PDF se procesará hasta entonces.
        </Notice>
      )}
      <Notice>
        La lectura automática crea un borrador. Una persona profesional debe compararlo con el original y confirmar la tabulación; no se toman decisiones ocupacionales sin esa revisión.
      </Notice>

      <section className="metrics-grid batch-metrics" aria-label="Indicadores de lotes">
        <Metric label="Lotes" value={batches.length} detail="creados" />
        <Metric label="Documentos" value={totalDocuments} detail="almacenados" tone="teal" />
        <Metric label="Por revisar" value={pendingReview} detail="con lectura" tone="gold" />
        <Metric label="Confirmados" value={confirmed} detail="tabulados o demo" tone="aqua" />
      </section>

      <div className="content-grid batch-content">
        <section className="card">
          <div className="card-header">
            <div><h2>Lotes recientes</h2><p>Seguimiento de carga, revisión y confirmación</p></div>
          </div>
          {batches.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Lote</th><th>Forma</th><th>Avance</th><th>Estado</th><th>Creado</th><th /></tr></thead>
                <tbody>
                  {batches.map((batch) => {
                    const count = Number(batch.document_count);
                    const done = Number(batch.confirmed_count || 0);
                    const progress = count ? Math.round((done / count) * 100) : 0;
                    return (
                      <tr key={batch.id}>
                        <td><span className="cell-stack"><strong>{batch.name}</strong><small>{batch.organization_name} · {batch.campaign_name}</small></span></td>
                        <td>{batch.requested_form === "auto" ? "Automática" : `Forma ${batch.requested_form}`}</td>
                        <td><span className="cell-stack numeric"><strong>{progress}%</strong><span className="progress-track"><span style={{ width: `${progress}%` }} /></span><small>{done} de {count}</small></span></td>
                        <td><StatusPill value={batch.status} /></td>
                        <td>{formatDateTime(batch.created_at)}</td>
                        <td><Link className="table-link" href={`/lotes/${batch.id}`}>Abrir</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Aún no hay lotes" text="Usa el formulario para cargar las primeras pruebas escaneadas." />
          )}
        </section>

        <aside>
          <section className="card" id="nuevo">
            <div className="card-header"><div><h2>Nuevo lote</h2><p>Hasta 20 PDF y 50 MB en total</p></div></div>
            <div className="card-body">
              <form className="form-grid" action="/api/admin/batches" method="post" encType="multipart/form-data">
                <input type="hidden" name="csrf" value={csrf} />
                <div className="field field-full">
                  <label htmlFor="batch-name">Nombre del lote *</label>
                  <input id="batch-name" name="name" required maxLength={100} placeholder="Aplicación agosto · sede norte" />
                </div>
                <div className="field field-full">
                  <label htmlFor="batch-application">Aplicación *</label>
                  <select id="batch-application" name="applicationId" required defaultValue="">
                    <option value="" disabled>Selecciona una aplicación</option>
                    {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.organization_name} · {campaign.name}</option>)}
                  </select>
                </div>
                <div className="field field-full">
                  <label htmlFor="batch-form">Forma esperada</label>
                  <select id="batch-form" name="requestedForm" defaultValue="auto">
                    <option value="auto">Detectar A/B</option>
                    <option value="A">Forma A</option>
                    <option value="B">Forma B</option>
                  </select>
                </div>
                <div className="field field-full upload-field">
                  <label htmlFor="batch-files">PDF desde el equipo</label>
                  <input id="batch-files" name="files" type="file" accept="application/pdf,.pdf" multiple />
                  <small>Máximo 15 MB por archivo. Solo se conserva el original durante la revisión.</small>
                </div>
                <div className="field field-full">
                  <label htmlFor="drive-links">Enlaces individuales de Google Drive</label>
                  <textarea id="drive-links" name="driveLinks" rows={4} placeholder="https://drive.google.com/file/d/…/view&#10;Un enlace compartido por línea" />
                  <small>El PDF debe estar compartido para quien tenga el enlace. Las carpetas privadas requieren una conexión OAuth aparte.</small>
                </div>
                <label className="check-row field-full">
                  <input type="checkbox" name="deleteOriginals" value="yes" defaultChecked />
                  <span><strong>Eliminar originales al confirmar</strong><small>Conserva respuestas tabuladas y auditoría, no el PDF.</small></span>
                </label>
                <div className="form-actions">
                  <button className="button button-primary button-block" type="submit">Crear lote y guardar PDF</button>
                </div>
              </form>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
