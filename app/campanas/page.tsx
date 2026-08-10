import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { EmptyState, Notice, PageHeader, StatusPill } from "@/components/Ui";
import { all } from "@/db";
import { canManage, requireAuthorizedUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { issueCsrf } from "@/lib/security";

export const dynamic = "force-dynamic";
type Organization = { id: string; name: string };
type Campaign = { id: string; name: string; organization_name: string; status: string; starts_on: string | null; ends_on: string | null; participant_count: number; completed_count: number };

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requireAuthorizedUser("/campanas");
  const query = await searchParams;
  const scoped = user.role === "company_admin" || user.role === "viewer";
  const organizations = scoped && user.organizationId ? await all<Organization>("SELECT id, name FROM organizations WHERE id = ?", user.organizationId) : scoped ? [] : await all<Organization>("SELECT id, name FROM organizations ORDER BY name");
  const base = `SELECT campaigns.*, organizations.name AS organization_name, COUNT(participants.id) AS participant_count, SUM(CASE WHEN participants.status = 'completed' THEN 1 ELSE 0 END) AS completed_count FROM campaigns JOIN organizations ON organizations.id = campaigns.organization_id LEFT JOIN participants ON participants.campaign_id = campaigns.id`;
  const campaigns = scoped && user.organizationId ? await all<Campaign>(`${base} WHERE campaigns.organization_id = ? GROUP BY campaigns.id ORDER BY campaigns.created_at DESC`, user.organizationId) : scoped ? [] : await all<Campaign>(`${base} GROUP BY campaigns.id ORDER BY campaigns.created_at DESC`);
  const csrf = canManage(user) ? await issueCsrf(user.email, "campaign:create") : "";
  return (
    <AppShell user={user}>
      <PageHeader eyebrow="Aplicación" title="Campañas" description="Controla periodos, invitaciones, avance y cierre de cada evaluación." />
      {query.ok && <Notice tone="success">Campaña creada correctamente.</Notice>}{query.error && <Notice tone="danger">{query.error}</Notice>}
      <div className="content-grid">
        <section className="card"><div className="card-header"><div><h2>Campañas registradas</h2><p>{campaigns.length} visibles para tu rol</p></div></div>
          {campaigns.length ? <div className="table-wrap"><table><thead><tr><th>Campaña</th><th>Periodo</th><th>Participación</th><th>Estado</th><th /></tr></thead><tbody>{campaigns.map((campaign) => { const total=Number(campaign.participant_count||0); const completed=Number(campaign.completed_count||0); const progress=total?Math.round(completed/total*100):0; return <tr key={campaign.id}><td><span className="cell-stack"><strong>{campaign.name}</strong><small>{campaign.organization_name}</small></span></td><td><span className="cell-stack"><span>{formatDate(campaign.starts_on)}</span><small>hasta {formatDate(campaign.ends_on)}</small></span></td><td><span className="cell-stack numeric"><strong>{progress}%</strong><span className="progress-track"><span style={{width:`${progress}%`}} /></span><small>{completed} de {total}</small></span></td><td><StatusPill value={campaign.status} /></td><td><Link className="table-link" href={`/campanas/${campaign.id}`}>Gestionar</Link></td></tr>; })}</tbody></table></div> : <EmptyState title="Sin campañas" text="Define tu primera campaña para generar invitaciones y registrar respuestas." />}
        </section>
        <aside><section className="card" id="nueva"><div className="card-header"><div><h2>Nueva campaña</h2><p>Planeación de la aplicación</p></div></div><div className="card-body">
          {!canManage(user) ? <Notice>Tu rol es de consulta y no puede crear campañas.</Notice> : !organizations.length ? <Notice tone="warning">Primero debes registrar una organización.</Notice> : <form className="form-grid" action="/api/admin/campaigns" method="post"><input type="hidden" name="csrf" value={csrf}/><div className="field field-full"><label htmlFor="campaign-name">Nombre *</label><input id="campaign-name" name="name" maxLength={120} required/></div><div className="field field-full"><label htmlFor="organization">Organización *</label><select id="organization" name="organizationId" required>{organizations.map((organization)=><option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></div><div className="field"><label htmlFor="startsOn">Inicio</label><input id="startsOn" name="startsOn" type="date"/></div><div className="field"><label htmlFor="endsOn">Cierre</label><input id="endsOn" name="endsOn" type="date"/></div><div className="field field-full"><label htmlFor="description">Descripción</label><textarea id="description" name="description" maxLength={500}/></div><div className="form-actions"><button className="button button-primary button-block" type="submit">Crear en borrador</button></div></form>}
        </div></section></aside>
      </div>
    </AppShell>
  );
}
