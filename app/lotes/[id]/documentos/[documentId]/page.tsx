import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Notice, PageHeader, StatusPill } from "@/components/Ui";
import { all, one } from "@/db";
import { canViewIndividual, hasOrganizationAccess, requireAuthorizedUser } from "@/lib/auth";
import { confidenceLabel, isDemoCompatible } from "@/lib/batches";
import { INSTRUMENTS, ROLE_LEVELS } from "@/lib/instruments";
import { issueCsrf } from "@/lib/security";

export const dynamic = "force-dynamic";

type DocumentRow = {
  id: string;
  original_name: string;
  status: string;
  r2_key: string | null;
  participant_code: string | null;
  detected_form: "A" | "B" | "unknown" | null;
  role_level: string | null;
  document_confidence: number | null;
  warnings_json: string;
  error_message: string | null;
  imported_submission_id: string | null;
  batch_name: string;
  campaign_name: string;
  organization_id: string;
  organization_name: string;
};
type AnswerRow = {
  id: string;
  item_number: number;
  selected_value: number | null;
  reviewed_value: number | null;
  confidence: number;
  multiple_marks: number;
  notes: string;
};

function parseWarnings(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export default async function DocumentReview({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; documentId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id, documentId } = await params;
  const query = await searchParams;
  const user = await requireAuthorizedUser(`/lotes/${id}/documentos/${documentId}`);
  if (!canViewIndividual(user)) redirect("/acceso-denegado");
  const document = await one<DocumentRow>(
    `SELECT batch_documents.*,scoring_batches.name AS batch_name,campaigns.name AS campaign_name,
      campaigns.organization_id,organizations.name AS organization_name
     FROM batch_documents
     JOIN scoring_batches ON scoring_batches.id=batch_documents.batch_id
     JOIN campaigns ON campaigns.id=scoring_batches.campaign_id
     JOIN organizations ON organizations.id=campaigns.organization_id
     WHERE batch_documents.id=? AND batch_documents.batch_id=?`,
    documentId,
    id,
  );
  if (!document || !hasOrganizationAccess(user, document.organization_id)) notFound();
  const answers = await all<AnswerRow>(
    `SELECT id,item_number,selected_value,reviewed_value,confidence,multiple_marks,notes
     FROM batch_answers WHERE document_id=? ORDER BY item_number`,
    documentId,
  );
  const csrf = await issueCsrf(user.email, `batch:review:${documentId}`, 120);
  const warnings = parseWarnings(document.warnings_json);
  const form = document.detected_form === "A" || document.detected_form === "B"
    ? document.detected_form
    : null;
  const demoCompatible = form
    ? isDemoCompatible(answers, INSTRUMENTS[form].questions.length)
    : false;
  const immutable = document.status === "scored";

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow={`${document.organization_name} · ${document.campaign_name}`}
        title="Revisión de tabulación"
        description={`${document.batch_name} · ${document.original_name}`}
        action={<><Link className="button button-secondary" href={`/lotes/${id}`}>Volver al lote</Link>{document.r2_key && <a className="button button-primary" href={`/api/admin/batches/${id}/documents/${documentId}/file`} target="_blank" rel="noreferrer">Abrir PDF original</a>}</>}
      />
      {query.saved && <Notice tone="success">Revisión guardada. Aún no se ha confirmado ni calificado.</Notice>}
      {query.error && <Notice tone="danger">{query.error}</Notice>}
      {document.error_message && <Notice tone="danger">{document.error_message}</Notice>}
      {immutable && document.imported_submission_id && (
        <Notice tone="success">Este documento ya fue calificado con la plantilla demostrativa. <Link className="table-link" href={`/resultados/${document.imported_submission_id}`}>Ver resultado individual</Link>.</Notice>
      )}
      {!document.r2_key && <Notice tone="warning">El PDF original fue eliminado según la política de retención. La tabulación confirmada y la auditoría permanecen.</Notice>}
      <div className="review-summary">
        <article><small>Estado</small><StatusPill value={document.status} /></article>
        <article><small>Confianza del documento</small><strong>{confidenceLabel(document.document_confidence)}{document.document_confidence !== null ? ` · ${Math.round(document.document_confidence * 100)}%` : ""}</strong></article>
        <article><small>Respuestas detectadas</small><strong>{answers.length}</strong></article>
        <article><small>Plantilla demostrativa</small><strong>{demoCompatible ? "Compatible" : "No compatible"}</strong></article>
      </div>
      {warnings.map((warning) => <Notice tone="warning" key={warning}>{warning}</Notice>)}
      {!demoCompatible && (
        <Notice>
          Puedes confirmar y exportar la tabulación. La calificación solo se habilita cuando la cantidad y secuencia coinciden con el banco demostrativo; una prueba oficial requiere integrar su plantilla, clave y baremos autorizados.
        </Notice>
      )}

      <form className="review-form" action={`/api/admin/batches/${id}/documents/${documentId}/review`} method="post">
        <input type="hidden" name="csrf" value={csrf} />
        <section className="card">
          <div className="card-header"><div><h2>Identificación seudónima</h2><p>No ingreses nombres, cédulas, correos ni teléfonos</p></div></div>
          <div className="card-body form-grid">
            <div className="field">
              <label htmlFor="participant-code">Código del participante *</label>
              <input id="participant-code" name="participantCode" required maxLength={40} pattern="[A-Za-z0-9_-]+" defaultValue={document.participant_code || ""} disabled={immutable} />
            </div>
            <div className="field">
              <label htmlFor="instrument-form">Forma *</label>
              <select id="instrument-form" name="instrumentForm" defaultValue={document.detected_form || "unknown"} disabled={immutable}>
                <option value="unknown">Sin confirmar</option>
                <option value="A">Forma A</option>
                <option value="B">Forma B</option>
              </select>
            </div>
            <div className="field field-full">
              <label htmlFor="role-level">Nivel del cargo para calificación</label>
              <select id="role-level" name="roleLevel" defaultValue={document.role_level || ""} disabled={immutable}>
                <option value="">Seleccionar al calificar</option>
                {ROLE_LEVELS.map((role) => <option key={role.value} value={role.value}>{role.label} · Forma {role.form}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header"><div><h2>Matriz de respuestas</h2><p>0 es la primera opción visible y 4 la quinta, de izquierda a derecha</p></div></div>
          {answers.length ? (
            <div className="table-wrap">
              <table className="answer-review-table">
                <thead><tr><th>Ítem</th><th>Lectura automática</th><th>Confianza</th><th>Valor revisado</th><th>Observación</th></tr></thead>
                <tbody>
                  {answers.map((answer) => {
                    const original = answer.selected_value;
                    const reviewed =
                      answer.reviewed_value === null ? original : answer.reviewed_value;
                    return (
                      <tr key={answer.id} className={answer.multiple_marks || answer.confidence < 0.85 || original === null ? "answer-warning" : ""}>
                        <td><strong>{answer.item_number}</strong></td>
                        <td>{original === null ? "Sin lectura" : `Posición ${original}`}{answer.multiple_marks ? " · varias marcas" : ""}</td>
                        <td>{Math.round(answer.confidence * 100)}%</td>
                        <td>
                          <select name={`answer_${answer.id}`} defaultValue={reviewed === null || reviewed === -1 ? "" : String(reviewed)} aria-label={`Valor revisado del ítem ${answer.item_number}`} disabled={immutable}>
                            <option value="">Sin marcar / ilegible</option>
                            <option value="0">0 · Primera</option>
                            <option value="1">1 · Segunda</option>
                            <option value="2">2 · Tercera</option>
                            <option value="3">3 · Cuarta</option>
                            <option value="4">4 · Quinta</option>
                          </select>
                        </td>
                        <td>{answer.notes || (answer.confidence < 0.85 ? "Comparar con el original" : "—")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <div className="card-body"><Notice tone="warning">No hay respuestas extraídas. Vuelve al lote y procesa o reintenta el documento.</Notice></div>}
        </section>

        {!immutable && answers.length > 0 && (
          <section className="card confirmation-card">
            <div className="card-header"><div><h2>Confirmación profesional</h2><p>Guardar no incorpora resultados; confirmar sí deja trazabilidad</p></div></div>
            <div className="card-body confirmation-grid">
              <label className="check-row">
                <input type="checkbox" name="reviewConfirmed" value="yes" />
                <span><strong>Comparé la matriz con el PDF</strong><small>Corregí las marcas dudosas y confirmé el código seudónimo.</small></span>
              </label>
              <label className="check-row">
                <input type="checkbox" name="consentVerified" value="yes" />
                <span><strong>Verifiqué el soporte de consentimiento</strong><small>Obligatorio únicamente para calificar e incorporar a la aplicación.</small></span>
              </label>
              <div className="review-actions">
                <button className="button button-secondary" type="submit" name="action" value="save">Guardar revisión</button>
                <button className="button button-secondary" type="submit" name="action" value="tabulate">Confirmar solo tabulación</button>
                <button className="button button-primary" type="submit" name="action" value="score" disabled={!demoCompatible}>Calificar plantilla demo</button>
              </div>
            </div>
          </section>
        )}
      </form>
    </AppShell>
  );
}
