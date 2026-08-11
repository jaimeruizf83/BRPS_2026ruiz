import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { Notice } from "@/components/Ui";
import { getAuthorizedUser, getPasswordLoginUser } from "@/lib/auth";
import { issueCsrf } from "@/lib/security";
import {
  chatGPTSignInPath,
  getChatGPTUser,
  safeRelativeReturnPath,
} from "./chatgpt-auth";

export const dynamic = "force-dynamic";

type LoginQuery = {
  return_to?: string;
  error?: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<LoginQuery>;
}) {
  const query = await searchParams;
  const requestedPath = safeRelativeReturnPath(query.return_to || "/dashboard");
  const returnTo = requestedPath === "/" ? "/dashboard" : requestedPath;
  const identity = await getChatGPTUser();

  if (identity) {
    const authorizedUser = await getAuthorizedUser();
    if (authorizedUser) redirect(returnTo);
  }

  const passwordUser = identity ? await getPasswordLoginUser() : null;
  if (identity && !passwordUser) redirect("/acceso-denegado");

  const csrf = passwordUser?.passwordHash
    ? await issueCsrf(passwordUser.email, "password:login", 15)
    : null;
  const signInReturnTo = `/?return_to=${encodeURIComponent(returnTo)}`;

  return (
    <main className="login-page">
      <section className="login-showcase" aria-labelledby="product-title">
        <div className="login-orb login-orb-one" />
        <div className="login-orb login-orb-two" />

        <header className="login-brand">
          <Brand />
          <span>Aplicativo V3</span>
        </header>

        <div className="login-showcase-copy">
          <p className="eyebrow">Batería de riesgo psicosocial</p>
          <h1 id="product-title">
            Evaluación rigurosa.
            <span>Información protegida.</span>
          </h1>
          <p>
            Gestiona organizaciones, registra evaluaciones manuales, tabula
            instrumentos y consulta resultados desde un entorno de acceso
            controlado.
          </p>

          <div className="login-highlights" aria-label="Características principales">
            <article>
              <span aria-hidden="true">01</span>
              <div>
                <strong>Captura integral V3</strong>
                <small>Ficha sociodemográfica, Forma A o B, extralaboral y estrés.</small>
              </div>
            </article>
            <article>
              <span aria-hidden="true">02</span>
              <div>
                <strong>Calificación con trazabilidad</strong>
                <small>Motor de resultados y procesamiento de pruebas por lotes.</small>
              </div>
            </article>
            <article>
              <span aria-hidden="true">03</span>
              <div>
                <strong>Confidencialidad por diseño</strong>
                <small>Roles, sesiones protegidas y control de acceso individual.</small>
              </div>
            </article>
          </div>
        </div>

        <footer className="login-showcase-footer">
          <span>BRPS 2026 · Ruiz</span>
          <span>Uso profesional autorizado</span>
        </footer>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel-inner">
          <div className="login-mobile-brand"><Brand /></div>

          <div className="login-stepper" aria-label="Progreso del ingreso">
            <div className="is-active">
              <span>1</span>
              <small>Identidad</small>
            </div>
            <i aria-hidden="true" />
            <div className={passwordUser ? "is-active" : ""}>
              <span>2</span>
              <small>Contraseña</small>
            </div>
          </div>

          {!passwordUser ? (
            <div className="login-card">
              <div className="login-lock" aria-hidden="true"><span /></div>
              <p className="eyebrow">Acceso seguro</p>
              <h2 id="login-title">Ingresa al aplicativo</h2>
              <p className="login-intro">
                Primero verificaremos tu identidad. Solo los correos registrados
                por la administración pueden continuar.
              </p>

              <a
                className="button button-primary login-submit"
                href={chatGPTSignInPath(signInReturnTo)}
              >
                Verificar identidad e ingresar
                <span aria-hidden="true">→</span>
              </a>

              <div className="login-help">
                <strong>¿Aún no tienes acceso?</strong>
                <p>Solicita al superadministrador que registre tu correo y te asigne un rol.</p>
              </div>
            </div>
          ) : (
            <div className="login-card">
              <div className="verified-account">
                <span aria-hidden="true">
                  {passwordUser.displayName.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <small>Identidad verificada</small>
                  <strong>{passwordUser.displayName}</strong>
                  <p>{passwordUser.email}</p>
                </div>
                <a href="/api/auth/signout">Cambiar</a>
              </div>

              <p className="eyebrow">Segundo paso</p>
              <h2 id="login-title">Escribe tu contraseña</h2>
              <p className="login-intro">
                Usa la clave del aplicativo asignada por la administración para
                abrir tu panel de trabajo.
              </p>

              {query.error && <Notice tone="danger">{query.error}</Notice>}

              <form className="login-form" action="/api/auth/password" method="post">
                <input type="hidden" name="csrf" value={csrf || ""} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <div className="field">
                  <label htmlFor="access-password">Contraseña de acceso</label>
                  <div className="login-password-field">
                    <span aria-hidden="true">••</span>
                    <input
                      id="access-password"
                      name="password"
                      type="password"
                      required
                      maxLength={128}
                      autoComplete="current-password"
                      autoFocus
                      placeholder="Ingresa tu contraseña"
                    />
                  </div>
                </div>
                <button className="button button-primary login-submit" type="submit">
                  Ingresar al panel
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              <p className="login-attempt-note">
                Después de cinco intentos fallidos, el acceso se bloquea durante 15 minutos.
              </p>
            </div>
          )}

          <div className="login-security-note">
            <span aria-hidden="true">✓</span>
            <p><strong>Conexión protegida</strong> · Tu sesión y contraseña se procesan de forma segura.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
