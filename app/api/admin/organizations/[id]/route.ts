import { audit, one, run } from "@/db";
import { authenticatedForm, isResponse, redirectTo, textField } from "@/lib/http";

type Organization = { id: string; name: string };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let action = "update";
  try {
    const form = await request.formData();
    action = textField(form, "action", { required: true, max: 20 });
    if (!["update", "delete"].includes(action)) throw new Error("Acción no válida");
    const user = await authenticatedForm(request, form, `organization:${action}:${id}`);
    if (isResponse(user)) return user;

    const organization = await one<Organization>("SELECT id,name FROM organizations WHERE id=?", id);
    if (!organization) return new Response("Organización no encontrada", { status: 404 });

    if (action === "update") {
      if (!["super_admin", "psychologist"].includes(user.role)) {
        return new Response("Permiso insuficiente", { status: 403 });
      }
      const name = textField(form, "name", { required: true, max: 120 });
      const duplicate = await one<{ id: string }>(
        "SELECT id FROM organizations WHERE lower(name)=lower(?) AND id<>?",
        name,
        id,
      );
      if (duplicate) throw new Error("Ya existe otra organización con ese nombre");
      await run(
        "UPDATE organizations SET name=?,nit=?,sector=?,city=? WHERE id=?",
        name,
        textField(form, "nit", { max: 30 }),
        textField(form, "sector", { max: 100 }),
        textField(form, "city", { max: 80 }),
        id,
      );
      await audit(user.email, "organization.updated", "organization", id, {
        previousName: organization.name,
        name,
      });
      return redirectTo(request, `/organizaciones/${id}`, { updated: "1" });
    }

    if (user.role !== "super_admin") return new Response("Permiso insuficiente", { status: 403 });
    const confirmation = textField(form, "confirmation", { required: true, max: 120 });
    if (confirmation !== organization.name) throw new Error("Escribe el nombre exacto de la organización para confirmar");
    const dependencies = await one<{ applications: number; users: number }>(
      `SELECT
        (SELECT COUNT(*) FROM campaigns WHERE organization_id=?) AS applications,
        (SELECT COUNT(*) FROM app_users WHERE organization_id=?) AS users`,
      id,
      id,
    );
    if ((dependencies?.applications ?? 0) > 0 || (dependencies?.users ?? 0) > 0) {
      throw new Error("No se puede eliminar: primero reasigna o retira sus aplicaciones y usuarios");
    }
    const deleted = await run(
      `DELETE FROM organizations
       WHERE id=?
         AND NOT EXISTS (SELECT 1 FROM campaigns WHERE organization_id=?)
         AND NOT EXISTS (SELECT 1 FROM app_users WHERE organization_id=?)`,
      id,
      id,
      id,
    );
    if (!deleted.meta?.changes) throw new Error("La organización recibió nuevas dependencias y no se eliminó");
    await audit(user.email, "organization.deleted", "organization", id, { name: organization.name });
    return redirectTo(request, "/organizaciones", { deleted: "1" });
  } catch (error) {
    return redirectTo(request, `/organizaciones/${id}`, {
      error: error instanceof Error ? error.message : `No fue posible ${action === "delete" ? "eliminar" : "actualizar"} la organización`,
    });
  }
}
