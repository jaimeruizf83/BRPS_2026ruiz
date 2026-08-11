import { formatDateTime } from "@/lib/format";
import type { V3MetricResult, V3ScoringResult } from "@/lib/v3-scoring";
import { Notice, RiskPill } from "./Ui";

function scoreLabel(metric: V3MetricResult) {
  return metric.score === null ? "—" : metric.score.toFixed(1);
}

function MetricCard({ metric }: { metric: V3MetricResult }) {
  return (
    <article className="v3-result-metric">
      <small>{metric.label}</small>
      <div><strong>{scoreLabel(metric)}</strong><span>/ 100</span></div>
      <RiskPill level={metric.risk?.key} label={metric.risk?.label ?? "No calculable"} />
    </article>
  );
}

function MetricTable({ title, metrics }: { title: string; metrics: V3MetricResult[] }) {
  return (
    <section className="card v3-result-table-card">
      <div className="card-header"><div><h2>{title}</h2><p>Puntaje bruto, transformación y baremo aplicable</p></div></div>
      <div className="table-wrap">
        <table className="v3-result-table">
          <thead><tr><th>Resultado</th><th>Bruto / factor</th><th>Transformado</th><th>Nivel</th></tr></thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric.key}>
                <td><span className="cell-stack"><strong>{metric.label}</strong>{!metric.applicable && <small>No aplica por filtro oficial · bruto 0</small>}{!metric.valid && <small className="text-danger">Resultado inválido por respuestas faltantes</small>}</span></td>
                <td className="numeric">{metric.raw === null ? "—" : `${metric.raw.toFixed(1)} / ${metric.factor}`}</td>
                <td className="numeric"><strong>{scoreLabel(metric)}</strong></td>
                <td><RiskPill level={metric.risk?.key} label={metric.risk?.label ?? "No calculable"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function V3Results({ result }: { result: V3ScoringResult }) {
  const priority = result.priority === "immediate"
    ? { tone: "danger" as const, text: "Hay resultados en riesgo alto o muy alto. Requiere intervención prioritaria o inmediata y seguimiento profesional." }
    : result.priority === "professional_review"
      ? { tone: "warning" as const, text: "Hay resultados en riesgo medio. Requiere revisión profesional, intervención sistemática y seguimiento." }
      : { tone: "success" as const, text: "Los totales no activan una prioridad elevada. Mantén los controles, la promoción y el seguimiento periódico." };

  return (
    <div className="v3-results-stack">
      <section className="v3-results-hero">
        <div>
          <p className="eyebrow">Calificación oficial · {result.engineVersion}</p>
          <h2>Resultado individual V3</h2>
          <p>Forma {result.form} · Grupo ocupacional {result.occupationalGroup} · calculado {formatDateTime(result.calculatedAt)}</p>
        </div>
        <span className="v3-engine-seal">Motor<br /><strong>V3</strong></span>
      </section>
      <div className="v3-result-metrics">
        <MetricCard metric={result.intralaboral.total} />
        <MetricCard metric={result.extralaboral.total} />
        <MetricCard metric={result.general} />
        <MetricCard metric={result.stress} />
      </div>
      <Notice tone={priority.tone}><strong>Prioridad de actuación:</strong> {priority.text}</Notice>
      <MetricTable title="Dominios intralaborales" metrics={result.intralaboral.domains} />
      <MetricTable title="Dimensiones intralaborales" metrics={result.intralaboral.dimensions} />
      <MetricTable title="Dimensiones extralaborales" metrics={result.extralaboral.dimensions} />
      <Notice>
        La clasificación apoya la interpretación de la batería, pero no reemplaza el juicio del profesional responsable ni constituye un diagnóstico clínico individual.
      </Notice>
    </div>
  );
}
