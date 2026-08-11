import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { Notice } from "@/components/Ui";
import { getAuthorizedUser } from "@/lib/auth";
import { issueCsrf } from "@/lib/security";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const user = await getAuthorizedUser({ allowPasswordChangeRequired: true });
  if (!user) redirect("/");
  const csrf = await issueCsrf(user.email, "password:change", 15);

  return (
    <main className="login-page">
      <section className="login-showcase" aria-labelledby="change-product-title">
        <div className="login-orb login-orb-one" />
        <div className="login-orb login-orb-two" />
        <header className="login-brand">
          <Brand />
          <span>Aplicativo V3</span>
        </header>
        <div className="login-showcase-copy">
          <p className="eyebrow">Protección de la cuenta</p>
          <h1 id="change-product-title">
            Tu acceso.
            <span>Tu contraseña.</span>
          </h1>
          <p>
            La clave temporal permite el ingreso inicial. Define ahora una
            contraseña personal para proteger la información de las evaluaciones.
          </p>
          <div className="login-highlights" aria-label="Requisitos de seguridad">
            <article>
              <span aria-hidden="true">01</span>
              <div><strong>Mínimo 12 caracteres</strong><small>Usa una frase o combinación fácil de recordar para ti.</small></div>
            </article>
            <article>
              <span aria-hidden="true">02</span>
              <div><strong>Combinación segura</strong><small>Incluye al menos tres grupos entre mayúsculas, minúsculas, números y símbolos.</small></div>
            </article>
            <article>
              <span aria-hidden="true">03</span>
              <div><strong>Cambio inmediato</strong><small>La clave temporal deja de funcionar al guardar la nueva contraseña.</small></div>
            </article>
          </div>
        </div>
        <footer className="login-showcase-footer">
          <span>BRPS 2026 · Ruiz</span>
          <span>Uso profesional autorizado</span>
        </footer>
      </section>

      <section className="login-panel" aria-labelledby="change-title">
        <div className="login-panel-inner">
          <div className="login-mobile-brand"><Brand /></div>
          <div className="login-card">
            <div className="login-lock" aria-hidden="true"><span /></div>
            <p className="eyebrow">Cambio obligatorio</p>
            <h2 id="change-title">Crea tu contraseña</h2>
            <p className="login-intro">
              Hola, <strong>{user.displayName}</strong>. Para continuar debes
              reemplazar la clave temporal por una contraseña personal.
            </p>

            {query.error && <Notice tone="danger">{query.error}</Notice>}

            <form className="login-form" action="/api/auth/change-password" method="post">
              <input type="hidden" name="csrf" value={csrf} />
              <div className="field">
                <label htmlFor="new-password">Nueva contraseña</label>
                <div className="login-input-field">
                  <span aria-hidden="true">••</span>
                  <input
                    id="new-password"
                    name="password"
                    type="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    autoFocus
                    placeholder="Crea una contraseña segura"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="new-password-confirmation">Confirmar contraseña</label>
                <div className="login-input-field">
                  <span aria-hidden="true">••</span>
                  <input
                    id="new-password-confirmation"
                    name="passwordConfirmation"
                    type="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder="Repite la nueva contraseña"
                  />
                </div>
              </div>
              <button className="button button-primary login-submit" type="submit">
                Guardar y continuar
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <div className="login-help">
              <strong>La nueva contraseña debe ser diferente</strong>
              <p>Al guardarla se cerrará la vigencia de la clave temporal y de cualquier sesión anterior.</p>
            </div>
            <p className="login-attempt-note"><a href="/api/auth/signout">Cancelar y cerrar sesión</a></p>
          </div>
          <div className="login-security-note">
            <span aria-hidden="true">✓</span>
            <p><strong>Contraseña protegida</strong> · Se almacena únicamente como un hash irreversible.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
