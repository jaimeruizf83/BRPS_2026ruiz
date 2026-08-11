import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { EmptyState, Metric, PageHeader, StatusPill } from "@/components/Ui";
import { all, one } from "@/db";
import { requireAuthorizedUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Stats = {
  organizations: number;
  applications: number;
  active_applications: number;
  evaluations: number;
  completed: number;
};

type Application = {
  id: string;
  name: string;
  organization_name: string;
  status: string;
  cutoff_date: string | null;
  participant_count: number;
  manual_count: number;
  participant_completed: number;
  manual_completed: number;
};

export default async function Dashboard() {
  const user = await requireAuthorizedUser("/dashboard");
  const scoped = user.role === "company_admin" || user.role === "viewer";
  const organizationId = scoped ? user.organizationId : null;
  const organizationFilter = organizationId ? "WHERE campaigns.organization_id=?" : "";

  const stats = await one<Stats>(
    `SELECT
      ${organizationId ? "1" : "(SELECT COUNT(*) FROM organizations)"} AS organizations,
      (SELECT COUNT(*) FROM campaigns ${organizationFilter}) AS applications,
      (SELECT COUNT(*) FROM campaigns ${organizationFilter}${organizationFilter ? " AND" : " WHERE"} campaigns.status='active') AS active_applications,
      ((SELECT COUNT(*) FROM participants JOIN campaigns ON campaigns.id=participants.campaign_id ${organizationFilter}) +
       (SELECT COUNT(*) FROM manual_evaluations JOIN campaigns ON campaigns.id=manual_evaluations.campaign_id ${organizationFilter})) AS evaluations,
      ((SELECT COUNT(*) FROM participants JOIN campaigns ON campaigns.id=participants.campaign_id ${organizationFilter}${organizationFilter ? " AND" : " WHERE"} participants.status='completed') +
       (SELECT COUNT(*) FROM manual_evaluations JOIN campaigns ON campaigns.id=manual_evaluations.campaign_id ${organizationFilter}${organizationFilter ? " AND" : " WHERE"} manual_evaluations.status='completed')) AS completed`,
    ...(organizationId ? Array(6).fill(organizationId) : []),
  );

  const applications = await all<Application>(
    `SELECT campaigns.id,campaigns.name,campaigns.status,organizations.name AS organization_name,
      application_profiles.cutoff_date,
      (SELECT COUNT(*) FROM participants WHERE participants.campaign_id=campaigns.id) AS participant_count,
      (SELECT COUNT(*) FROM manual_evaluations WHERE manual_evaluations.campaign_id=campaigns.id) AS manual_count,
      (SELECT COUNT(*) FROM participants WHERE participants.campaign_id=campaigns.id AND participants.status='completed') AS participant_completed,
      (SELECT COUNT(*) FROM manual_evaluations WHERE manual_evaluations.campaign_id=campaigns.id AND manual_evaluations.status='completed') AS manual_completed
     FROM campaigns JOIN organizations ON organizations.id=campaigns.organization_id
     LEFT JOIN application_profiles ON application_profiles.campaign_id=campaigns.id
     ${organizationFilter} ORDER BY campaigns.created_at DESC LIMIT 8`,
    ...(organizationId ? [organizationId] : []),
  );

  const safeStats = stats ?? { organizations: 0, applications: 0, active_applications: 0, evaluations: 0, completed: 0 };
  const completion = safeStats.evaluations ? Math.round((safeStats.completed / safeStats.evaluations) * 100) : 0;

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow="Centro de control"
        title={`Hola, ${user.displayName.split(" ")[0]}`}
        description="Supervisa cada aplicación de la batería, su captura V3 y los controles de confidencialidad."
        action={<Link className="button button-primary" href="/aplicaciones#nueva">+ Nueva aplicación</Link>}
      />

      <section className="metrics-grid" aria-label="Indicadores generales">
        <Metric label="Organizaciones" value={safeStats.organizations} detail="registradas" />
        <Metric label="Aplicaciones" value={safeStats.applications} detail="en total" tone="teal" />
        <Metric label="Aplicaciones activas" value={safeStats.active_applications} detail="en curso" tone="aqua" />
        <Metric label="Evaluaciones" value={safeStats.evaluations} detail="manuales y digitales" tone="gold" />
        <Metric label="Completitud" value={`${completion}%`} detail={`${safeStats.completed} finalizadas`} tone="teal" />
      </section>

      <div className="content-grid">
        <section className="card">
          <div className="card-header"><div><h2>Aplicaciones recientes</h2><p>Avance y estado operativo</p></div><Link className="table-link" href="/aplicaciones">Ver todas →</Link></div>
          {applications.length ? (
            <div className="table-wrap"><table><thead><tr><th>Aplicación</th><th>Fecha de corte</th><th>Avance</th><th>Estado</th><th /></tr></thead><tbody>
              {applications.map((application) => {
                const total = Number(application.participant_count || 0) + Number(application.manual_count || 0);
                const completed = Number(application.participant_completed || 0) + Number(application.manual_completed || 0);
                const progress = total ? Math.round((completed / total) * 100) : 0;
                return (
                  <tr key={application.id}>
                    <td><span className="cell-stack"><strong>{application.name}</strong><small>{application.organization_name}</small></span></td>
                    <td>{formatDate(application.cutoff_date)}</td>
                    <td><span className="cell-stack numeric"><strong>{progress}%</strong><span className="progress-track"><span style={{ width: `${progress}%` }} /></span><small>{completed} de {total}</small></span></td>
                    <td><StatusPill value={application.status} /></td>
                    <td><Link className="table-link" href={`/aplicaciones/${application.id}`}>Abrir</Link></td>
                  </tr>
                );
              })}
            </tbody></table></div>
          ) : (
            <EmptyState title="Aún no hay aplicaciones" text="Registra una organización y configura la primera aplicación V3." href="/aplicaciones#nueva" action="Crear aplicación" />
          )}
        </section>

        <aside>
          <section className="card">
            <div className="card-header"><h2>Acciones rápidas</h2></div>
            <div className="card-body quick-list">
              <Link className="quick-link" href="/organizaciones#nueva"><span>+</span><div><strong>Nueva organización</strong><small>Registrar empresa y datos básicos</small></div></Link>
              <Link className="quick-link" href="/aplicaciones#nueva"><span>◎</span><div><strong>Crear aplicación</strong><small>Configurar referencia V3</small></div></Link>
              <Link className="quick-link" href="/aplicaciones"><span>✎</span><div><strong>Registro manual V3</strong><small>Elegir aplicación y capturar formatos</small></div></Link>
              <Link className="quick-link" href="/lotes#nuevo"><span>▦</span><div><strong>Calificar por lotes</strong><small>Cargar PDF y revisar tabulación</small></div></Link>
            </div>
          </section>
          <section className="card">
            <div className="card-header"><h2>Control de privacidad</h2></div>
            <div className="card-body"><div className="notice notice-info" style={{ margin: 0 }}>Los reportes colectivos se ocultan automáticamente cuando una Forma no alcanza el mínimo configurado de participantes.</div></div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
