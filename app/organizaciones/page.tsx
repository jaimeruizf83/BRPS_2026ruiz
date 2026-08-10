import { AppShell } from "@/components/AppShell";
import { EmptyState, Notice, PageHeader } from "@/components/Ui";
import { all } from "@/db";
import { requireAuthorizedUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { issueCsrf } from "@/lib/security";

export const dynamic = "force-dynamic";
type Organization = { id: string; name: string; nit: string; sector: string; city: string; created_at: string; campaign_count: number };

export default async function OrganizationsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requireAuthorizedUser("/organizaciones");
  const query = await searchParams;
  const globalAccess = user.role === "super_admin" || user.role === "psychologist";
  const organizations = globalAccess
    ? await all<Organization>(`SELECT organizations.*, COUNT(campaigns.id) AS campaign_count FROM organizations LEFT JOIN campaigns ON campaigns.organization_id = organizations.id GROUP BY organizations.id ORDER BY organizations.name`)
    : user.organizationId
      ? await all<Organization>(`SELECT organizations.*, COUNT(campaigns.id) AS campaign_count FROM organizations LEFT JOIN campaigns ON campaigns.organization_id = organizations.id WHERE organizations.id = ? GROUP BY organizations.id`, user.organizationId)
      : [];
  const csrf = globalAccess ? await issueCsrf(user.email, "organization:create") : "";
  return (
    <AppShell user={user}>
      <PageHeader eyebrow="Estructura" title="Organizaciones" description="Separa aplicaciones y accesos por empresa para mantener el alcance de cada responsable." />
      {query.ok && <Notice tone="success">Organización creada correctamente.</Notice>}
      {query.error && <Notice tone="danger">{query.error}</Notice>}
      <div className="content-grid">
        <section className="card">
          <div className="card-header"><div><h2>Directorio</h2><p>{organizations.length} organizaciones visibles</p></div></div>
          {organizations.length ? <div className="table-wrap"><table><thead><tr><th>Organización</th><th>NIT</th><th>Sector / ciudad</th><th>Aplicaciones</th><th>Registro</th></tr></thead><tbody>{organizations.map((organization) => <tr key={organization.id}><td><strong>{organization.name}</strong></td><td>{organization.nit || "—"}</td><td><span className="cell-stack"><span>{organization.sector || "Sin sector"}</span><small>{organization.city || "Sin ciudad"}</small></span></td><td className="numeric">{organization.campaign_count}</td><td>{formatDate(organization.created_at)}</td></tr>)}</tbody></table></div> : <EmptyState title="Sin organizaciones" text="Registra la primera empresa para habilitar sus aplicaciones." />}
        </section>
        <aside><section className="card" id="nueva"><div className="card-header"><div><h2>Nueva organización</h2><p>Datos básicos de identificación</p></div></div><div className="card-body">
          {globalAccess ? <form className="form-grid" action="/api/admin/organizations" method="post"><input type="hidden" name="csrf" value={csrf} /><div className="field field-full"><label htmlFor="organization-name">Nombre *</label><input id="organization-name" name="name" maxLength={120} required /></div><div className="field"><label htmlFor="nit">NIT</label><input id="nit" name="nit" maxLength={30} /></div><div className="field"><label htmlFor="city">Ciudad</label><input id="city" name="city" maxLength={80} /></div><div className="field field-full"><label htmlFor="sector">Sector económico</label><input id="sector" name="sector" maxLength={100} /></div><div className="form-actions"><button className="button button-primary button-block" type="submit">Guardar organización</button></div></form> : <Notice>Tu rol puede consultar la organización asignada, pero no crear nuevas.</Notice>}
        </div></section></aside>
      </div>
    </AppShell>
  );
}
