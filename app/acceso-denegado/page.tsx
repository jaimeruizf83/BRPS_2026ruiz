import Link from "next/link";
import { Brand } from "@/components/Brand";

export default function AccessDenied() {
  return (
    <main className="centered-page">
      <Brand />
      <div className="centered-card">
        <span className="centered-icon" aria-hidden="true">!</span>
        <p className="eyebrow">Acceso restringido</p>
        <h1>Tu identidad no está autorizada</h1>
        <p>
          Un superadministrador debe crear o activar tu usuario y asignarte un rol
          antes de entrar al panel.
        </p>
        <div className="inline-actions">
          <Link className="button button-secondary" href="/">Volver al inicio</Link>
          <Link className="button button-primary" href="/">Intentar nuevamente</Link>
        </div>
      </div>
    </main>
  );
}
