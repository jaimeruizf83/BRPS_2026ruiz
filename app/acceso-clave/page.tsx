import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { Notice } from "@/components/Ui";
import { getPasswordLoginUser } from "@/lib/auth";
import { issueCsrf } from "@/lib/security";
import { chatGPTSignInPath, safeRelativeReturnPath } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function PasswordAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string; error?: string }>;
}) {
  const query = await searchParams;
  const returnTo = safeRelativeReturnPath(query.return_to || "/dashboard");
  const user = await getPasswordLoginUser();
  if (!user) redirect(chatGPTSignInPath(`/acceso-clave?return_to=${encodeURIComponent(returnTo)}`));
  if (!user.passwordHash) redirect(returnTo);
  const csrf = await issueCsrf(user.email, "password:login", 15);

  return (
    <main className="centered-page password-access-page">
      <Brand />
      <section className="centered-card password-access-card">
        <span className="centered-icon" aria-hidden="true">⌁</span>
        <p className="eyebrow">Acceso protegido</p>
        <h1>Ingresa tu contraseña del aplicativo</h1>
        <p>La identidad de ChatGPT ya fue verificada. Esta clave complementaria protege el acceso asignado por la administración.</p>
        {query.error && <Notice tone="danger">{query.error}</Notice>}
        <form className="form-grid" action="/api/auth/password" method="post">
          <input type="hidden" name="csrf" value={csrf} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="field field-full">
            <label htmlFor="access-password">Contraseña</label>
            <input id="access-password" name="password" type="password" required maxLength={128} autoComplete="current-password" autoFocus />
          </div>
          <div className="form-actions"><button className="button button-primary button-block" type="submit">Ingresar al aplicativo</button></div>
        </form>
        <small>Después de cinco intentos fallidos, el acceso se bloquea temporalmente durante 15 minutos.</small>
      </section>
    </main>
  );
}

