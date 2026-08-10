import Link from "next/link";
import { riskClass } from "@/lib/instruments";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-action">{action}</div>}
    </div>
  );
}

export function Metric({
  label,
  value,
  detail,
  tone = "navy",
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "navy" | "teal" | "aqua" | "gold";
}) {
  return (
    <article className={`metric metric-${tone}`}>
      <span className="metric-icon" aria-hidden="true" />
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        {detail && <span>{detail}</span>}
      </div>
    </article>
  );
}

export function StatusPill({ value }: { value: string }) {
  const labels: Record<string, string> = {
    draft: "Borrador",
    active: "Activa",
    closed: "Cerrada",
    invited: "Invitado",
    started: "Iniciado",
    completed: "Completado",
    open: "Abierto",
    uploaded: "Cargado",
    processing: "Procesando",
    review: "Por revisar",
    reviewed: "Revisado",
    tabulated: "Tabulado",
    scored: "Calificado demo",
    failed: "Con error",
  };
  return <span className={`status status-${value}`}>{labels[value] ?? value}</span>;
}

export function RiskPill({
  level,
  label,
}: {
  level?: string;
  label?: string;
}) {
  return <span className={`risk-pill ${riskClass(level)}`}>{label ?? "Sin dato"}</span>;
}

export function EmptyState({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">○</span>
      <h2>{title}</h2>
      <p>{text}</p>
      {href && action && (
        <Link className="button button-secondary" href={href}>
          {action}
        </Link>
      )}
    </div>
  );
}

export function Notice({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "warning" | "success" | "danger";
}) {
  return <div className={`notice notice-${tone}`}>{children}</div>;
}
