import { audit, one, run } from "@/db";
import { canViewIndividual, hasOrganizationAccess } from "@/lib/auth";
import { authenticatedForm, isResponse, redirectTo, textField } from "@/lib/http";
import {
  V3_COUNTS,
  V3_FREQUENCY_OPTIONS,
  V3_STRESS_OPTIONS,
  applicableIntralaboralItems,
  parseRecord,
  readAnswers,
  readAnswersForItems,
  readSociodemographic,
  v3Completion,
} from "@/lib/v3";
import { scoreV3Battery, V3_SCORING_VERSION } from "@/lib/v3-scoring";

type ManualEvaluation = {
  id: string;
  campaign_id: string;
  organization_id: string;
  instrument_form: "A" | "B";
  role_level: "leadership" | "professional_technical" | "assistant" | "operator";
  status: "draft" | "completed";
  sociodemographic_json: string;
  intralaboral_answers_json: string;
  extralaboral_answers_json: string;
  stress_answers_json: string;
  serves_customers: number | null;
  supervises_people: number;
  consent_verified: number;
};

const NEXT_STEP: Record<string, string> = {
  datos: "intralaboral",
  intralaboral: "extralaboral",
  extralaboral: "estres",
  estres: "revision",
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let applicationId = "";
  let step = "datos";
  try {
    const form = await request.formData();
    step = textField(form, "step", { required: true, max: 20 });
    const user = await authenticatedForm(request, form, `manual-evaluation:update:${id}`);
    if (isResponse(user)) return user;
    if (!canViewIndividual(user)) return new Response("Permiso insuficiente", { status: 403 });

    const evaluation = await one<ManualEvaluation>(
      `SELECT manual_evaluations.*,campaigns.organization_id
       FROM manual_evaluations JOIN campaigns ON campaigns.id=manual_evaluations.campaign_id
       WHERE manual_evaluations.id=?`,
      id,
    );
    if (!evaluation || !hasOrganizationAccess(user, evaluation.organization_id)) {
      return new Response("Captura no autorizada", { status: 404 });
    }
    applicationId = evaluation.campaign_id;
    if (evaluation.status === "completed") throw new Error("La evaluación ya está finalizada");

    if (step === "datos") {
      const values = readSociodemographic(form);
      await run(
        "UPDATE manual_evaluations SET sociodemographic_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        JSON.stringify(values),
        id,
      );
      await audit(user.email, "manual_evaluation.demographics_saved", "manual_evaluation", id, {
        fields: Object.keys(values).length,
      });
    } else if (step === "intralaboral") {
      const servesCustomersValue = textField(form, "servesCustomers", { required: true, max: 3 });
      if (!["yes", "no"].includes(servesCustomersValue)) throw new Error("Responde el filtro de atención a clientes o usuarios");
      const servesCustomers = servesCustomersValue === "yes";
      const applicableItems = applicableIntralaboralItems({
        form: evaluation.instrument_form,
        servesCustomers,
        supervisesPeople: Boolean(evaluation.supervises_people),
      });
      const answers = readAnswersForItems(form, applicableItems, V3_FREQUENCY_OPTIONS);
      await run(
        "UPDATE manual_evaluations SET intralaboral_answers_json=?,serves_customers=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        JSON.stringify(answers),
        servesCustomers ? 1 : 0,
        id,
      );
      await audit(user.email, "manual_evaluation.intralaboral_saved", "manual_evaluation", id, {
        form: evaluation.instrument_form,
        answered: Object.keys(answers).length,
        expected: applicableItems.length,
        servesCustomers,
        supervisesPeople: Boolean(evaluation.supervises_people),
      });
    } else if (step === "extralaboral") {
      const answers = readAnswers(form, V3_COUNTS.extralaboral, V3_FREQUENCY_OPTIONS);
      await run(
        "UPDATE manual_evaluations SET extralaboral_answers_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        JSON.stringify(answers),
        id,
      );
      await audit(user.email, "manual_evaluation.extralaboral_saved", "manual_evaluation", id, {
        answered: Object.keys(answers).length,
        expected: V3_COUNTS.extralaboral,
      });
    } else if (step === "estres") {
      const answers = readAnswers(form, V3_COUNTS.stress, V3_STRESS_OPTIONS);
      await run(
        "UPDATE manual_evaluations SET stress_answers_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        JSON.stringify(answers),
        id,
      );
      await audit(user.email, "manual_evaluation.stress_saved", "manual_evaluation", id, {
        answered: Object.keys(answers).length,
        expected: V3_COUNTS.stress,
      });
    } else if (step === "revision") {
      const consentVerified = form.get("consentVerified") === "yes";
      const completion = v3Completion({
        form: evaluation.instrument_form,
        sociodemographic: parseRecord(evaluation.sociodemographic_json),
        intralaboral: parseRecord(evaluation.intralaboral_answers_json),
        extralaboral: parseRecord(evaluation.extralaboral_answers_json),
        stress: parseRecord(evaluation.stress_answers_json),
        servesCustomers: evaluation.serves_customers === null ? null : Boolean(evaluation.serves_customers),
        supervisesPeople: Boolean(evaluation.supervises_people),
        consentVerified,
      });
      if (!completion.complete) {
        const pending = [
          completion.socioMissing.length ? `${completion.socioMissing.length} dato(s) general(es)` : "",
          completion.intraAnswered < completion.expectedIntralaboral
            ? `${completion.expectedIntralaboral - completion.intraAnswered} intralaboral(es)`
            : "",
          completion.extraAnswered < V3_COUNTS.extralaboral
            ? `${V3_COUNTS.extralaboral - completion.extraAnswered} extralaboral(es)`
            : "",
          completion.stressAnswered < V3_COUNTS.stress
            ? `${V3_COUNTS.stress - completion.stressAnswered} de estrés`
            : "",
          completion.filterPending ? "filtro de atención a clientes o usuarios" : "",
          !consentVerified ? "verificación del consentimiento" : "",
        ].filter(Boolean);
        throw new Error(`Aún falta: ${pending.join(", ")}`);
      }
      const result = scoreV3Battery({
        form: evaluation.instrument_form,
        roleLevel: evaluation.role_level,
        intralaboral: parseRecord(evaluation.intralaboral_answers_json),
        extralaboral: parseRecord(evaluation.extralaboral_answers_json),
        stress: parseRecord(evaluation.stress_answers_json),
        servesCustomers: Boolean(evaluation.serves_customers),
        supervisesPeople: Boolean(evaluation.supervises_people),
      });
      if (!result.valid) throw new Error("La captura no cumple las reglas de validez para ejecutar la calificación V3");
      await run(
        `UPDATE manual_evaluations
         SET status='completed',consent_verified=1,results_json=?,scoring_version=?,
             scored_at=CURRENT_TIMESTAMP,completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
        JSON.stringify(result),
        V3_SCORING_VERSION,
        id,
      );
      await audit(user.email, "manual_evaluation.completed", "manual_evaluation", id, {
        form: evaluation.instrument_form,
        batteryVersion: "V3",
        scoringVersion: V3_SCORING_VERSION,
        generalRisk: result.general.risk?.key ?? null,
        stressRisk: result.stress.risk?.key ?? null,
      });
      return redirectTo(request, `/aplicaciones/${applicationId}/registro-manual/${id}`, {
        paso: "revision",
        scored: "1",
      });
    } else {
      throw new Error("Etapa de captura inválida");
    }

    return redirectTo(request, `/aplicaciones/${applicationId}/registro-manual/${id}`, {
      paso: textField(form, "stay", { max: 5 }) === "yes" ? step : NEXT_STEP[step] ?? step,
      saved: "1",
    });
  } catch (error) {
    return redirectTo(
      request,
      applicationId
        ? `/aplicaciones/${applicationId}/registro-manual/${id}`
        : "/aplicaciones",
      {
        paso: step,
        error: error instanceof Error ? error.message : "No fue posible guardar la captura",
      },
    );
  }
}
