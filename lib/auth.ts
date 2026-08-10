import { redirect } from "next/navigation";
import { getBindings, one, run } from "@/db";
import {
  getChatGPTUser,
  requireChatGPTUser,
  type ChatGPTUser,
} from "@/app/chatgpt-auth";
import type { AppRole } from "./types";

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
};

function bootstrapEmails() {
  return new Set(
    (getBindings().BRPS_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function resolveUser(identity: ChatGPTUser): Promise<AuthorizedUser | null> {
  const email = identity.email.trim().toLowerCase();
  if (bootstrapEmails().has(email)) {
    const existing = await one<UserRow>(
      "SELECT id, organization_id, role, active FROM app_users WHERE email = ?",
      email,
    );
    if (!existing) {
      await run(
        `INSERT INTO app_users (id, name, email, role, active, last_login_at)
         VALUES (?, ?, ?, 'super_admin', 1, CURRENT_TIMESTAMP)`,
        crypto.randomUUID(),
        identity.displayName,
        email,
      );
    } else {
      await run(
        `UPDATE app_users
         SET name = ?, role = 'super_admin', active = 1, last_login_at = CURRENT_TIMESTAMP
         WHERE email = ?`,
        identity.displayName,
        email,
      );
    }
  } else {
    await run(
      "UPDATE app_users SET name = ?, last_login_at = CURRENT_TIMESTAMP WHERE email = ? AND active = 1",
      identity.displayName,
      email,
    );
  }

  const row = await one<UserRow>(
    "SELECT id, organization_id, role, active FROM app_users WHERE email = ?",
    email,
  );
  if (!row || !row.active) return null;
  return {
    ...identity,
    email,
    id: row.id,
    role: row.role,
    organizationId: row.organization_id,
  };
}

export async function requireAuthorizedUser(returnTo: string) {
  const identity = await requireChatGPTUser(returnTo);
  const user = await resolveUser(identity);
  if (!user) redirect("/acceso-denegado");
  return user;
}

export async function getAuthorizedUser() {
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
