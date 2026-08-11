import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  CompletionMeter,
  InstrumentCapture,
  ManualStepNav,
  SociodemographicFields,
  type ManualStep,
} from "@/components/ManualEntry";
import { Notice, PageHeader, StatusPill } from "@/components/Ui";
import { V3Results } from "@/components/V3Results";
import { one } from "@/db";
import { canViewIndividual, hasOrganizationAccess, requireAuthorizedUser } from "@/lib/auth";
import { ROLE_LEVELS } from "@/lib/instruments";
import { issueCsrf } from "@/lib/security";
import {
  V3_COUNTS,
  V3_FREQUENCY_OPTIONS,
  V3_STRESS_OPTIONS,
  SOCIODEMOGRAPHIC_REQUIRED_FIELDS,
  SUPERVISOR_ITEM_NUMBERS,
  customerItemNumbers,
  intralaboralCoreCount,
  parseRecord,
  v3Completion,
} from "@/lib/v3";
import type { V3ScoringResult } from "@/lib/v3-scoring";

export const dynamic = "force-dynamic";

type Evaluation = {
  id: string;
  campaign_id: string;
  organization_id: string;
  application_name: string;
  organization_name: string;
  participant_code: string;
  role_level: "leadership" | "professional_technical" | "assistant" | "operator";
  instrument_form: "A" | "B";
  status: "draft" | "completed";
  sociodemographic_json: string;
  intralaboral_answers_json: string;
  extralaboral_answers_json: string;
  stress_answers_json: string;
  serves_customers: number | null;
  supervises_people: number;
  consent_verified: number;
  results_json: string;
  scoring_version: string | null;
  scored_at: string | null;
};

function readScoringResult(value: string) {
  try {
    const parsed = JSON.parse(value) as V3ScoringResult;
    return parsed?.engineVersion && parsed?.general && parsed?.stress ? parsed : null;
  } catch {
    return null;
  }
}

const STEPS = new Set<ManualStep>(["datos", "intralaboral", "extralaboral", "estres", "revision"]);

export default async function ManualEvaluationEntry({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; evaluationId: string }>;
  searchParams: Promise<{ paso?: string; created?: string; saved?: string; scored?: string; error?: string }>;
}) {
  const { id, evaluationId } = await params;
  const query = await searchParams;
  const user = await requireAuthorizedUser(`/aplicaciones/${id}/registro-manual/${evaluationId}`);
  if (!canViewIndividual(user)) redirect("/acceso-denegado");
  const evaluation = await one<Evaluation>(
    `SELECT manual_evaluations.*,campaigns.organization_id,campaigns.name AS application_name,
      organizations.name AS organization_name
     FROM manual_evaluations
     JOIN campaigns ON campaigns.id=manual_evaluations.campaign_id
     JOIN organizations ON organizations.id=campaigns.organization_id
     WHERE manual_evaluations.id=? AND manual_evaluations.campaign_id=?`,
    evaluationId,
    id,
  );
  if (!evaluation || !hasOrganizationAccess(user, evaluation.organization_id)) notFound();

  const requestedStep = String(query.paso || "datos") as ManualStep;
  const step: ManualStep = evaluation.status === "completed" ? "revision" : STEPS.has(requestedStep) ? requestedStep : "datos";
  const baseHref = `/aplicaciones/${id}/registro-manual/${evaluationId}`;
  const csrf = await issueCsrf(user.email, `manual-evaluation:update:${evaluationId}`, 120);
  const scoreCsrf = evaluation.status === "completed"
    ? await issueCsrf(user.email, `manual-evaluation:score:${evaluationId}`, 30)
    : "";
  const sociodemographic = parseRecord(evaluation.sociodemographic_json);
  const intralaboral = parseRecord(evaluation.intralaboral_answers_json);
  const extralaboral = parseRecord(evaluation.extralaboral_answers_json);
  const stress = parseRecord(evaluation.stress_answers_json);
  const completion = v3Completion({
    form: evaluation.instrument_form,
    sociodemographic,
    intralaboral,
    extralaboral,
    stress,
    servesCustomers: evaluation.serves_customers === null ? null : Boolean(evaluation.serves_customers),
    supervisesPeople: Boolean(evaluation.supervises_people),
    consentVerified: Boolean(evaluation.consent_verified),
  });
  const roleLabel = ROLE_LEVELS.find((role) => role.value === evaluation.role_level)?.label ?? evaluation.role_level;
  const scoringResult = readScoringResult(evaluation.results_json);

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow={`${evaluation.organization_name} · ${evaluation.application_name}`}
        title={`Captura ${evaluation.participant_code} · Forma ${evaluation.instrument_form}`}
        description="Registro manual estructurado según los instrumentos del Aplicativo V3."
        action={<><StatusPill value={evaluation.status} /><Link className="button button-secondary" href={`/aplicaciones/${id}/registro-manual`}>Guardar y salir</Link></>}
      />
      {query.created && <Notice tone="success">Registro creado. Completa primero la ficha de datos generales.</Notice>}
      {query.saved && <Notice tone="success">Borrador guardado correctamente.</Notice>}
      {query.scored && <Notice tone="success">Motor V3 ejecutado. La calificación quedó guardada con trazabilidad.</Notice>}
      {query.error && <Notice tone="danger">{query.error}</Notice>}
      <ManualStepNav baseHref={baseHref} current={step} />

      {evaluation.status === "completed" ? (
        <>
          <section className="card manual-form-card">
            <div className="card-header"><div><h2>Captura finalizada</h2><p>El registro está bloqueado para preservar su trazabilidad.</p></div></div>
            <div className="card-body">
              <Notice tone="success">La ficha y los {completion.expectedIntralaboral + V3_COUNTS.extralaboral + V3_COUNTS.stress} ítems requeridos quedaron completos.</Notice>
              <div className="review-meters">
                <CompletionMeter label={`Intralaboral Forma ${evaluation.instrument_form}`} value={completion.intraAnswered} expected={completion.expectedIntralaboral} />
                <CompletionMeter label="Extralaboral" value={completion.extraAnswered} expected={V3_COUNTS.extralaboral} />
                <CompletionMeter label="Estrés" value={completion.stressAnswered} expected={V3_COUNTS.stress} />
              </div>
              <form className="v3-score-actions" action={`/api/admin/manual-evaluations/${evaluationId}/score`} method="post">
                <input type="hidden" name="csrf" value={scoreCsrf} />
                <button className="button button-secondary" type="submit">{scoringResult ? "Recalcular con motor V3" : "Ejecutar motor de calificación V3"}</button>
                <small>{scoringResult ? `Versión almacenada: ${evaluation.scoring_version ?? scoringResult.engineVersion}` : "El registro es apto para calificación."}</small>
              </form>
            </div>
          </section>
          {scoringResult && <V3Results result={scoringResult} />}
        </>
      ) : (
        <form className="manual-entry-form" action={`/api/admin/manual-evaluations/${evaluationId}`} method="post">
          <input type="hidden" name="csrf" value={csrf} />
          <input type="hidden" name="step" value={step} />
          <section className="card manual-form-card">
            {step === "datos" && (
              <>
                <div className="card-header"><div><h2>Ficha de datos generales</h2><p>Información sociodemográfica y ocupacional</p></div><span className="v3-badge">V3 · 18 apartados</span></div>
                <div className="card-body"><SociodemographicFields values={sociodemographic} participantCode={evaluation.participant_code} roleLabel={roleLabel} form={evaluation.instrument_form} /></div>
              </>
            )}
            {step === "intralaboral" && (
              <div className="card-body manual-instrument-body">
                <InstrumentCapture
                  title={`Cuestionario intralaboral · Forma ${evaluation.instrument_form}`}
                  description={`Bloque general: transcribe los ítems 1 a ${intralaboralCoreCount(evaluation.instrument_form)} del formato oficial.`}
                  expected={intralaboralCoreCount(evaluation.instrument_form)}
                  options={V3_FREQUENCY_OPTIONS}
                  answers={intralaboral}
                />
                <section className="conditional-capture">
                  <div className="conditional-filter">
                    <div><p className="eyebrow">Pregunta de filtro oficial</p><h3>¿En su trabajo debe brindar servicio a clientes o usuarios?</h3><p>Si la respuesta es “No”, los nueve ítems siguientes deben quedar en blanco y no se consideran faltantes.</p></div>
                    <div className="binary-options">
                      <label><input id="clients-yes" type="radio" name="servesCustomers" value="yes" defaultChecked={evaluation.serves_customers === 1} required /><span>Sí</span></label>
                      <label><input id="clients-no" type="radio" name="servesCustomers" value="no" defaultChecked={evaluation.serves_customers === 0} required /><span>No</span></label>
                    </div>
                  </div>
                  <div className="conditional-items">
                    <InstrumentCapture
                      title="Atención a clientes y usuarios"
                      description="Este bloque aplica únicamente cuando la pregunta de filtro se responde afirmativamente."
                      expected={9}
                      itemNumbers={customerItemNumbers(evaluation.instrument_form)}
                      options={V3_FREQUENCY_OPTIONS}
                      answers={intralaboral}
                    />
                  </div>
                </section>
                {evaluation.instrument_form === "A" && Boolean(evaluation.supervises_people) && (
                  <section className="conditional-capture supervisor-capture">
                    <div className="conditional-filter"><div><p className="eyebrow">Jefatura con personal a cargo</p><h3>Relación con los colaboradores</h3><p>Por el nivel ocupacional registrado, los ítems 115 a 123 son obligatorios.</p></div><span className="v3-badge">Sí aplica</span></div>
                    <div className="conditional-items">
                      <InstrumentCapture title="Personas que supervisa o dirige" description="Transcribe las nueve respuestas de la sección final de la Forma A." expected={9} itemNumbers={SUPERVISOR_ITEM_NUMBERS} options={V3_FREQUENCY_OPTIONS} answers={intralaboral} />
                    </div>
                  </section>
                )}
                {evaluation.instrument_form === "A" && !Boolean(evaluation.supervises_people) && (
                  <Notice>Los ítems 115 a 123 no aplican porque el nivel registrado es profesional o técnico sin personal a cargo.</Notice>
                )}
              </div>
            )}
            {step === "extralaboral" && (
              <div className="card-body manual-instrument-body"><InstrumentCapture title="Cuestionario extralaboral" description={`Forma única de ${V3_COUNTS.extralaboral} ítems para todos los niveles ocupacionales.`} expected={V3_COUNTS.extralaboral} options={V3_FREQUENCY_OPTIONS} answers={extralaboral} /></div>
            )}
            {step === "estres" && (
              <div className="card-body manual-instrument-body"><InstrumentCapture title="Cuestionario para la evaluación del estrés · Tercera versión" description={`Registra la frecuencia marcada en cada uno de los ${V3_COUNTS.stress} ítems.`} expected={V3_COUNTS.stress} options={V3_STRESS_OPTIONS} answers={stress} /></div>
            )}
            {step === "revision" && (
              <>
                <div className="card-header"><div><h2>Control final de completitud</h2><p>No se interpreta una captura con respuestas faltantes.</p></div></div>
                <div className="card-body">
                  <div className="review-meters">
                    <CompletionMeter label="Datos generales" value={SOCIODEMOGRAPHIC_REQUIRED_FIELDS.length - completion.socioMissing.length} expected={SOCIODEMOGRAPHIC_REQUIRED_FIELDS.length} />
                    <CompletionMeter label={`Intralaboral Forma ${evaluation.instrument_form}`} value={completion.intraAnswered} expected={completion.expectedIntralaboral} />
                    <CompletionMeter label="Extralaboral" value={completion.extraAnswered} expected={V3_COUNTS.extralaboral} />
                    <CompletionMeter label="Estrés" value={completion.stressAnswered} expected={V3_COUNTS.stress} />
                  </div>
                  {completion.filterPending && <Notice tone="warning">Falta responder la pregunta de filtro sobre atención a clientes o usuarios.</Notice>}
                  <label className="check-row final-consent-check">
                    <input type="checkbox" name="consentVerified" value="yes" defaultChecked={Boolean(evaluation.consent_verified)} />
                    <span><strong>Verifiqué el consentimiento informado y la correspondencia con los formatos fuente</strong><small>La responsabilidad de la aplicación e interpretación permanece en el profesional autorizado.</small></span>
                  </label>
                  <Notice tone="warning"><strong>Antes de finalizar:</strong> el registro quedará bloqueado. La captura completa no equivale por sí sola a una interpretación ocupacional.</Notice>
                </div>
              </>
            )}
          </section>
          <div className="manual-save-bar">
            <div><strong>{step === "revision" ? "Listo para control final" : "Borrador seguro"}</strong><small>{step === "revision" ? "Se validarán todas las etapas." : "Puedes guardar esta etapa y continuar después."}</small></div>
            <div>
              {step !== "revision" && <button className="button button-secondary" type="submit" name="stay" value="yes">Guardar aquí</button>}
              <button className="button button-primary" type="submit">{step === "revision" ? "Finalizar y bloquear" : "Guardar y continuar"}</button>
            </div>
          </div>
        </form>
      )}
    </AppShell>
  );
}
