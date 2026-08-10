import Link from "next/link";
import { Brand } from "@/components/Brand";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  return (
    <main className="landing">
      <header className="landing-header">
        <Brand />
        <nav aria-label="Acceso">
          <a href="#flujo">Cómo funciona</a>
          <a href="#seguridad">Seguridad</a>
          {user ? (
            <>
              <Link className="button button-small button-ghost" href="/dashboard">
                Ir al panel
              </Link>
              <Link className="header-signout" href={chatGPTSignOutPath("/")}>
                Salir
              </Link>
            </>
          ) : (
            <Link
              className="button button-small button-ghost"
              href={chatGPTSignInPath("/dashboard")}
            >
              Ingresar
            </Link>
          )}
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Gestión psicosocial · 2026</p>
          <h1>
            Evaluaciones claras.
            <span>Decisiones responsables.</span>
          </h1>
          <p className="hero-lead">
            Organiza campañas, asigna correctamente la Forma A o B, protege la
            confidencialidad y convierte respuestas en reportes accionables.
          </p>
          <div className="hero-actions">
            <Link
              className="button button-primary"
              href={user ? "/dashboard" : chatGPTSignInPath("/dashboard")}
            >
              {user ? "Abrir panel" : "Configurar mi espacio"}
              <span aria-hidden="true">→</span>
            </Link>
            <a className="button button-link" href="#flujo">
              Conocer el flujo
            </a>
          </div>
          <div className="trust-row" aria-label="Principios de la plataforma">
            <span>✓ Acceso controlado</span>
            <span>✓ Datos seudonimizados</span>
            <span>✓ Reportes protegidos</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Vista previa del panel">
          <div className="visual-glow" />
          <div className="preview-card">
            <div className="preview-top">
              <div>
                <small>Campaña activa</small>
                <strong>Diagnóstico organizacional</strong>
              </div>
              <span className="status status-active">Activa</span>
            </div>
            <div className="completion">
              <div className="ring" aria-label="78 por ciento completado">
                <span>78%</span>
              </div>
              <div>
                <strong>Avance general</strong>
                <span>39 de 50 evaluaciones</span>
              </div>
            </div>
            <div className="risk-preview">
              <span style={{ height: "38%" }}><i>Sin riesgo</i></span>
              <span style={{ height: "52%" }}><i>Bajo</i></span>
              <span style={{ height: "70%" }}><i>Medio</i></span>
              <span style={{ height: "48%" }}><i>Alto</i></span>
              <span style={{ height: "24%" }}><i>Muy alto</i></span>
            </div>
          </div>
          <div className="float-card float-card-top">
            <span className="float-icon">A/B</span>
            <div><strong>Asignación automática</strong><small>Según nivel del cargo</small></div>
          </div>
          <div className="float-card float-card-bottom">
            <span className="float-icon float-icon-lock">⌁</span>
            <div><strong>Privacidad por diseño</strong><small>Mínimo grupal configurable</small></div>
          </div>
        </div>
      </section>

      <section className="proof-strip">
        <div><strong>01</strong><span>Campañas centralizadas</span></div>
        <div><strong>A/B</strong><span>Enrutamiento por cargo</span></div>
        <div><strong>1×</strong><span>Enlaces de un solo uso</span></div>
        <div><strong>5+</strong><span>Protección de grupos pequeños</span></div>
      </section>

      <section className="landing-section" id="flujo">
        <p className="eyebrow">Un flujo completo</p>
        <h2>De la planeación al seguimiento, en un solo lugar</h2>
        <div className="feature-grid">
          <article><span>01</span><h3>Configura</h3><p>Crea organizaciones, responsables y campañas con fechas y alcance definidos.</p></article>
          <article><span>02</span><h3>Invita</h3><p>Genera códigos seudónimos y enlaces individuales que no revelan contraseñas.</p></article>
          <article><span>03</span><h3>Evalúa</h3><p>El sistema dirige a Forma A o B, registra consentimiento y evita duplicados.</p></article>
          <article><span>04</span><h3>Actúa</h3><p>Consulta tendencias, niveles y reportes colectivos con reglas de privacidad.</p></article>
        </div>
      </section>

      <section className="security-band" id="seguridad">
        <div>
          <p className="eyebrow">Seguridad operativa</p>
          <h2>La confidencialidad no es una opción adicional.</h2>
        </div>
        <ul>
          <li><span>✓</span> Identidad administradora verificada</li>
          <li><span>✓</span> Protección CSRF y cabeceras estrictas</li>
          <li><span>✓</span> Tokens almacenados solo como hash</li>
          <li><span>✓</span> Resultados individuales con permiso especial</li>
        </ul>
      </section>

      <section className="demo-warning">
        <strong>Versión funcional con instrumento demostrativo</strong>
        <p>
          El flujo está listo para operación técnica. Antes de uso ocupacional,
          un profesional autorizado debe cargar el banco oficial licenciado y
          validar baremos, consentimiento y tratamiento de datos aplicables.
        </p>
      </section>

      <footer className="landing-footer">
        <Brand />
        <p>BRPS 2026 · Jaime Ruiz</p>
        <p>Privacidad · Trazabilidad · Responsabilidad</p>
      </footer>
    </main>
  );
}
