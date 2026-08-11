import type { RoleLevel } from "./types.ts";
import type { AnswerRecord } from "./v3.ts";
import { V3_BAREMOS, type V3LevelKey } from "./v3-scoring-data.ts";

export const V3_SCORING_VERSION = "V3-2026.1";

type FrequencyValue = "always" | "almost_always" | "sometimes" | "almost_never" | "never";
type StressValue = "always" | "almost_always" | "sometimes" | "never";

export type V3Risk = {
  key: V3LevelKey;
  label: string;
  interpretation: string;
};

export type V3MetricResult = {
  key: string;
  label: string;
  valid: boolean;
  applicable: boolean;
  raw: number | null;
  factor: number;
  score: number | null;
  risk: V3Risk | null;
  missingItems: number[];
};

export type V3ScoringResult = {
  engineVersion: string;
  form: "A" | "B";
  occupationalGroup: "JPT" | "AO";
  valid: boolean;
  priority: "standard" | "professional_review" | "immediate";
  intralaboral: {
    valid: boolean;
    dimensions: V3MetricResult[];
    domains: V3MetricResult[];
    total: V3MetricResult;
  };
  extralaboral: {
    valid: boolean;
    dimensions: V3MetricResult[];
    total: V3MetricResult;
  };
  general: V3MetricResult;
  stress: V3MetricResult;
  calculatedAt: string;
};

type DimensionDefinition = {
  key: string;
  label: string;
  items: number[];
  factor: number;
  allowedMissing: number;
  baremoCode: string;
  domain: string;
  conditional?: "customers" | "supervision";
};

type DomainDefinition = {
  key: string;
  label: string;
  members: string[];
  factor: number;
  baremoCode: string;
};

const A_INVERSE = new Set([
  1, 2, 3, 7, 8, 10, 11, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
  26, 27, 28, 29, 30, 31, 33, 35, 36, 37, 38, 52, 80, 106, 107, 108, 109,
  110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123,
]);

const B_INVERSE = new Set([
  1, 2, 3, 7, 8, 10, 11, 13, 15, 16, 17, 18, 19, 20, 21, 23, 25, 26, 27,
  28, 66, 89, 90, 91, 92, 93, 94, 95, 96,
]);

const EXTRA_INVERSE = new Set([2, 3, 6, 24, 26, 28, 30, 31]);

const A_DIMENSIONS: DimensionDefinition[] = [
  { key: "A_DIM_liderazgo", label: "Características del liderazgo", items: [63,64,65,66,67,68,69,70,71,72,73,74,75], factor: 52, allowedMissing: 1, baremoCode: "A_DIM_liderazgo", domain: "A_DOM_liderazgo_social" },
  { key: "A_DIM_relaciones", label: "Relaciones sociales en el trabajo", items: [76,77,78,79,80,81,82,83,84,85,86,87,88,89], factor: 56, allowedMissing: 1, baremoCode: "A_DIM_relaciones", domain: "A_DOM_liderazgo_social" },
  { key: "A_DIM_retroalimentacion", label: "Retroalimentación del desempeño", items: [90,91,92,93,94], factor: 20, allowedMissing: 0, baremoCode: "A_DIM_retroalimentacion", domain: "A_DOM_liderazgo_social" },
  { key: "A_DIM_colaboradores", label: "Relación con los colaboradores", items: [115,116,117,118,119,120,121,122,123], factor: 36, allowedMissing: 1, baremoCode: "A_DIM_colaboradores", domain: "A_DOM_liderazgo_social", conditional: "supervision" },
  { key: "A_DIM_rol", label: "Claridad de rol", items: [53,54,55,56,57,58,59], factor: 28, allowedMissing: 0, baremoCode: "A_DIM_rol", domain: "A_DOM_control" },
  { key: "A_DIM_capacitacion", label: "Capacitación", items: [60,61,62], factor: 12, allowedMissing: 0, baremoCode: "A_DIM_capacitacion", domain: "A_DOM_control" },
  { key: "A_DIM_participacion", label: "Participación y manejo del cambio", items: [48,49,50,51], factor: 16, allowedMissing: 0, baremoCode: "A_DIM_participacion", domain: "A_DOM_control" },
  { key: "A_DIM_habilidades", label: "Oportunidades para el uso y desarrollo de habilidades", items: [39,40,41,42], factor: 16, allowedMissing: 0, baremoCode: "A_DIM_habilidades", domain: "A_DOM_control" },
  { key: "A_DIM_autonomia", label: "Control y autonomía sobre el trabajo", items: [44,45,46], factor: 12, allowedMissing: 0, baremoCode: "A_DIM_autonomia", domain: "A_DOM_control" },
  { key: "A_DIM_ambientales", label: "Demandas ambientales y de esfuerzo físico", items: [1,2,3,4,5,6,7,8,9,10,11,12], factor: 48, allowedMissing: 1, baremoCode: "A_DIM_ambientales", domain: "A_DOM_demandas" },
  { key: "A_DIM_emocionales", label: "Demandas emocionales", items: [106,107,108,109,110,111,112,113,114], factor: 36, allowedMissing: 0, baremoCode: "A_DIM_emocionales", domain: "A_DOM_demandas", conditional: "customers" },
  { key: "A_DIM_cuantitativas", label: "Demandas cuantitativas", items: [13,14,15,32,43,47], factor: 24, allowedMissing: 0, baremoCode: "A_DIM_cuantitativas", domain: "A_DOM_demandas" },
  { key: "A_DIM_influencia", label: "Influencia del trabajo sobre el entorno extralaboral", items: [35,36,37,38], factor: 16, allowedMissing: 0, baremoCode: "A_DIM_influencia", domain: "A_DOM_demandas" },
  { key: "A_DIM_responsabilidad", label: "Exigencias de responsabilidad del cargo", items: [19,22,23,24,25,26], factor: 24, allowedMissing: 0, baremoCode: "A_DIM_responsabilidad", domain: "A_DOM_demandas" },
  { key: "A_DIM_mental", label: "Demandas de carga mental", items: [16,17,18,20,21], factor: 20, allowedMissing: 0, baremoCode: "A_DIM_mental", domain: "A_DOM_demandas" },
  { key: "A_DIM_consistencia", label: "Consistencia del rol", items: [27,28,29,30,52], factor: 20, allowedMissing: 0, baremoCode: "A_DIM_consistencia", domain: "A_DOM_demandas" },
  { key: "A_DIM_jornada", label: "Demandas de la jornada de trabajo", items: [31,33,34], factor: 12, allowedMissing: 0, baremoCode: "A_DIM_jornada", domain: "A_DOM_demandas" },
  { key: "A_DIM_pertenencia", label: "Recompensas derivadas de la pertenencia y del trabajo", items: [95,102,103,104,105], factor: 20, allowedMissing: 0, baremoCode: "A_DIM_pertenencia", domain: "A_DOM_recompensas" },
  { key: "A_DIM_reconocimiento", label: "Reconocimiento y compensación", items: [96,97,98,99,100,101], factor: 24, allowedMissing: 0, baremoCode: "A_DIM_reconocimiento", domain: "A_DOM_recompensas" },
];

const B_DIMENSIONS: DimensionDefinition[] = [
  { key: "B_DIM_liderazgo", label: "Características del liderazgo", items: [49,50,51,52,53,54,55,56,57,58,59,60,61], factor: 52, allowedMissing: 1, baremoCode: "B_DIM_liderazgo", domain: "B_DOM_liderazgo_social" },
  { key: "B_DIM_relaciones", label: "Relaciones sociales en el trabajo", items: [62,63,64,65,66,67,68,69,70,71,72,73], factor: 48, allowedMissing: 1, baremoCode: "B_DIM_relaciones", domain: "B_DOM_liderazgo_social" },
  { key: "B_DIM_retroalimentacion", label: "Retroalimentación del desempeño", items: [74,75,76,77,78], factor: 20, allowedMissing: 0, baremoCode: "B_DIM_retroalimentacion", domain: "B_DOM_liderazgo_social" },
  { key: "B_DIM_rol", label: "Claridad de rol", items: [41,42,43,44,45], factor: 20, allowedMissing: 0, baremoCode: "B_DIM_rol", domain: "B_DOM_control" },
  { key: "B_DIM_capacitacion", label: "Capacitación", items: [46,47,48], factor: 12, allowedMissing: 0, baremoCode: "B_DIM_capacitacion", domain: "B_DOM_control" },
  { key: "B_DIM_participacion", label: "Participación y manejo del cambio", items: [38,39,40], factor: 12, allowedMissing: 0, baremoCode: "B_DIM_participacion", domain: "B_DOM_control" },
  { key: "B_DIM_habilidades", label: "Oportunidades para el uso y desarrollo de habilidades", items: [29,30,31,32], factor: 16, allowedMissing: 0, baremoCode: "B_DIM_habilidades", domain: "B_DOM_control" },
  { key: "B_DIM_autonomia", label: "Control y autonomía sobre el trabajo", items: [34,35,36], factor: 12, allowedMissing: 0, baremoCode: "B_DIM_autonomia", domain: "B_DOM_control" },
  { key: "B_DIM_ambientales", label: "Demandas ambientales y de esfuerzo físico", items: [1,2,3,4,5,6,7,8,9,10,11,12], factor: 48, allowedMissing: 1, baremoCode: "B_DIM_ambientales", domain: "B_DOM_demandas" },
  { key: "B_DIM_emocionales", label: "Demandas emocionales", items: [89,90,91,92,93,94,95,96,97], factor: 36, allowedMissing: 0, baremoCode: "B_DIM_emocionales", domain: "B_DOM_demandas", conditional: "customers" },
  { key: "B_DIM_cuantitativas", label: "Demandas cuantitativas", items: [13,14,15], factor: 12, allowedMissing: 0, baremoCode: "B_DIM_cuantitativas", domain: "B_DOM_demandas" },
  { key: "B_DIM_influencia", label: "Influencia del trabajo sobre el entorno extralaboral", items: [25,26,27,28], factor: 16, allowedMissing: 0, baremoCode: "B_DIM_influencia", domain: "B_DOM_demandas" },
  { key: "B_DIM_mental", label: "Demandas de carga mental", items: [16,17,18,19,20], factor: 20, allowedMissing: 0, baremoCode: "B_DIM_mental", domain: "B_DOM_demandas" },
  { key: "B_DIM_jornada", label: "Demandas de la jornada de trabajo", items: [21,22,23,24,33,37], factor: 24, allowedMissing: 0, baremoCode: "B_DIM_jornada", domain: "B_DOM_demandas" },
  { key: "B_DIM_pertenencia", label: "Recompensas derivadas de la pertenencia y del trabajo", items: [85,86,87,88], factor: 16, allowedMissing: 0, baremoCode: "B_DIM_pertenencia", domain: "B_DOM_recompensas" },
  { key: "B_DIM_reconocimiento", label: "Reconocimiento y compensación", items: [79,80,81,82,83,84], factor: 24, allowedMissing: 0, baremoCode: "B_DIM_reconocimiento", domain: "B_DOM_recompensas" },
];

const A_DOMAINS: DomainDefinition[] = [
  { key: "A_DOM_liderazgo_social", label: "Liderazgo y relaciones sociales en el trabajo", members: ["A_DIM_liderazgo","A_DIM_relaciones","A_DIM_retroalimentacion","A_DIM_colaboradores"], factor: 164, baremoCode: "A_DOM_liderazgo_social" },
  { key: "A_DOM_control", label: "Control sobre el trabajo", members: ["A_DIM_rol","A_DIM_capacitacion","A_DIM_participacion","A_DIM_habilidades","A_DIM_autonomia"], factor: 84, baremoCode: "A_DOM_control" },
  { key: "A_DOM_demandas", label: "Demandas del trabajo", members: ["A_DIM_ambientales","A_DIM_emocionales","A_DIM_cuantitativas","A_DIM_influencia","A_DIM_responsabilidad","A_DIM_mental","A_DIM_consistencia","A_DIM_jornada"], factor: 200, baremoCode: "A_DOM_demandas" },
  { key: "A_DOM_recompensas", label: "Recompensas", members: ["A_DIM_pertenencia","A_DIM_reconocimiento"], factor: 44, baremoCode: "A_DOM_recompensas" },
];

const B_DOMAINS: DomainDefinition[] = [
  { key: "B_DOM_liderazgo_social", label: "Liderazgo y relaciones sociales en el trabajo", members: ["B_DIM_liderazgo","B_DIM_relaciones","B_DIM_retroalimentacion"], factor: 120, baremoCode: "B_DOM_liderazgo_social" },
  { key: "B_DOM_control", label: "Control sobre el trabajo", members: ["B_DIM_rol","B_DIM_capacitacion","B_DIM_participacion","B_DIM_habilidades","B_DIM_autonomia"], factor: 72, baremoCode: "B_DOM_control" },
  { key: "B_DOM_demandas", label: "Demandas del trabajo", members: ["B_DIM_ambientales","B_DIM_emocionales","B_DIM_cuantitativas","B_DIM_influencia","B_DIM_mental","B_DIM_jornada"], factor: 156, baremoCode: "B_DOM_demandas" },
  { key: "B_DOM_recompensas", label: "Recompensas", members: ["B_DIM_pertenencia","B_DIM_reconocimiento"], factor: 40, baremoCode: "B_DOM_recompensas" },
];

const EXTRA_DIMENSIONS = [
  { suffix: "balance", label: "Balance entre la vida laboral y familiar", items: [14,15,16,17], factor: 16, allowedMissing: 0 },
  { suffix: "familia", label: "Relaciones familiares", items: [22,25,27], factor: 12, allowedMissing: 0 },
  { suffix: "comunicacion", label: "Comunicación y relaciones interpersonales", items: [18,19,20,21,23], factor: 20, allowedMissing: 0 },
  { suffix: "economia", label: "Situación económica del grupo familiar", items: [29,30,31], factor: 12, allowedMissing: 0 },
  { suffix: "vivienda", label: "Características de la vivienda y de su entorno", items: [5,6,7,8,9,10,11,12,13], factor: 36, allowedMissing: 1 },
  { suffix: "influencia_ext", label: "Influencia del entorno extralaboral sobre el trabajo", items: [24,26,28], factor: 12, allowedMissing: 0 },
  { suffix: "desplazamiento", label: "Desplazamiento vivienda - trabajo - vivienda", items: [1,2,3,4], factor: 16, allowedMissing: 0 },
] as const;

const RISK_INTERPRETATIONS: Record<V3LevelKey, string> = {
  none: "Mantener las acciones de promoción, monitoreo y los factores protectores identificados.",
  very_low: "Los síntomas son ausentes o muy poco frecuentes; mantener las acciones de promoción de la salud.",
  low: "Mantener los controles existentes y revisar periódicamente la evolución del resultado.",
  medium: "Requiere observación profesional y acciones sistemáticas de intervención y seguimiento.",
  high: "Requiere intervención prioritaria en el marco del sistema de vigilancia epidemiológica.",
  very_high: "Requiere intervención inmediata, seguimiento profesional y articulación con los controles organizacionales.",
};

function roundOne(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function classify(code: string, score: number): V3Risk {
  const bands = V3_BAREMOS[code as keyof typeof V3_BAREMOS];
  if (!bands) throw new Error(`No existe el baremo ${code}`);
  const band = bands.find((candidate) => score >= candidate.from && score <= candidate.to);
  if (!band) throw new Error(`El puntaje ${score} no está cubierto por ${code}`);
  return { key: band.key, label: band.level, interpretation: RISK_INTERPRETATIONS[band.key] };
}

function transformed(raw: number, factor: number) {
  return Math.max(0, Math.min(100, roundOne((raw / factor) * 100)));
}

function frequencyScore(value: string | undefined, inverse: boolean) {
  const direct: Record<FrequencyValue, number> = { always: 0, almost_always: 1, sometimes: 2, almost_never: 3, never: 4 };
  if (!(value && value in direct)) return null;
  const score = direct[value as FrequencyValue];
  return inverse ? 4 - score : score;
}

function scoreDimension(
  definition: DimensionDefinition,
  answers: AnswerRecord,
  inverseItems: Set<number>,
  applicability: { customers: boolean; supervision: boolean },
): V3MetricResult {
  const applies = definition.conditional ? applicability[definition.conditional] : true;
  if (!applies) {
    const score = 0;
    return { key: definition.key, label: definition.label, valid: true, applicable: false, raw: 0, factor: definition.factor, score, risk: classify(definition.baremoCode, score), missingItems: [] };
  }
  const values = definition.items.map((item) => ({ item, value: frequencyScore(answers[String(item)], inverseItems.has(item)) }));
  const missingItems = values.filter((entry) => entry.value === null).map((entry) => entry.item);
  if (missingItems.length > definition.allowedMissing) {
    return { key: definition.key, label: definition.label, valid: false, applicable: true, raw: null, factor: definition.factor, score: null, risk: null, missingItems };
  }
  const raw = values.reduce((sum, entry) => sum + (entry.value ?? 0), 0);
  const score = transformed(raw, definition.factor);
  return { key: definition.key, label: definition.label, valid: true, applicable: true, raw, factor: definition.factor, score, risk: classify(definition.baremoCode, score), missingItems };
}

function aggregateMetric(definition: DomainDefinition, members: V3MetricResult[]): V3MetricResult {
  const selected = definition.members.map((key) => members.find((member) => member.key === key));
  const valid = selected.every((member) => member?.valid);
  if (!valid) return { key: definition.key, label: definition.label, valid: false, applicable: true, raw: null, factor: definition.factor, score: null, risk: null, missingItems: selected.flatMap((member) => member?.missingItems ?? []) };
  const raw = selected.reduce((sum, member) => sum + (member?.raw ?? 0), 0);
  const score = transformed(raw, definition.factor);
  return { key: definition.key, label: definition.label, valid: true, applicable: true, raw, factor: definition.factor, score, risk: classify(definition.baremoCode, score), missingItems: [] };
}

function totalMetric(key: string, label: string, members: V3MetricResult[], factor: number, baremoCode: string): V3MetricResult {
  if (!members.every((member) => member.valid)) return { key, label, valid: false, applicable: true, raw: null, factor, score: null, risk: null, missingItems: members.flatMap((member) => member.missingItems) };
  const raw = members.reduce((sum, member) => sum + (member.raw ?? 0), 0);
  const score = transformed(raw, factor);
  return { key, label, valid: true, applicable: true, raw, factor, score, risk: classify(baremoCode, score), missingItems: [] };
}

function occupationalGroup(roleLevel: RoleLevel) {
  return roleLevel === "leadership" || roleLevel === "professional_technical" ? "JPT" as const : "AO" as const;
}

function scoreStress(answers: AnswerRecord, group: "JPT" | "AO"): V3MetricResult {
  const weight9 = new Set([1,2,3,9,13,14,15,23,24]);
  const weight6 = new Set([4,5,6,10,11,16,17,18,19,25,26,27,28]);
  const scale = (item: number, value: string | undefined) => {
    if (!value || !["always","almost_always","sometimes","never"].includes(value)) return null;
    const max = weight9.has(item) ? 9 : weight6.has(item) ? 6 : 3;
    const ratios: Record<StressValue, number> = { always: 1, almost_always: 2 / 3, sometimes: 1 / 3, never: 0 };
    return max * ratios[value as StressValue];
  };
  const values = Array.from({ length: 31 }, (_, index) => ({ item: index + 1, value: scale(index + 1, answers[String(index + 1)]) }));
  const missingItems = values.filter((entry) => entry.value === null).map((entry) => entry.item);
  if (missingItems.length) return { key: `EST_${group}`, label: "Nivel de estrés", valid: false, applicable: true, raw: null, factor: 61.16, score: null, risk: null, missingItems };
  const average = (from: number, to: number) => {
    const slice = values.slice(from - 1, to);
    return slice.reduce((sum, entry) => sum + (entry.value ?? 0), 0) / slice.length;
  };
  const raw = average(1, 8) * 4 + average(9, 12) * 3 + average(13, 22) * 2 + average(23, 31);
  const score = transformed(raw, 61.16);
  return { key: `EST_${group}`, label: "Nivel de estrés", valid: true, applicable: true, raw: roundOne(raw), factor: 61.16, score, risk: classify(`EST_${group}`, score), missingItems: [] };
}

export function scoreV3Battery(input: {
  form: "A" | "B";
  roleLevel: RoleLevel;
  intralaboral: AnswerRecord;
  extralaboral: AnswerRecord;
  stress: AnswerRecord;
  servesCustomers: boolean;
  supervisesPeople: boolean;
}): V3ScoringResult {
  const group = occupationalGroup(input.roleLevel);
  const dimensionDefinitions = input.form === "A" ? A_DIMENSIONS : B_DIMENSIONS;
  const domainDefinitions = input.form === "A" ? A_DOMAINS : B_DOMAINS;
  const inverseItems = input.form === "A" ? A_INVERSE : B_INVERSE;
  const intralaboralDimensions = dimensionDefinitions.map((definition) => scoreDimension(definition, input.intralaboral, inverseItems, { customers: input.servesCustomers, supervision: input.supervisesPeople }));
  const intralaboralDomains = domainDefinitions.map((definition) => aggregateMetric(definition, intralaboralDimensions));
  const intralaboralFactor = input.form === "A" ? 492 : 388;
  const intralaboralTotal = totalMetric(`${input.form}_TOTAL`, "Total intralaboral", intralaboralDomains, intralaboralFactor, `${input.form}_TOTAL`);

  const extralaboralDimensions = EXTRA_DIMENSIONS.map((definition) => scoreDimension({
    key: `EXT_${group}_${definition.suffix}`,
    label: definition.label,
    items: [...definition.items],
    factor: definition.factor,
    allowedMissing: definition.allowedMissing,
    baremoCode: `EXT_${group}_${definition.suffix}`,
    domain: "extralaboral",
  }, input.extralaboral, EXTRA_INVERSE, { customers: true, supervision: true }));
  const extralaboralTotal = totalMetric(`EXT_${group}_TOTAL`, "Total extralaboral", extralaboralDimensions, 124, `EXT_${group}_TOTAL`);

  const generalFactor = input.form === "A" ? 616 : 512;
  const general = totalMetric(`GENERAL_${input.form}`, "Total general intralaboral + extralaboral", [intralaboralTotal, extralaboralTotal], generalFactor, `GENERAL_${input.form}`);
  const stress = scoreStress(input.stress, group);
  const valid = intralaboralTotal.valid && extralaboralTotal.valid && general.valid && stress.valid;
  const levels = [intralaboralTotal.risk?.key, extralaboralTotal.risk?.key, general.risk?.key, stress.risk?.key];
  const priority = levels.includes("very_high") || levels.includes("high") ? "immediate" : levels.includes("medium") ? "professional_review" : "standard";

  return {
    engineVersion: V3_SCORING_VERSION,
    form: input.form,
    occupationalGroup: group,
    valid,
    priority,
    intralaboral: { valid: intralaboralTotal.valid, dimensions: intralaboralDimensions, domains: intralaboralDomains, total: intralaboralTotal },
    extralaboral: { valid: extralaboralTotal.valid, dimensions: extralaboralDimensions, total: extralaboralTotal },
    general,
    stress,
    calculatedAt: new Date().toISOString(),
  };
}
