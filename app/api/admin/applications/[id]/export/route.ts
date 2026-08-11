import { all, audit, one } from "@/db";
import { getAuthorizedUser, hasOrganizationAccess } from "@/lib/auth";
import { escapeCsv } from "@/lib/security";
import { parseRecord } from "@/lib/v3";
import type { V3ScoringResult } from "@/lib/v3-scoring";

type ManualRow = {
  participant_code: string;
  role_level: string;
  instrument_form: string;
  status: string;
  sociodemographic_json: string;
  created_at: string;
  completed_at: string | null;
  results_json: string;
  scoring_version: string | null;
};

function readResult(value: string) {
  try {
    const parsed = JSON.parse(value) as V3ScoringResult;
    return parsed?.engineVersion && parsed?.general ? parsed : null;
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthorizedUser();
  if (!user) return new Response("No autorizado", { status: 401 });
  if (!["super_admin", "psychologist"].includes(user.role)) {
    return new Response("Permiso insuficiente", { status: 403 });
  }
  const application = await one<{ organization_id: string; name: string }>(
    "SELECT organization_id,name FROM campaigns WHERE id=?",
    id,
  );
  if (!application || !hasOrganizationAccess(user, application.organization_id)) {
    return new Response("Aplicación no autorizada", { status: 403 });
  }
  const rows = await all<ManualRow>(
    `SELECT participant_code,role_level,instrument_form,status,sociodemographic_json,created_at,completed_at,results_json,scoring_version
     FROM manual_evaluations WHERE campaign_id=? ORDER BY participant_code`,
    id,
  );
  const data: unknown[][] = [[
    "codigo",
    "nombre_completo",
    "nivel_cargo",
    "forma",
    "estado_captura",
    "fecha_aplicacion",
    "creado",
    "finalizado",
    "version_calificacion",
    "intralaboral_puntaje",
    "intralaboral_nivel",
    "extralaboral_puntaje",
    "extralaboral_nivel",
    "general_puntaje",
    "general_nivel",
    "estres_puntaje",
    "estres_nivel",
  ]];
  for (const row of rows) {
    const socio = parseRecord(row.sociodemographic_json);
    const result = readResult(row.results_json);
    data.push([
      row.participant_code,
      socio.fullName ?? "",
      row.role_level,
      row.instrument_form,
      row.status,
      socio.applicationDate ?? "",
      row.created_at,
      row.completed_at ?? "",
      row.scoring_version ?? "",
      result?.intralaboral.total.score ?? "",
      result?.intralaboral.total.risk?.label ?? "",
      result?.extralaboral.total.score ?? "",
      result?.extralaboral.total.risk?.label ?? "",
      result?.general.score ?? "",
      result?.general.risk?.label ?? "",
      result?.stress.score ?? "",
      result?.stress.risk?.label ?? "",
    ]);
  }
  await audit(user.email, "application.manual_exported", "application", id, { rows: rows.length });
  const csv = `\uFEFF${data.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=aplicacion-v3.csv",
      "Cache-Control": "no-store, private",
    },
  });
}
