import { audit, one, run } from "@/db";
import { hasOrganizationAccess } from "@/lib/auth";
import { authenticatedForm, isResponse, redirectTo, textField } from "@/lib/http";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const form = await request.formData();
    const user = await authenticatedForm(request, form, `application:status:${id}`);
    if (isResponse(user)) return user;
    if (!["super_admin", "psychologist", "company_admin"].includes(user.role)) {
      return new Response("Permiso insuficiente", { status: 403 });
    }
    const application = await one<{ organization_id: string }>(
      "SELECT organization_id FROM campaigns WHERE id=?",
      id,
    );
    if (!application || !hasOrganizationAccess(user, application.organization_id)) {
      return new Response("Aplicación no autorizada", { status: 403 });
    }
    const status = textField(form, "status", { required: true, max: 20 });
    if (!["draft", "active", "closed"].includes(status)) throw new Error("Estado inválido");
    await run("UPDATE campaigns SET status=? WHERE id=?", status, id);
    await audit(user.email, "application.status_changed", "application", id, { status });
    return redirectTo(request, `/aplicaciones/${id}`, { updated: "1" });
  } catch (error) {
    return redirectTo(request, `/aplicaciones/${id}`, {
      error: error instanceof Error ? error.message : "No fue posible cambiar el estado",
    });
  }
}
