import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { EmptyState, Notice, PageHeader, StatusPill } from "@/components/Ui";
import { all } from "@/db";
import { canManage, requireAuthorizedUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { issueCsrf } from "@/lib/security";

export const dynamic = "force-dynamic";

type Organization = { id: string; name: string };
type Application = {
  id: string;
  name: string;
  organization_name: string;
  status: string;
  cutoff_date: string | null;
  internal_code: string | null;
  invitation_count: number;
  invitation_completed: number;
  manual_count: number;
  manual_completed: number;
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireAuthorizedUser("/aplicaciones");
  const query = await searchParams;
  const scoped = user.role === "company_admin" || user.role === "viewer";
  const organizations = scoped && user.organizationId
    ? await all<Organization>("SELECT id,name FROM organizations WHERE id=?", user.organizationId)
    : scoped
      ? []
      : await all<Organization>("SELECT id,name FROM organizations ORDER BY name");
  const where = scoped && user.organizationId ? "WHERE campaigns.organization_id=?" : "";
  const applications = await all<Application>(
    `SELECT campaigns.id,campaigns.name,campaigns.status,organizations.name AS organization_name,
      application_profiles.cutoff_date,application_profiles.internal_code,
      (SELECT COUNT(*) FROM participants WHERE participants.campaign_id=campaigns.id) AS invitation_count,
      (SELECT COUNT(*) FROM participants WHERE participants.campaign_id=campaigns.id AND participants.status='completed') AS invitation_completed,
      (SELECT COUNT(*) FROM manual_evaluations WHERE manual_evaluations.campaign_id=campaigns.id) AS manual_count,
      (SELECT COUNT(*) FROM manual_evaluations WHERE manual_evaluations.campaign_id=campaigns.id AND manual_evaluations.status='completed') AS manual_completed
     FROM campaigns JOIN organizations ON organizations.id=campaigns.organization_id
     LEFT JOIN application_profiles ON application_profiles.campaign_id=campaigns.id
     ${where} ORDER BY campaigns.created_at DESC`,
    ...(where ? [user.organizationId] : []),
  );
  const csrf = canManage(user) ? await issueCsrf(user.email, "application:create") : "";

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow="Batería de Riesgo Psicosocial"
        title="Aplicaciones"
        description="Configura cada aplicación V3, registra evaluaciones y controla su cierre."
      />
      {query.error && <Notice tone="danger">{query.error}</Notice>}
      <div className="content-grid">
        <section className="card">
          <div className="card-header"><div><h2>Aplicaciones registradas</h2><p>{applications.length} visibles para tu rol</p></div></div>
          {applications.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Aplicación</th><th>Fecha de corte</th><th>Evaluaciones</th><th>Estado</th><th /></tr></thead>
                <tbody>
                  {applications.map((application) => {
                    const total = Number(application.invitation_count || 0) + Number(application.manual_count || 0);
                    const completed = Number(application.invitation_completed || 0) + Number(application.manual_completed || 0);
                    const progress = total ? Math.round((completed / total) * 100) : 0;
                    return (
                      <tr key={application.id}>
                        <td><span className="cell-stack"><strong>{application.name}</strong><small>{application.organization_name} · {application.internal_code || "Registro anterior"}</small></span></td>
                        <td>{formatDate(application.cutoff_date)}</td>
                        <td><span className="cell-stack numeric"><strong>{progress}%</strong><span className="progress-track"><span style={{ width: `${progress}%` }} /></span><small>{completed} completas de {total}</small></span></td>
                        <td><StatusPill value={application.status} /></td>
                        <td><Link className="table-link" href={`/aplicaciones/${application.id}`}>Abrir</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Sin aplicaciones" text="Configura la primera aplicación de la batería para iniciar el registro V3." />
          )}
        </section>

        <aside>
          <section className="card" id="nueva">
            <div className="card-header"><div><h2>Nueva aplicación</h2><p>Configuración básica V3</p></div></div>
            <div className="card-body">
              {!canManage(user) ? (
                <Notice>Tu rol es de consulta y no puede crear aplicaciones.</Notice>
              ) : !organizations.length ? (
                <Notice tone="warning">Primero debes registrar una organización.</Notice>
              ) : (
                <form className="form-grid" action="/api/admin/applications" method="post">
                  <input type="hidden" name="csrf" value={csrf} />
                  <div className="field field-full"><label htmlFor="application-name">Nombre de la evaluación *</label><input id="application-name" name="name" maxLength={120} placeholder="Evaluación 2026 · sede principal" required /></div>
                  <div className="field field-full"><label htmlFor="organization">Empresa o entidad *</label><select id="organization" name="organizationId" required>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></div>
                  <div className="field"><label htmlFor="internalCode">Código interno *</label><input id="internalCode" name="internalCode" maxLength={60} placeholder="BRPS-2026-01" required /></div>
                  <div className="field"><label htmlFor="cutoffDate">Fecha de corte *</label><input id="cutoffDate" name="cutoffDate" type="date" required /></div>
                  <div className="field field-full"><label htmlFor="technicalResponsible">Responsable técnico *</label><input id="technicalResponsible" name="technicalResponsible" maxLength={160} required /></div>
                  <div className="field field-full"><label htmlFor="description">Alcance u observaciones</label><textarea id="description" name="description" maxLength={500} /></div>
                  <div className="readonly-summary field-full"><span>Versión de referencia</span><strong>Aplicativo V3</strong></div>
                  <div className="form-actions"><button className="button button-primary button-block" type="submit">Crear aplicación en borrador</button></div>
                </form>
              )}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
