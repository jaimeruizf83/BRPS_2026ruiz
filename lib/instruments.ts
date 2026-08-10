import type { Instrument, RiskLevel, RoleLevel } from "./types.ts";

export const RISK_LEVELS: RiskLevel[] = [
  { key: "none", label: "Sin riesgo o riesgo despreciable", max: 20 },
  { key: "low", label: "Riesgo bajo", max: 40 },
  { key: "medium", label: "Riesgo medio", max: 60 },
  { key: "high", label: "Riesgo alto", max: 80 },
  { key: "very_high", label: "Riesgo muy alto", max: 100 },
];

export const ROLE_LEVELS: Array<{
  value: RoleLevel;
  label: string;
  form: "A" | "B";
}> = [
  { value: "leadership", label: "Jefatura — tiene personal a cargo", form: "A" },
  {
    value: "professional_technical",
    label: "Profesional, analista, técnico o tecnólogo",
    form: "A",
  },
  { value: "assistant", label: "Auxiliar, asistente administrativo o asistente técnico", form: "B" },
  { value: "operator", label: "Operario, operador, ayudante o servicios generales", form: "B" },
];

export const FORM_BY_ROLE = Object.fromEntries(
  ROLE_LEVELS.map((role) => [role.value, role.form]),
) as Record<RoleLevel, "A" | "B">;

const domains = {
  leadership: "Liderazgo y relaciones sociales en el trabajo",
  control: "Control sobre el trabajo",
  demands: "Demandas del trabajo",
  rewards: "Recompensas",
};

const dimensionsA = [
  ["leadership_characteristics", "Características del liderazgo", "leadership"],
  ["social_relations", "Relaciones sociales en el trabajo", "leadership"],
  ["performance_feedback", "Retroalimentación del desempeño", "leadership"],
  ["subordinate_relations", "Relación con los colaboradores", "leadership"],
  ["role_clarity", "Claridad de rol", "control"],
  ["training", "Capacitación", "control"],
  ["change_participation", "Participación y manejo del cambio", "control"],
  ["skill_opportunities", "Uso y desarrollo de habilidades", "control"],
  ["autonomy", "Control y autonomía sobre el trabajo", "control"],
  ["physical_environment", "Demandas ambientales y esfuerzo físico", "demands"],
  ["emotional_demands", "Demandas emocionales", "demands"],
  ["quantitative_demands", "Demandas cuantitativas", "demands"],
  ["work_home_influence", "Influencia del trabajo en el entorno extralaboral", "demands"],
  ["responsibility", "Exigencias de responsabilidad del cargo", "demands"],
  ["mental_load", "Demandas de carga mental", "demands"],
  ["role_consistency", "Consistencia del rol", "demands"],
  ["workday_demands", "Demandas de la jornada de trabajo", "demands"],
  ["belonging_rewards", "Recompensas de pertenencia y del trabajo", "rewards"],
  ["recognition", "Reconocimiento y compensación", "rewards"],
] as const;

const excludedFromB = new Set([
  "subordinate_relations",
  "responsibility",
  "role_consistency",
]);

function buildDefinition(form: "A" | "B"): Instrument {
  const source =
    form === "A"
      ? dimensionsA
      : dimensionsA.filter(([key]) => !excludedFromB.has(key));
  const dimensions = source.map(([key, label, domain]) => ({
    key,
    label,
    domain,
    factor: 4,
    baremos: RISK_LEVELS,
  }));

  return {
    id: `DEMO_${form}`,
    form,
    name: `Formulario demostrativo — Forma ${form}`,
    version: "demo-1.0",
    isDemo: true,
    notice:
      "Este banco prueba el flujo tecnológico. No contiene los ítems oficiales y sus resultados no son válidos para decisiones ocupacionales.",
    options: [
      { value: 0, label: "Muy baja" },
      { value: 1, label: "Baja" },
      { value: 2, label: "Media" },
      { value: 3, label: "Alta" },
      { value: 4, label: "Muy alta" },
    ],
    domains,
    dimensions,
    questions: dimensions.map((dimension, index) => ({
      id: `${form.toLowerCase()}-${String(index + 1).padStart(2, "0")}`,
      dimension: dimension.key,
      text: `Ítem demostrativo: valora la exposición percibida asociada con ${dimension.label.toLowerCase()}.`,
      direction: "risk",
    })),
  };
}

export const INSTRUMENTS = {
  A: buildDefinition("A"),
  B: buildDefinition("B"),
};

export function instrumentForRole(roleLevel: RoleLevel): Instrument {
  return INSTRUMENTS[FORM_BY_ROLE[roleLevel]];
}

export function riskClass(level?: string) {
  return `risk-${String(level || "unknown").replaceAll("_", "-")}`;
}
