import { clearPasswordSessionCookie } from "@/lib/security";

export async function GET(request: Request) {
  const response = Response.redirect(new URL("/", request.url), 302);
  response.headers.append("Set-Cookie", clearPasswordSessionCookie());
  response.headers.set("Cache-Control", "no-store");
  return response;
}
