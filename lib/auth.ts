import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getBindings, one, run } from "@/db";
import {
  getChatGPTUser,
  requireChatGPTUser,
  type ChatGPTUser,
} from "@/app/chatgpt-auth";
import type { AppRole } from "./types";
import {
  BRPS_PASSWORD_SESSION_COOKIE,
  cookieValue,
  verifyPasswordSession,
} from "./security";

export type AuthorizedUser = ChatGPTUser & {
  id: string;
  role: AppRole;
  organizationId: string | null;
};

type UserRow = {
  id: string;
  organization_id: string | null;
  role: AppRole;
  active: number;
  password_hash: string | null;
  password_version: number;
  failed_login_count: number;
  locked_until: string | null;
};

export type PasswordLoginUser = AuthorizedUser & {
  passwordHash: string | null;
  passwordVersion: number;
  failedLoginCount: number;
  lockedUntil: string | null;
};

function bootstrapEmails() {
  return new Set(
    (getBindings().BRPS_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function resolveUser(identity: ChatGPTUser): Promise<PasswordLoginUser | null> {
  const email = identity.email.trim().toLowerCase();
  if (bootstrapEmails().has(email)) {
    const existing = await one<UserRow>(
      "SELECT id, organization_id, role, active, password_hash, password_version, failed_login_count, locked_until FROM app_users WHERE email = ?",
      email,
    );
    if (!existing) {
      await run(
        `INSERT INTO app_users (id, name, email, role, active)
         VALUES (?, ?, ?, 'super_admin', 1)`,
        crypto.randomUUID(),
        identity.displayName,
        email,
      );
    } else {
      await run(
        `UPDATE app_users
         SET name = ?, role = 'super_admin', active = 1
         WHERE email = ?`,
        identity.displayName,
        email,
      );
    }
  } else {
    await run(
      "UPDATE app_users SET name = ? WHERE email = ? AND active = 1",
      identity.displayName,
      email,
    );
  }

  const row = await one<UserRow>(
    "SELECT id, organization_id, role, active, password_hash, password_version, failed_login_count, locked_until FROM app_users WHERE email = ?",
    email,
  );
  if (!row || !row.active) return null;
  return {
    ...identity,
    email,
    id: row.id,
    role: row.role,
    organizationId: row.organization_id,
    passwordHash: row.password_hash,
    passwordVersion: row.password_version,
    failedLoginCount: row.failed_login_count,
    lockedUntil: row.locked_until,
  };
}

function authorized(user: PasswordLoginUser): AuthorizedUser {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    organizationId: user.organizationId,
  };
}

async function hasPasswordAccess(user: PasswordLoginUser) {
  if (!user.passwordHash) return true;
  const requestHeaders = await headers();
  const token = cookieValue(requestHeaders.get("cookie"), BRPS_PASSWORD_SESSION_COOKIE);
  return verifyPasswordSession(token, {
    userId: user.id,
    email: user.email,
    passwordVersion: user.passwordVersion,
  });
}

export async function requireAuthorizedUser(returnTo: string) {
  const identity = await requireChatGPTUser(returnTo);
  const user = await resolveUser(identity);
  if (!user) redirect("/acceso-denegado");
  if (!(await hasPasswordAccess(user))) {
    redirect(`/acceso-clave?return_to=${encodeURIComponent(returnTo)}`);
  }
  await run("UPDATE app_users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?", user.id);
  return authorized(user);
}

export async function getAuthorizedUser() {
  const identity = await getChatGPTUser();
  if (!identity) return null;
  const user = await resolveUser(identity);
  if (!user || !(await hasPasswordAccess(user))) return null;
  await run("UPDATE app_users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?", user.id);
  return authorized(user);
}

export async function getPasswordLoginUser() {
  const identity = await getChatGPTUser();
  return identity ? resolveUser(identity) : null;
}

export function canManage(user: AuthorizedUser) {
  return ["super_admin", "psychologist", "company_admin"].includes(user.role);
}

export function canViewIndividual(user: AuthorizedUser) {
  return ["super_admin", "psychologist"].includes(user.role);
}

export function hasOrganizationAccess(
  user: AuthorizedUser,
  organizationId: string,
) {
  return (
    user.role === "super_admin" ||
    user.role === "psychologist" ||
    user.organizationId === organizationId
  );
}
