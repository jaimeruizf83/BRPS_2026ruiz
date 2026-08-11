import { audit, one, run } from "@/db";
import { getAuthorizedUser } from "@/lib/auth";
import { redirectTo } from "@/lib/http";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/passwords";
import {
  isSameOrigin,
  issuePasswordSession,
  passwordSessionCookie,
  verifyCsrf,
} from "@/lib/security";

type PasswordRow = {
  password_hash: string;
  password_version: number;
  must_change_password: number;
};

export async function POST(request: Request) {
  const fail = (message: string) => redirectTo(request, "/cambiar-clave", { error: message });
  if (!isSameOrigin(request)) return new Response("Origen no permitido", { status: 403 });

  const user = await getAuthorizedUser({ allowPasswordChangeRequired: true });
  if (!user) return fail("La sesión venció. Ingresa nuevamente");

  const form = await request.formData();
  if (!(await verifyCsrf(String(form.get("csrf") || ""), user.email, "password:change"))) {
    return fail("La solicitud venció. Intenta nuevamente");
  }

  const password = String(form.get("password") || "");
  const confirmation = String(form.get("passwordConfirmation") || "");
  try {
    if (password !== confirmation) throw new Error("La confirmación de la contraseña no coincide");
    validatePassword(password);
    const current = await one<PasswordRow>(
      `SELECT password_hash,password_version,must_change_password
       FROM app_users WHERE id=? AND active=1`,
      user.id,
    );
    if (!current?.password_hash) throw new Error("La cuenta ya no está disponible");
    if (await verifyPassword(password, current.password_hash)) {
      throw new Error("La nueva contraseña debe ser diferente de la clave temporal");
    }

    const passwordHash = await hashPassword(password);
    const nextVersion = current.password_version + 1;
    await run(
      `UPDATE app_users
       SET password_hash=?,password_version=?,must_change_password=0,
           failed_login_count=0,locked_until=NULL
       WHERE id=?`,
      passwordHash,
      nextVersion,
      user.id,
    );
    await audit(user.email, "user.password_changed", "user", user.id, {
      requiredChangeCompleted: Boolean(current.must_change_password),
    });

    const token = await issuePasswordSession(user.id, user.email, nextVersion);
    const response = redirectTo(request, "/dashboard");
    response.headers.append("Set-Cookie", passwordSessionCookie(token));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible cambiar la contraseña");
  }
}
