import { audit, ensureSchema, getD1, one } from "@/db";
import { hasOrganizationAccess } from "@/lib/auth";
import { authenticatedForm, isResponse, redirectTo, textField } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const user = await authenticatedForm(request, form, "application:create");
    if (isResponse(user)) return user;
    if (!["super_admin", "psychologist", "company_admin"].includes(user.role)) {
      return new Response("Permiso insuficiente", { status: 403 });
    }

    const name = textField(form, "name", { required: true, max: 120 });
    const organizationId = textField(form, "organizationId", { required: true, max: 60 });
    const internalCode = textField(form, "internalCode", { required: true, max: 60 });
    const cutoffDate = textField(form, "cutoffDate", { required: true, max: 10 });
    const technicalResponsible = textField(form, "technicalResponsible", { required: true, max: 160 });
    const description = textField(form, "description", { max: 500 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoffDate)) throw new Error("Revisa la fecha de corte");

    const organization = await one<{ id: string }>("SELECT id FROM organizations WHERE id = ?", organizationId);
    if (!organization || !hasOrganizationAccess(user, organizationId)) {
      return new Response("Organización no autorizada", { status: 403 });
    }
    const duplicate = await one<{ id: string }>(
      `SELECT campaigns.id FROM campaigns
       JOIN application_profiles ON application_profiles.campaign_id=campaigns.id
       WHERE campaigns.organization_id=? AND application_profiles.internal_code=?`,
      organizationId,
      internalCode,
    );
    if (duplicate) throw new Error("Ese código interno ya existe en la organización");

    const id = crypto.randomUUID();
    await ensureSchema();
    const db = getD1();
    await db.batch([
      db.prepare(
        `INSERT INTO campaigns
          (id,organization_id,name,description,status,starts_on,ends_on,created_by)
         VALUES (?,?,?,?,'draft',?,?,?)`,
      ).bind(id, organizationId, name, description, cutoffDate, cutoffDate, user.email),
      db.prepare(
        `INSERT INTO application_profiles
          (campaign_id,internal_code,cutoff_date,technical_responsible,battery_version)
         VALUES (?,?,?,?,'V3')`,
      ).bind(id, internalCode, cutoffDate, technicalResponsible),
    ]);
    await audit(user.email, "application.created", "application", id, {
      name,
      organizationId,
      internalCode,
      batteryVersion: "V3",
    });
    return redirectTo(request, `/aplicaciones/${id}`, { created: "1" });
  } catch (error) {
    return redirectTo(request, "/aplicaciones", {
      error: error instanceof Error ? error.message : "No fue posible crear la aplicación",
    });
  }
}
