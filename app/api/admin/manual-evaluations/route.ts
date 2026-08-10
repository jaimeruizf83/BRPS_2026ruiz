import { audit, one, run } from "@/db";
import { canViewIndividual, hasOrganizationAccess } from "@/lib/auth";
import { authenticatedForm, isResponse, redirectTo, textField } from "@/lib/http";
import type { RoleLevel } from "@/lib/types";
import { formForRole } from "@/lib/v3";

const ROLE_LEVELS = new Set<RoleLevel>([
  "leadership",
  "professional_technical",
  "assistant",
  "operator",
]);

export async function POST(request: Request) {
  let applicationId = "";
  try {
    const form = await request.formData();
    applicationId = textField(form, "applicationId", { required: true, max: 80 });
    const user = await authenticatedForm(request, form, `manual-evaluation:create:${applicationId}`);
    if (isResponse(user)) return user;
    if (!canViewIndividual(user)) return new Response("Permiso insuficiente", { status: 403 });

    const application = await one<{ organization_id: string; status: string }>(
      "SELECT organization_id,status FROM campaigns WHERE id=?",
      applicationId,
    );
    if (!application || !hasOrganizationAccess(user, application.organization_id)) {
      return new Response("Aplicación no autorizada", { status: 403 });
    }
    if (application.status === "closed") throw new Error("La aplicación está cerrada");

    const participantCode = textField(form, "participantCode", { required: true, max: 40 });
    if (!/^[\p{L}\p{N}._-]+$/u.test(participantCode)) {
      throw new Error("El código solo puede contener letras, números, punto, guion o guion bajo");
    }
    const roleLevel = textField(form, "roleLevel", { required: true, max: 40 }) as RoleLevel;
    if (!ROLE_LEVELS.has(roleLevel)) throw new Error("Nivel del cargo inválido");

    const duplicate = await one<{ source: string }>(
      `SELECT 'manual' AS source FROM manual_evaluations WHERE campaign_id=? AND participant_code=?
       UNION ALL
       SELECT 'invitation' AS source FROM participants WHERE campaign_id=? AND participant_code=?
       LIMIT 1`,
      applicationId,
      participantCode,
      applicationId,
      participantCode,
    );
    if (duplicate) throw new Error("Ese código ya está registrado en esta aplicación");

    const id = crypto.randomUUID();
    const instrumentForm = formForRole(roleLevel);
    await run(
      `INSERT INTO manual_evaluations
        (id,campaign_id,participant_code,role_level,instrument_form,evaluator_email,supervises_people)
       VALUES (?,?,?,?,?,?,?)`,
      id,
      applicationId,
      participantCode,
      roleLevel,
      instrumentForm,
      user.email,
      roleLevel === "leadership" ? 1 : 0,
    );
    await audit(user.email, "manual_evaluation.created", "manual_evaluation", id, {
      applicationId,
      participantCode,
      instrumentForm,
      batteryVersion: "V3",
    });
    return redirectTo(request, `/aplicaciones/${applicationId}/registro-manual/${id}`, {
      paso: "datos",
      created: "1",
    });
  } catch (error) {
    return redirectTo(request, applicationId ? `/aplicaciones/${applicationId}/registro-manual` : "/aplicaciones", {
      error: error instanceof Error ? error.message : "No fue posible iniciar la captura",
    });
  }
}
