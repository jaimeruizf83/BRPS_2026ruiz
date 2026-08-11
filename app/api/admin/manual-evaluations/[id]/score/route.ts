import { audit, one, run } from "@/db";
import { canViewIndividual, hasOrganizationAccess } from "@/lib/auth";
import { authenticatedForm, isResponse, redirectTo } from "@/lib/http";
import { parseRecord } from "@/lib/v3";
import { scoreV3Battery, V3_SCORING_VERSION } from "@/lib/v3-scoring";

type ManualEvaluation = {
  id: string;
  campaign_id: string;
  organization_id: string;
  role_level: "leadership" | "professional_technical" | "assistant" | "operator";
  instrument_form: "A" | "B";
  status: "draft" | "completed";
  intralaboral_answers_json: string;
  extralaboral_answers_json: string;
  stress_answers_json: string;
  serves_customers: number | null;
  supervises_people: number;
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let applicationId = "";
  try {
    const form = await request.formData();
    const user = await authenticatedForm(request, form, `manual-evaluation:score:${id}`);
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
    if (evaluation.status !== "completed") throw new Error("Finaliza la captura antes de ejecutar la calificación");

    const result = scoreV3Battery({
      form: evaluation.instrument_form,
      roleLevel: evaluation.role_level,
      intralaboral: parseRecord(evaluation.intralaboral_answers_json),
      extralaboral: parseRecord(evaluation.extralaboral_answers_json),
      stress: parseRecord(evaluation.stress_answers_json),
      servesCustomers: Boolean(evaluation.serves_customers),
      supervisesPeople: Boolean(evaluation.supervises_people),
    });
    if (!result.valid) throw new Error("El registro no cumple las reglas de validez del motor V3");

    await run(
      `UPDATE manual_evaluations
       SET results_json=?,scoring_version=?,scored_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      JSON.stringify(result),
      V3_SCORING_VERSION,
      id,
    );
    await audit(user.email, "manual_evaluation.scored", "manual_evaluation", id, {
      scoringVersion: V3_SCORING_VERSION,
      form: result.form,
      generalRisk: result.general.risk?.key ?? null,
      stressRisk: result.stress.risk?.key ?? null,
    });
    return redirectTo(request, `/aplicaciones/${applicationId}/registro-manual/${id}`, {
      paso: "revision",
      scored: "1",
    });
  } catch (error) {
    return redirectTo(
      request,
      applicationId ? `/aplicaciones/${applicationId}/registro-manual/${id}` : "/aplicaciones",
      {
        paso: "revision",
        error: error instanceof Error ? error.message : "No fue posible ejecutar la calificación V3",
      },
    );
  }
}
