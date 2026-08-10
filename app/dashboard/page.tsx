import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { EmptyState, Metric, PageHeader, StatusPill } from "@/components/Ui";
import { requireAuthorizedUser } from "@/lib/auth";
import { all, one } from "@/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Stats = {
  organizations: number;
  campaigns: number;
  active_campaigns: number;
  participants: number;
  completed: number;
};

type Campaign = {
  id: string;
  name: string;
  organization_name: string;
  status: string;
  starts_on: string | null;
  participant_count: number;
  completed_count: number;
};

export default async function Dashboard() {
  const user = await requireAuthorizedUser("/dashboard");
  const scoped = user.role === "company_admin" || user.role === "viewer";
  const organizationId = scoped ? user.organizationId : null;

  const stats = organizationId
    ? await one<Stats>(
        `SELECT
          1 AS organizations,
          COUNT(DISTINCT campaigns.id) AS campaigns,
          COUNT(DISTINCT CASE WHEN campaigns.status = 'active' THEN campaigns.id END) AS active_campaigns,
          COUNT(DISTINCT participants.id) AS participants,
          COUNT(DISTINCT CASE WHEN participants.status = 'completed' THEN participants.id END) AS completed
         FROM campaigns
         LEFT JOIN participants ON participants.campaign_id = campaigns.id
         WHERE campaigns.organization_id = ?`,
        organizationId,
      )
    : await one<Stats>(
        `SELECT
          (SELECT COUNT(*) FROM organizations) AS organizations,
          COUNT(DISTINCT campaigns.id) AS campaigns,
          COUNT(DISTINCT CASE WHEN campaigns.status = 'active' THEN campaigns.id END) AS active_campaigns,
          COUNT(DISTINCT participants.id) AS participants,
          COUNT(DISTINCT CASE WHEN participants.status = 'completed' THEN participants.id END) AS completed
         FROM campaigns
         LEFT JOIN participants ON participants.campaign_id = campaigns.id`,
      );

  const campaigns = organizationId
    ? await all<Campaign>(
        `SELECT campaigns.id, campaigns.name, campaigns.status, campaigns.starts_on,
          organizations.name AS organization_name,
          COUNT(participants.id) AS participant_count,
          SUM(CASE WHEN participants.status = 'completed' THEN 1 ELSE 0 END) AS completed_count
         FROM campaigns
         JOIN organizations ON organizations.id = campaigns.organization_id
         LEFT JOIN participants ON participants.campaign_id = campaigns.id
         WHERE campaigns.organization_id = ?
         GROUP BY campaigns.id
         ORDER BY campaigns.created_at DESC LIMIT 8`,
        organizationId,
      )
    : await all<Campaign>(
        `SELECT campaigns.id, campaigns.name, campaigns.status, campaigns.starts_on,
          organizations.name AS organization_name,
          COUNT(participants.id) AS participant_count,
          SUM(CASE WHEN participants.status = 'completed' THEN 1 ELSE 0 END) AS completed_count
         FROM campaigns
         JOIN organizations ON organizations.id = campaigns.organization_id
         LEFT JOIN participants ON participants.campaign_id = campaigns.id
         GROUP BY campaigns.id
         ORDER BY campaigns.created_at DESC LIMIT 8`,
      );

  const safeStats = stats ?? {
    organizations: 0,
    campaigns: 0,
    active_campaigns: 0,
    participants: 0,
    completed: 0,
  };
  const completion = safeStats.participants
    ? Math.round((safeStats.completed / safeStats.participants) * 100)
    : 0;

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow="Centro de control"
        title={`Hola, ${user.displayName.split(" ")[0]}`}
        description="Supervisa el avance, protege la confidencialidad y mantén cada campaña bajo control."
        action={<Link className="button button-primary" href="/campanas#nueva">+ Nueva campaña</Link>}
      />

      <section className="metrics-grid" aria-label="Indicadores generales">
        <Metric label="Organizaciones" value={safeStats.organizations} detail="registradas" />
        <Metric label="Campañas" value={safeStats.campaigns} detail="en total" tone="teal" />
        <Metric label="Campañas activas" value={safeStats.active_campaigns} detail="en aplicación" tone="aqua" />
        <Metric label="Participantes" value={safeStats.participants} detail="invitados" tone="gold" />
        <Metric label="Completitud" value={`${completion}%`} detail={`${safeStats.completed} finalizadas`} tone="teal" />
      </section>

      <div className="content-grid">
        <section className="card">
          <div className="card-header">
            <div><h2>Campañas recientes</h2><p>Avance y estado operativo</p></div>
            <Link className="table-link" href="/campanas">Ver todas →</Link>
          </div>
          {campaigns.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Campaña</th><th>Inicio</th><th>Avance</th><th>Estado</th><th /></tr></thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const progress = campaign.participant_count
                      ? Math.round((Number(campaign.completed_count || 0) / Number(campaign.participant_count)) * 100)
                      : 0;
                    return (
                      <tr key={campaign.id}>
                        <td><span className="cell-stack"><strong>{campaign.name}</strong><small>{campaign.organization_name}</small></span></td>
                        <td>{formatDate(campaign.starts_on)}</td>
                        <td><span className="cell-stack numeric"><strong>{progress}%</strong><span className="progress-track"><span style={{ width: `${progress}%` }} /></span><small>{campaign.completed_count || 0} de {campaign.participant_count}</small></span></td>
                        <td><StatusPill value={campaign.status} /></td>
                        <td><Link className="table-link" href={`/campanas/${campaign.id}`}>Abrir</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Aún no hay campañas" text="Crea una organización y tu primera campaña para comenzar." href="/campanas#nueva" action="Crear campaña" />
          )}
        </section>

        <aside>
          <section className="card">
            <div className="card-header"><h2>Acciones rápidas</h2></div>
            <div className="card-body quick-list">
              <Link className="quick-link" href="/organizaciones#nueva"><span>+</span><div><strong>Nueva organización</strong><small>Registrar empresa y datos básicos</small></div></Link>
              <Link className="quick-link" href="/campanas#nueva"><span>◎</span><div><strong>Crear campaña</strong><small>Definir periodo y alcance</small></div></Link>
              <Link className="quick-link" href="/lotes#nuevo"><span>▦</span><div><strong>Calificar por lotes</strong><small>Cargar PDF y revisar tabulación</small></div></Link>
              <Link className="quick-link" href="/equipo#nuevo"><span>♙</span><div><strong>Agregar responsable</strong><small>Asignar un rol de acceso</small></div></Link>
            </div>
          </section>
          <section className="card">
            <div className="card-header"><h2>Control de privacidad</h2></div>
            <div className="card-body">
              <div className="notice notice-info" style={{ margin: 0 }}>
                Los reportes colectivos se ocultan automáticamente cuando una Forma no alcanza el mínimo configurado de participantes.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
