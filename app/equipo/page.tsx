import { AppShell } from "@/components/AppShell";
import { EmptyState, Notice, PageHeader } from "@/components/Ui";
import { all } from "@/db";
import { requireAuthorizedUser } from "@/lib/auth";
import { formatDate, ROLE_LABELS } from "@/lib/format";
import { issueCsrf } from "@/lib/security";
import type { AppRole } from "@/lib/types";

export const dynamic = "force-dynamic";

type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  active: number;
  password_hash: string | null;
  organization_name: string | null;
  created_at: string;
  last_login_at: string | null;
};
type Organization = { id: string; name: string };

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requireAuthorizedUser("/equipo");
  const query = await searchParams;
  const global = user.role === "super_admin" || user.role === "psychologist";
  const users = global
    ? await all<TeamUser>(
      `SELECT app_users.*,organizations.name AS organization_name
       FROM app_users LEFT JOIN organizations ON organizations.id=app_users.organization_id
       ORDER BY app_users.active DESC,app_users.name`,
    )
    : user.organizationId
      ? await all<TeamUser>(
        `SELECT app_users.*,organizations.name AS organization_name
         FROM app_users LEFT JOIN organizations ON organizations.id=app_users.organization_id
         WHERE app_users.organization_id=? ORDER BY app_users.name`,
        user.organizationId,
      )
      : [];
  const organizations = user.role === "super_admin"
    ? await all<Organization>("SELECT id,name FROM organizations ORDER BY name")
    : [];
  const csrf = user.role === "super_admin" ? await issueCsrf(user.email, "user:create") : "";

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow="Gobierno de acceso"
        title="Equipo"
        description="Cada persona entra con su identidad verificada y, cuando está configurada, con una contraseña adicional del aplicativo."
      />
      {query.ok && <Notice tone="success">Usuario autorizado y contraseña configurada. Cualquier sesión anterior de esa clave quedó invalidada.</Notice>}
      {query.error && <Notice tone="danger">{query.error}</Notice>}
      <Notice>La contraseña es complementaria: el usuario debe ingresar primero con el mismo correo de ChatGPT que registres aquí.</Notice>

      <div className="content-grid">
        <section className="card">
          <div className="card-header"><div><h2>Usuarios autorizados</h2><p>{users.length} cuentas visibles</p></div></div>
          {users.length ? (
            <div className="table-wrap">
              <table className="team-table">
                <thead><tr><th>Persona</th><th>Rol</th><th>Organización</th><th>Contraseña</th><th>Último acceso</th><th>Estado</th></tr></thead>
                <tbody>{users.map((item) => (
                  <tr key={item.id}>
                    <td><span className="cell-stack"><strong>{item.name}</strong><small>{item.email}</small></span></td>
                    <td>{ROLE_LABELS[item.role]}</td>
                    <td>{item.organization_name || "Todas"}</td>
                    <td><span className={`status ${item.password_hash ? "status-completed" : "status-review"}`}>{item.password_hash ? "Configurada" : "Sin configurar"}</span></td>
                    <td>{formatDate(item.last_login_at || item.created_at)}</td>
                    <td><span className={`status ${item.active ? "status-active" : "status-closed"}`}>{item.active ? "Activo" : "Inactivo"}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <EmptyState title="Sin usuarios" text="Registra un correo, un rol y una contraseña para habilitar el acceso." />}
        </section>

        <aside>
          <section className="card" id="nuevo">
            <div className="card-header"><div><h2>Crear o restablecer usuario</h2><p>Correo, alcance y clave de acceso</p></div></div>
            <div className="card-body">
              {user.role !== "super_admin" ? <Notice>Solo la superadministración puede asignar accesos o restablecer contraseñas.</Notice> : (
                <form className="form-grid" action="/api/admin/users" method="post">
                  <input type="hidden" name="csrf" value={csrf} />
                  <div className="field field-full"><label htmlFor="user-name">Nombre *</label><input id="user-name" name="name" required maxLength={100} autoComplete="name" /></div>
                  <div className="field field-full"><label htmlFor="email">Correo de ChatGPT *</label><input id="email" name="email" type="email" required maxLength={200} autoComplete="email" /><small>Si el correo ya existe, se actualizan su rol, alcance y contraseña.</small></div>
                  <div className="field field-full"><label htmlFor="role">Rol *</label><select id="role" name="role" required><option value="psychologist">Profesional SST / psicología</option><option value="company_admin">Administración de empresa</option><option value="viewer">Solo lectura</option><option value="super_admin">Superadministración</option></select></div>
                  <div className="field field-full"><label htmlFor="team-organization">Organización</label><select id="team-organization" name="organizationId"><option value="">Acceso global</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select><small>Obligatoria para administración de empresa y solo lectura.</small></div>
                  <div className="field field-full"><label htmlFor="user-password">Nueva contraseña *</label><input id="user-password" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /><small>Mínimo 12 caracteres y al menos tres grupos: mayúsculas, minúsculas, números o símbolos.</small></div>
                  <div className="field field-full"><label htmlFor="user-password-confirmation">Confirmar contraseña *</label><input id="user-password-confirmation" name="passwordConfirmation" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></div>
                  <div className="form-actions"><button className="button button-primary button-block" type="submit">Guardar usuario y clave</button></div>
                </form>
              )}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
