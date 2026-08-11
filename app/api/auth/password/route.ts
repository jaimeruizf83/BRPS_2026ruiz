import { audit, run } from "@/db";
import { safeRelativeReturnPath } from "@/app/chatgpt-auth";
import { getPasswordLoginUser } from "@/lib/auth";
import { redirectTo } from "@/lib/http";
import { verifyPassword } from "@/lib/passwords";
import {
  isSameOrigin,
  issuePasswordSession,
  passwordSessionCookie,
  verifyCsrf,
} from "@/lib/security";

export async function POST(request: Request) {
  const form = await request.formData();
  const returnTo = safeRelativeReturnPath(String(form.get("returnTo") || "/dashboard"));
  const fail = (message: string) => redirectTo(request, "/acceso-clave", { return_to: returnTo, error: message });
  if (!isSameOrigin(request)) return new Response("Origen no permitido", { status: 403 });
  const user = await getPasswordLoginUser();
  if (!user || !user.passwordHash) return fail("No fue posible verificar el acceso");
  if (!(await verifyCsrf(String(form.get("csrf") || ""), user.email, "password:login"))) {
    return fail("La solicitud venció. Intenta nuevamente");
  }
  if (user.lockedUntil) {
    const lockedUntil = Date.parse(`${user.lockedUntil.replace(" ", "T")}Z`);
    if (Number.isFinite(lockedUntil) && lockedUntil > Date.now()) {
      return fail("Acceso temporalmente bloqueado. Espera 15 minutos");
    }
  }
  const password = String(form.get("password") || "");
  if (password.length > 128 || !(await verifyPassword(password, user.passwordHash))) {
    const failures = user.failedLoginCount + 1;
    if (failures >= 5) {
      await run("UPDATE app_users SET failed_login_count=0,locked_until=datetime('now','+15 minutes') WHERE id=?", user.id);
    } else {
      await run("UPDATE app_users SET failed_login_count=?,locked_until=NULL WHERE id=?", failures, user.id);
    }
    await audit(user.email, "user.password_failed", "user", user.id, { locked: failures >= 5 });
    return fail(failures >= 5 ? "Acceso temporalmente bloqueado. Espera 15 minutos" : "La contraseña no es correcta");
  }

  await run("UPDATE app_users SET failed_login_count=0,locked_until=NULL,last_login_at=CURRENT_TIMESTAMP WHERE id=?", user.id);
  const token = await issuePasswordSession(user.id, user.email, user.passwordVersion);
  await audit(user.email, "user.password_authenticated", "user", user.id);
  const response = redirectTo(request, returnTo);
  response.headers.append("Set-Cookie", passwordSessionCookie(token));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

