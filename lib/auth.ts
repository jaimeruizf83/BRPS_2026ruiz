import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { one } from "@/db";
import type { AppRole } from "./types";
import {
  BRPS_PASSWORD_SESSION_COOKIE,
  cookieValue,
  readPasswordSession,
} from "./security";

export type AuthorizedUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  fullName: string | null;
  role: AppRole;
  organizationId: string | null;
  mustChangePassword: boolean;
};

type SessionUserRow = {
  id: string;
  username: string | null;
  name: string;
  email: string;
  organization_id: string | null;
  role: AppRole;
  active: number;
  password_hash: string | null;
  password_version: number;
  must_change_password: number;
};

function authorized(row: SessionUserRow): AuthorizedUser {
  return {
    id: row.id,
    username: row.username || row.email,
    displayName: row.name,
    email: row.email,
    fullName: row.name,
    role: row.role,
    organizationId: row.organization_id,
    mustChangePassword: Boolean(row.must_change_password),
  };
}

export async function getAuthorizedUser(
  options: { allowPasswordChangeRequired?: boolean } = {},
) {
  const requestHeaders = await headers();
  const token = cookieValue(
    requestHeaders.get("cookie"),
    BRPS_PASSWORD_SESSION_COOKIE,
  );
  const claims = await readPasswordSession(token);
  if (!claims) return null;

  const row = await one<SessionUserRow>(
    `SELECT id,username,name,email,organization_id,role,active,password_hash,password_version,
            must_change_password
     FROM app_users WHERE id=?`,
    claims.userId,
  );
  if (
    !row ||
    !row.active ||
    !row.password_hash ||
    row.email.toLowerCase() !== claims.email ||
    row.password_version !== claims.passwordVersion
  ) return null;
  const user = authorized(row);
  if (user.mustChangePassword && !options.allowPasswordChangeRequired) return null;
  return user;
}

export async function requireAuthorizedUser(returnTo: string) {
  const user = await getAuthorizedUser({ allowPasswordChangeRequired: true });
  if (!user) redirect(`/?return_to=${encodeURIComponent(returnTo)}`);
  if (user.mustChangePassword) redirect("/cambiar-clave");
  return user;
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
