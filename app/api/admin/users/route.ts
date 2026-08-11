import { audit, one, run } from "@/db";
import { authenticatedForm, isResponse, redirectTo, textField } from "@/lib/http";
import { hashPassword } from "@/lib/passwords";
import type { AppRole } from "@/lib/types";
import { validateUsername } from "@/lib/usernames";

const roles = new Set<AppRole>(["super_admin", "psychologist", "company_admin", "viewer"]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const user = await authenticatedForm(request, form, "user:create");
    if (isResponse(user)) return user;
    if (user.role !== "super_admin") return new Response("Permiso insuficiente", { status: 403 });

    const name = textField(form, "name", { required: true, max: 100 });
    const username = validateUsername(textField(form, "username", { required: true, max: 50 }));
    const email = textField(form, "email", { required: true, max: 200 }).toLowerCase();
    const role = textField(form, "role", { required: true, max: 40 }) as AppRole;
    const organizationId = textField(form, "organizationId", { max: 60 });
    const passwordValue = form.get("password");
    const confirmationValue = form.get("passwordConfirmation");
    const password = typeof passwordValue === "string" ? passwordValue : "";
    const confirmation = typeof confirmationValue === "string" ? confirmationValue : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("El correo no es válido");
    if (!roles.has(role)) throw new Error("El rol no es válido");
    if (["company_admin", "viewer"].includes(role) && !organizationId) {
      throw new Error("Selecciona una organización para ese rol");
    }
    if (organizationId && !await one<{ id: string }>("SELECT id FROM organizations WHERE id=?", organizationId)) {
      throw new Error("La organización no existe");
    }
    const usernameOwner = await one<{ email: string }>(
      "SELECT email FROM app_users WHERE lower(username)=? AND lower(email)<>?",
      username,
      email,
    );
    if (usernameOwner) throw new Error("Ese nombre de usuario ya está asignado");
    if (password !== confirmation) throw new Error("La confirmación de la contraseña no coincide");
    const passwordHash = await hashPassword(password);

    await run(
      `INSERT INTO app_users
        (id,organization_id,name,username,email,role,active,password_hash,password_version,failed_login_count,locked_until)
       VALUES (?,?,?,?,?,?,1,?,1,0,NULL)
       ON CONFLICT(email) DO UPDATE SET
        organization_id=excluded.organization_id,
        name=excluded.name,
        username=excluded.username,
        role=excluded.role,
        active=1,
        password_hash=excluded.password_hash,
        password_version=app_users.password_version+1,
        failed_login_count=0,
        locked_until=NULL`,
      crypto.randomUUID(),
      organizationId || null,
      name,
      username,
      email,
      role,
      passwordHash,
    );
    await audit(user.email, "user.authorized", "user", email, {
      username,
      role,
      organizationId: organizationId || null,
      passwordConfigured: true,
    });
    return redirectTo(request, "/equipo", { ok: "1" });
  } catch (error) {
    return redirectTo(request, "/equipo", {
      error: error instanceof Error ? error.message : "No fue posible autorizar el acceso",
    });
  }
}
