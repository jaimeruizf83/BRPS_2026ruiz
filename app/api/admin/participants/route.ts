import { audit, one, run } from "@/db";
import { hasOrganizationAccess } from "@/lib/auth";
import { authenticatedForm, isResponse, redirectTo, textField } from "@/lib/http";
import { FORM_BY_ROLE } from "@/lib/instruments";
import { randomToken, sha256 } from "@/lib/security";
import type { RoleLevel } from "@/lib/types";

export async function POST(request: Request) {
  let applicationId = "";
  try {
    const form = await request.formData();
    applicationId = textField(form, "applicationId", { required: true, max: 60 });
    const user = await authenticatedForm(request, form, `participant:create:${applicationId}`);
    if (isResponse(user)) return user;
    if (!["super_admin", "psychologist", "company_admin"].includes(user.role)) {
      return new Response("Permiso insuficiente", { status: 403 });
    }
    const application = await one<{ organization_id: string; status: string }>(
      "SELECT organization_id,status FROM campaigns WHERE id=?",
      applicationId,
    );
    if (!application || !hasOrganizationAccess(user, application.organization_id)) {
      return new Response("Aplicación no autorizada", { status: 403 });
    }
    if (application.status === "closed") throw new Error("La aplicación está cerrada");

    const participantCode = textField(form, "participantCode", { required: true, max: 40 });
    const roleLevel = textField(form, "roleLevel", { required: true, max: 40 }) as RoleLevel;
    const instrumentForm = FORM_BY_ROLE[roleLevel];
    if (!instrumentForm) throw new Error("Nivel de cargo inválido");
    const existingManual = await one<{ id: string }>(
      "SELECT id FROM manual_evaluations WHERE campaign_id=? AND participant_code=?",
      applicationId,
      participantCode,
    );
    if (existingManual) throw new Error("Ese código ya tiene un registro manual en la aplicación");

    const token = randomToken();
    const id = crypto.randomUUID();
    await run(
      `INSERT INTO participants
        (id,campaign_id,participant_code,role_level,instrument_form,invite_token_hash)
       VALUES (?,?,?,?,?,?)`,
      id,
      applicationId,
      participantCode,
      roleLevel,
      instrumentForm,
      await sha256(token),
    );
    await audit(user.email, "participant.invited", "participant", id, {
      applicationId,
      participantCode,
      instrumentForm,
    });
    return redirectTo(request, `/aplicaciones/${applicationId}`, { invite: token });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "No fue posible crear la invitación";
    return redirectTo(request, applicationId ? `/aplicaciones/${applicationId}` : "/aplicaciones", {
      error: raw.includes("UNIQUE") ? "Ese código ya existe en la aplicación" : raw,
    });
  }
}
