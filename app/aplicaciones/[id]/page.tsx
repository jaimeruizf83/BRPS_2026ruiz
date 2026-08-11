import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EmptyState, Notice, PageHeader, RiskPill, StatusPill } from "@/components/Ui";
import { all, one } from "@/db";
import { canManage, canViewIndividual, hasOrganizationAccess, requireAuthorizedUser } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { ROLE_LEVELS } from "@/lib/instruments";
import { issueCsrf } from "@/lib/security";
import type { ScoreResult } from "@/lib/types";
import type { V3ScoringResult } from "@/lib/v3-scoring";

export const dynamic = "force-dynamic";

type Application = {
  id: string;
  organization_id: string;
  organization_name: string;
  name: string;
  description: string;
  status: string;
  internal_code: string | null;
  cutoff_date: string | null;
  technical_responsible: string | null;
  battery_version: string | null;
};
type Participant = { id: string; participant_code: string; instrument_form: "A" | "B"; status: string; created_at: string; submission_id: string | null; completed_at: string | null; results_json: string | null };
type ManualEvaluation = { id: string; participant_code: string; instrument_form: "A" | "B"; status: string; updated_at: string; completed_at: string | null; sociodemographic_json: string; results_json: string };

function readV3Result(value: string) {
  try {
    const parsed = JSON.parse(value) as V3ScoringResult;
    return parsed?.engineVersion && parsed?.general ? parsed : null;
  } catch {
    return null;
  }
}

export default async function ApplicationDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invite?: string; created?: string; error?: string; updated?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireAuthorizedUser(`/aplicaciones/${id}`);
  const application = await one<Application>(
    `SELECT campaigns.*,organizations.name AS organization_name,
      application_profiles.internal_code,application_profiles.cutoff_date,
      application_profiles.technical_responsible,application_profiles.battery_version
     FROM campaigns JOIN organizations ON organizations.id=campaigns.organization_id
     LEFT JOIN application_profiles ON application_profiles.campaign_id=campaigns.id
     WHERE campaigns.id=?`,
    id,
  );
  if (!application || !hasOrganizationAccess(user, application.organization_id)) notFound();
  const participants = await all<Participant>(
    `SELECT participants.*,submissions.id AS submission_id,submissions.completed_at,submissions.results_json
     FROM participants LEFT JOIN submissions ON submissions.participant_id=participants.id
     WHERE participants.campaign_id=? ORDER BY participants.created_at DESC`,
    id,
  );
  const manualEvaluations = await all<ManualEvaluation>(
    `SELECT id,participant_code,instrument_form,status,updated_at,completed_at,sociodemographic_json,results_json
     FROM manual_evaluations WHERE campaign_id=? ORDER BY updated_at DESC`,
    id,
  );
  const completed = participants.filter((participant) => participant.status === "completed").length + manualEvaluations.filter((evaluation) => evaluation.status === "completed").length;
  const total = participants.length + manualEvaluations.length;
  const completion = total ? Math.round((completed / total) * 100) : 0;
  const participantCsrf = canManage(user) ? await issueCsrf(user.email, `participant:create:${id}`) : "";
  const statusCsrf = canManage(user) ? await issueCsrf(user.email, `application:status:${id}`) : "";
  let inviteUrl = "";
  if (query.invite) {
    const h = await headers();
    const host = h.get("host");
    inviteUrl = host ? `${h.get("x-forwarded-proto") || "https"}://${host}/evaluar/${query.invite}` : `/evaluar/${query.invite}`;
  }

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow={`${application.organization_name} · ${application.internal_code || "Aplicación existente"}`}
        title={application.name}
        description={application.description || "Aplicación de la Batería de Riesgo Psicosocial."}
        action={
          <>
            {canViewIndividual(user) && <Link className="button button-primary" href={`/aplicaciones/${id}/registro-manual`}>+ Registro manual V3</Link>}
            {canViewIndividual(user) && <Link className="button button-secondary" href="/lotes#nuevo">Cargar lote</Link>}
            <Link className="button button-secondary" href={`/reportes/${id}`}>Reporte colectivo</Link>
            {canViewIndividual(user) && <a className="button button-secondary" href={`/api/admin/applications/${id}/export`}>Exportar captura</a>}
          </>
        }
      />
      {query.created && <Notice tone="success">Aplicación V3 creada. Ya puedes registrar evaluaciones manualmente.</Notice>}
      {query.updated && <Notice tone="success">Estado actualizado correctamente.</Notice>}
      {query.error && <Notice tone="danger">{query.error}</Notice>}
      {inviteUrl && <div className="notice notice-success"><strong>Invitación creada.</strong> Copia ahora este enlace: se muestra una sola vez.<div className="code-box" style={{ marginTop: ".7rem" }}><label htmlFor="invite-url">Enlace único</label><input id="invite-url" readOnly value={inviteUrl} /></div></div>}

      <section className="card">
        <div className="card-body">
          <div className="detail-grid application-detail-grid">
            <div className="detail-item"><small>Versión</small><strong>{application.battery_version || "V3 pendiente de configurar"}</strong></div>
            <div className="detail-item"><small>Fecha de corte</small><strong>{formatDate(application.cutoff_date)}</strong></div>
            <div className="detail-item"><small>Responsable técnico</small><strong>{application.technical_responsible || "Sin registrar"}</strong></div>
            <div className="detail-item"><small>Estado</small><strong><StatusPill value={application.status} /></strong></div>
            <div className="detail-item"><small>Avance</small><strong>{completion}% · {completed} de {total}</strong></div>
          </div>
          {canManage(user) && (
            <form className="status-form" action={`/api/admin/applications/${id}/status`} method="post">
              <input type="hidden" name="csrf" value={statusCsrf} />
              <label htmlFor="application-status">Cambiar estado</label>
              <select id="application-status" name="status" defaultValue={application.status}><option value="draft">Borrador</option><option value="active">Activa</option><option value="closed">Cerrada</option></select>
              <button className="button button-secondary button-small" type="submit">Actualizar</button>
            </form>
          )}
        </div>
      </section>

      <section className="card detail-content">
        <div className="card-header"><div><h2>Registros manuales V3</h2><p>Ficha general, Intralaboral A/B, Extralaboral y Estrés</p></div>{canViewIndividual(user) && <Link className="table-link" href={`/aplicaciones/${id}/registro-manual`}>Administrar →</Link>}</div>
        {manualEvaluations.length ? (
          <div className="table-wrap"><table><thead><tr><th>Código</th><th>Forma</th><th>Estado</th><th>Resultado general</th><th>Actualización</th><th /></tr></thead><tbody>
            {manualEvaluations.map((evaluation) => {
              const result = readV3Result(evaluation.results_json);
              return <tr key={evaluation.id}><td><strong>{evaluation.participant_code}</strong></td><td><span className="form-badge">{evaluation.instrument_form}</span></td><td><StatusPill value={evaluation.status} /></td><td>{result ? <RiskPill level={result.general.risk?.key} label={`${result.general.score?.toFixed(1) ?? "—"} · ${result.general.risk?.label ?? "No calculable"}`} /> : "—"}</td><td>{formatDateTime(evaluation.completed_at || evaluation.updated_at)}</td><td>{canViewIndividual(user) && <Link className="table-link" href={`/aplicaciones/${id}/registro-manual/${evaluation.id}?paso=${evaluation.status === "completed" ? "revision" : "datos"}`}>{evaluation.status === "completed" ? "Ver resultado" : "Continuar"}</Link>}</td></tr>;
            })}
          </tbody></table></div>
        ) : (
          <EmptyState title="Sin registros manuales" text="Inicia la captura del primer formato físico o diligenciado fuera de línea." href={canViewIndividual(user) ? `/aplicaciones/${id}/registro-manual` : undefined} action={canViewIndividual(user) ? "Registrar evaluación" : undefined} />
        )}
      </section>

      <div className="content-grid detail-content">
        <section className="card">
          <div className="card-header"><div><h2>Invitaciones digitales</h2><p>Códigos seudónimos y respuestas en línea</p></div></div>
          {participants.length ? (
            <div className="table-wrap"><table><thead><tr><th>Código</th><th>Forma</th><th>Estado</th><th>Resultado demo</th><th>Fecha</th><th /></tr></thead><tbody>
              {participants.map((participant) => {
                const result = participant.results_json ? JSON.parse(participant.results_json) as ScoreResult : null;
                return <tr key={participant.id}><td><strong>{participant.participant_code}</strong></td><td><span className="form-badge">{participant.instrument_form}</span></td><td><StatusPill value={participant.status} /></td><td>{result ? <RiskPill level={result.total.risk.key} label={`${result.total.score} · ${result.total.risk.label}`} /> : "—"}</td><td>{formatDateTime(participant.completed_at || participant.created_at)}</td><td>{participant.submission_id && canViewIndividual(user) ? <Link className="table-link" href={`/resultados/${participant.submission_id}`}>Detalle</Link> : ""}</td></tr>;
              })}
            </tbody></table></div>
          ) : (
            <EmptyState title="Sin invitaciones" text="También puedes entregar un enlace de un solo uso para diligenciamiento digital." />
          )}
        </section>
        <aside>
          <section className="card" id="invitar">
            <div className="card-header"><div><h2>Nueva invitación</h2><p>Un enlace de un solo uso</p></div></div>
            <div className="card-body">
              {!canManage(user) ? <Notice>Tu rol no permite crear invitaciones.</Notice> : application.status === "closed" ? <Notice tone="warning">La aplicación está cerrada.</Notice> : (
                <form className="form-grid" action="/api/admin/participants" method="post">
                  <input type="hidden" name="csrf" value={participantCsrf} />
                  <input type="hidden" name="applicationId" value={id} />
                  <div className="field field-full"><label htmlFor="participant-code">Código seudónimo *</label><input id="participant-code" name="participantCode" required maxLength={40} placeholder="P-001" /><small>No uses cédula ni correo.</small></div>
                  <div className="field field-full"><label htmlFor="role-level">Nivel del cargo *</label><select id="role-level" name="roleLevel" required>{ROLE_LEVELS.map((role) => <option key={role.value} value={role.value}>{role.label} · Forma {role.form}</option>)}</select></div>
                  <div className="form-actions"><button className="button button-primary button-block" type="submit">Generar enlace único</button></div>
                </form>
              )}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
