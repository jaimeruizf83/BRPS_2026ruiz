import type { AuthorizedUser } from "./auth";
import { getAuthorizedUser } from "./auth";
import { isSameOrigin, verifyCsrf } from "./security";

export function textField(form: FormData, name: string, options: { required?: boolean; max?: number } = {}) {
  const value = String(form.get(name) ?? "").trim();
  const max = options.max ?? 200;
  if (options.required && !value) throw new Error(`El campo ${name} es obligatorio`);
  if (value.length > max) throw new Error(`El campo ${name} supera ${max} caracteres`);
  return value;
}

export function redirectTo(request: Request, path: string, params: Record<string, string> = {}) {
  const url = new URL(path, request.url);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return Response.redirect(url, 303);
}

export async function authenticatedForm(request: Request, form: FormData, purpose: string): Promise<AuthorizedUser | Response> {
  if (!isSameOrigin(request)) return new Response("Origen no permitido", { status: 403 });
  const user = await getAuthorizedUser();
  if (!user) return new Response("No autorizado", { status: 401 });
  if (!(await verifyCsrf(String(form.get("csrf") ?? ""), user.email, purpose))) {
    return new Response("Solicitud vencida o inválida", { status: 403 });
  }
  return user;
}

export function isResponse(value: AuthorizedUser | Response): value is Response {
  return value instanceof Response;
}
