import { audit, run } from "@/db";
import { authenticatedForm, isResponse, redirectTo, textField } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const user = await authenticatedForm(request, form, "organization:create");
    if (isResponse(user)) return user;
    if (!["super_admin", "psychologist"].includes(user.role)) return new Response("Permiso insuficiente", { status: 403 });
    const name = textField(form, "name", { required: true, max: 120 });
    const id = crypto.randomUUID();
    await run("INSERT INTO organizations (id, name, nit, sector, city) VALUES (?, ?, ?, ?, ?)", id, name, textField(form, "nit", { max: 30 }), textField(form, "sector", { max: 100 }), textField(form, "city", { max: 80 }));
    await audit(user.email, "organization.created", "organization", id, { name });
    return redirectTo(request, "/organizaciones", { ok: "1" });
  } catch (error) {
    return redirectTo(request, "/organizaciones", { error: error instanceof Error ? error.message : "No fue posible crear la organización" });
  }
}
