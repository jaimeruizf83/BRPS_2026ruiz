import { all, audit, one } from "@/db";
import { canViewIndividual, getAuthorizedUser, hasOrganizationAccess } from "@/lib/auth";
import { escapeCsv } from "@/lib/security";
import type { ScoreResult } from "@/lib/types";

type Batch = { name: string; organization_id: string };
type DocumentRow = {
  id: string;
  original_name: string;
  source_type: string;
  status: string;
  participant_code: string | null;
  detected_form: string | null;
  document_confidence: number | null;
  warnings_json: string;
  results_json: string | null;
};
type AnswerRow = {
  document_id: string;
  item_number: number;
  selected_value: number | null;
  reviewed_value: number | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const user = await getAuthorizedUser();
  if (!user) return new Response("No autorizado", { status: 401 });
  if (!canViewIndividual(user)) return new Response("No autorizado", { status: 403 });
  const batch = await one<Batch>(
    `SELECT scoring_batches.name,campaigns.organization_id
     FROM scoring_batches JOIN campaigns ON campaigns.id=scoring_batches.campaign_id
     WHERE scoring_batches.id=?`,
    id,
  );
  if (!batch || !hasOrganizationAccess(user, batch.organization_id)) {
    return new Response("Lote no encontrado", { status: 404 });
  }
  const documents = await all<DocumentRow>(
    `SELECT batch_documents.id,batch_documents.original_name,batch_documents.source_type,
      batch_documents.status,batch_documents.participant_code,batch_documents.detected_form,
      batch_documents.document_confidence,batch_documents.warnings_json,submissions.results_json
     FROM batch_documents
     LEFT JOIN submissions ON submissions.id=batch_documents.imported_submission_id
     WHERE batch_documents.batch_id=? ORDER BY batch_documents.created_at`,
    id,
  );
  const answers = await all<AnswerRow>(
    `SELECT batch_answers.document_id,batch_answers.item_number,batch_answers.selected_value,
      batch_answers.reviewed_value
     FROM batch_answers JOIN batch_documents ON batch_documents.id=batch_answers.document_id
     WHERE batch_documents.batch_id=? ORDER BY batch_answers.document_id,batch_answers.item_number`,
    id,
  );
  const maxItem = Math.min(500, answers.reduce((max, row) => Math.max(max, row.item_number), 0));
  const byDocument = new Map<string, Map<number, number | null>>();
  for (const answer of answers) {
    const values = byDocument.get(answer.document_id) ?? new Map<number, number | null>();
    const value =
      answer.reviewed_value === null ? answer.selected_value : answer.reviewed_value;
    values.set(answer.item_number, value === -1 ? null : value);
    byDocument.set(answer.document_id, values);
  }
  const headers = [
    "codigo_participante",
    "forma",
    "estado",
    "origen",
    "archivo",
    "confianza_documento",
    "advertencias",
    "puntaje_demo",
    "nivel_demo",
    ...Array.from({ length: maxItem }, (_, index) => `item_${index + 1}`),
  ];
  const rows = documents.map((document) => {
    let score = "";
    let risk = "";
    if (document.results_json) {
      const result = JSON.parse(document.results_json) as ScoreResult;
      score = String(result.total.score);
      risk = result.total.risk.label;
    }
    const values = byDocument.get(document.id) ?? new Map();
    const warningCount = Array.isArray(JSON.parse(document.warnings_json || "[]"))
      ? JSON.parse(document.warnings_json || "[]").length
      : 0;
    return [
      document.participant_code || "",
      document.detected_form || "",
      document.status,
      document.source_type,
      document.original_name,
      document.document_confidence === null
        ? ""
        : Math.round(document.document_confidence * 100),
      warningCount,
      score,
      risk,
      ...Array.from({ length: maxItem }, (_, index) => values.get(index + 1) ?? ""),
    ];
  });
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");
  await audit(user.email, "batch.exported", "scoring_batch", id, {
    documents: documents.length,
    columns: maxItem,
  });
  const filename = batch.name
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "lote";
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}-tabulacion.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
