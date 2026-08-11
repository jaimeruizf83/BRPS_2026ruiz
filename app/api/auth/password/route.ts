import { getChatGPTUser, safeRelativeReturnPath } from "@/app/chatgpt-auth";
import { audit, getBindings, one, run } from "@/db";
import { redirectTo } from "@/lib/http";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import type { AppRole } from "@/lib/types";
import {
  isSameOrigin,
  issuePasswordSession,
  passwordSessionCookie,
  verifyCsrf,
} from "@/lib/security";

type LoginUser = {
  id: string;
  username: string | null;
  name: string;
  email: string;
  organization_id: string | null;
  role: AppRole;
  active: number;
  password_hash: string | null;
  password_version: number;
  failed_login_count: number;
  locked_until: string | null;
};

function bootstrapEmails() {
  return new Set(
    (getBindings().BRPS_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function findUser(identifier: string) {
  return one<LoginUser>(
    `SELECT id,username,name,email,organization_id,role,active,password_hash,
            password_version,failed_login_count,locked_until
     FROM app_users
     WHERE lower(username)=? OR lower(email)=?
     LIMIT 1`,
    identifier,
    identifier,
  );
}

async function initializeBootstrapUser(
  identifier: string,
  password: string,
  current: LoginUser | null,
) {
  const identity = await getChatGPTUser();
  const email = identity?.email.trim().toLowerCase() || "";
  const isBootstrap = Boolean(
    identity &&
    bootstrapEmails().has(email) &&
    (identifier === email || current?.email.toLowerCase() === email),
  );
  if (!isBootstrap || current?.password_hash) return current;

  const passwordHash = await hashPassword(password);
  if (current) {
    await run(
      `UPDATE app_users
       SET username=COALESCE(NULLIF(username,''),lower(email)),name=?,role='super_admin',
           active=1,password_hash=?,password_version=password_version+1,
           failed_login_count=0,locked_until=NULL
       WHERE id=?`,
      identity?.displayName || current.name,
      passwordHash,
      current.id,
    );
  } else {
    await run(
      `INSERT INTO app_users
        (id,username,name,email,role,active,password_hash,password_version,failed_login_count)
       VALUES (?,lower(?),?,lower(?),'super_admin',1,?,1,0)`,
      crypto.randomUUID(),
      email,
      identity?.displayName || email,
      email,
      passwordHash,
    );
  }
  return findUser(email);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const returnTo = safeRelativeReturnPath(String(form.get("returnTo") || "/dashboard"));
  const fail = (message: string) => redirectTo(request, "/", {
    return_to: returnTo,
    error: message,
  });
  if (!isSameOrigin(request)) return new Response("Origen no permitido", { status: 403 });
  if (!(await verifyCsrf(String(form.get("csrf") || ""), "login", "password:login"))) {
    return fail("La solicitud venció. Intenta nuevamente");
  }

  const identifier = String(form.get("username") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  if (!identifier || identifier.length > 200 || !password || password.length > 128) {
    return fail("Usuario o contraseña incorrectos");
  }

  let user = await findUser(identifier);
  try {
    user = await initializeBootstrapUser(identifier, password, user);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible configurar el acceso inicial");
  }
  if (!user || !user.active || !user.password_hash) {
    return fail("Usuario o contraseña incorrectos");
  }

  if (user.locked_until) {
    const lockedUntil = Date.parse(`${user.locked_until.replace(" ", "T")}Z`);
    if (Number.isFinite(lockedUntil) && lockedUntil > Date.now()) {
      return fail("Acceso temporalmente bloqueado. Espera 15 minutos");
    }
  }

  if (!(await verifyPassword(password, user.password_hash))) {
    const failures = user.failed_login_count + 1;
    if (failures >= 5) {
      await run(
        "UPDATE app_users SET failed_login_count=0,locked_until=datetime('now','+15 minutes') WHERE id=?",
        user.id,
      );
    } else {
      await run(
        "UPDATE app_users SET failed_login_count=?,locked_until=NULL WHERE id=?",
        failures,
        user.id,
      );
    }
    await audit(user.email, "user.password_failed", "user", user.id, {
      locked: failures >= 5,
    });
    return fail(
      failures >= 5
        ? "Acceso temporalmente bloqueado. Espera 15 minutos"
        : "Usuario o contraseña incorrectos",
    );
  }

  await run(
    "UPDATE app_users SET failed_login_count=0,locked_until=NULL,last_login_at=CURRENT_TIMESTAMP WHERE id=?",
    user.id,
  );
  const token = await issuePasswordSession(
    user.id,
    user.email,
    user.password_version,
  );
  await audit(user.email, "user.password_authenticated", "user", user.id, {
    username: user.username || user.email,
  });
  const response = redirectTo(request, returnTo);
  response.headers.append("Set-Cookie", passwordSessionCookie(token));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
