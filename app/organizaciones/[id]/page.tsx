import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Notice, PageHeader } from "@/components/Ui";
import { one } from "@/db";
import { hasOrganizationAccess, requireAuthorizedUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { issueCsrf } from "@/lib/security";

export const dynamic = "force-dynamic";

type Organization = {
  id: string;
  name: string;
  nit: string;
  sector: string;
  city: string;
  created_at: string;
  application_count: number;
  user_count: number;
};

export default async function OrganizationDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireAuthorizedUser(`/organizaciones/${id}`);
  const organization = await one<Organization>(
    `SELECT organizations.*,
      (SELECT COUNT(*) FROM campaigns WHERE campaigns.organization_id=organizations.id) AS application_count,
      (SELECT COUNT(*) FROM app_users WHERE app_users.organization_id=organizations.id) AS user_count
     FROM organizations WHERE organizations.id=?`,
    id,
  );
  if (!organization || !hasOrganizationAccess(user, organization.id)) notFound();
  const canEdit = ["super_admin", "psychologist"].includes(user.role);
  if (!canEdit && user.organizationId !== organization.id) redirect("/acceso-denegado");
  const updateCsrf = canEdit ? await issueCsrf(user.email, `organization:update:${id}`) : "";
  const deleteCsrf = user.role === "super_admin" ? await issueCsrf(user.email, `organization:delete:${id}`) : "";
  const canDelete = organization.application_count === 0 && organization.user_count === 0;

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow="Directorio de organizaciones"
        title={organization.name}
        description={`Registrada ${formatDate(organization.created_at)} · ${organization.application_count} aplicación(es) · ${organization.user_count} usuario(s) asignado(s)`}
        action={<Link className="button button-secondary" href="/organizaciones">Volver al directorio</Link>}
      />
      {query.updated && <Notice tone="success">Datos de la organización actualizados correctamente.</Notice>}
      {query.error && <Notice tone="danger">{query.error}</Notice>}

      <div className="content-grid organization-edit-grid">
        <section className="card">
          <div className="card-header"><div><h2>Datos de identificación</h2><p>Los cambios se aplican a todo el aplicativo.</p></div></div>
          <div className="card-body">
            {canEdit ? (
              <form className="form-grid" action={`/api/admin/organizations/${id}`} method="post">
                <input type="hidden" name="csrf" value={updateCsrf} />
                <input type="hidden" name="action" value="update" />
                <div className="field field-full"><label htmlFor="organization-name">Nombre *</label><input id="organization-name" name="name" maxLength={120} required defaultValue={organization.name} /></div>
                <div className="field"><label htmlFor="organization-nit">NIT</label><input id="organization-nit" name="nit" maxLength={30} defaultValue={organization.nit} /></div>
                <div className="field"><label htmlFor="organization-city">Ciudad</label><input id="organization-city" name="city" maxLength={80} defaultValue={organization.city} /></div>
                <div className="field field-full"><label htmlFor="organization-sector">Sector económico</label><input id="organization-sector" name="sector" maxLength={100} defaultValue={organization.sector} /></div>
                <div className="form-actions"><button className="button button-primary" type="submit">Guardar cambios</button></div>
              </form>
            ) : <Notice>Tu rol puede consultar estos datos, pero no modificarlos.</Notice>}
          </div>
        </section>

        <aside>
          <section className="card danger-zone">
            <div className="card-header"><div><h2>Eliminar organización</h2><p>Acción permanente y restringida</p></div></div>
            <div className="card-body">
              {user.role !== "super_admin" ? (
                <Notice>Solo la superadministración puede eliminar organizaciones.</Notice>
              ) : !canDelete ? (
                <Notice tone="warning">No se puede eliminar mientras existan aplicaciones o usuarios asignados. Reasigna o retira primero esas dependencias.</Notice>
              ) : (
                <form className="form-grid" action={`/api/admin/organizations/${id}`} method="post">
                  <input type="hidden" name="csrf" value={deleteCsrf} />
                  <input type="hidden" name="action" value="delete" />
                  <div className="field field-full"><label htmlFor="organization-confirmation">Escribe “{organization.name}” para confirmar</label><input id="organization-confirmation" name="confirmation" required maxLength={120} autoComplete="off" /></div>
                  <div className="form-actions"><button className="button button-danger button-block" type="submit">Eliminar organización</button></div>
                </form>
              )}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
