import type { RoleLevel } from "./types";

export const V3_COUNTS = {
  intralaboralA: 123,
  intralaboralB: 97,
  extralaboral: 31,
  stress: 31,
} as const;

export const V3_FREQUENCY_OPTIONS = [
  { value: "always", label: "Siempre" },
  { value: "almost_always", label: "Casi siempre" },
  { value: "sometimes", label: "Algunas veces" },
  { value: "almost_never", label: "Casi nunca" },
  { value: "never", label: "Nunca" },
] as const;

export const V3_STRESS_OPTIONS = [
  { value: "always", label: "Siempre" },
  { value: "almost_always", label: "Casi siempre" },
  { value: "sometimes", label: "A veces" },
  { value: "never", label: "Nunca" },
] as const;

export const SEX_OPTIONS = ["Masculino", "Femenino", "No binario"] as const;

export const MARITAL_STATUS_OPTIONS = [
  "Soltero(a)",
  "Casado(a)",
  "Unión libre",
  "Separado(a)",
  "Divorciado(a)",
  "Viudo(a)",
  "Sacerdote / monja",
] as const;

export const EDUCATION_OPTIONS = [
  "Ninguno",
  "Primaria incompleta",
  "Primaria completa",
  "Bachillerato incompleto",
  "Bachillerato completo",
  "Técnico / tecnológico incompleto",
  "Técnico / tecnológico completo",
  "Profesional incompleto",
  "Profesional completo",
  "Carrera militar / policía",
  "Posgrado incompleto",
  "Posgrado completo",
] as const;

export const STRATUM_OPTIONS = ["1", "2", "3", "4", "5", "6", "Finca", "No sé"] as const;
export const HOUSING_OPTIONS = ["Propia", "En arriendo", "Familiar"] as const;
export const CONTRACT_OPTIONS = [
  "Temporal de menos de 1 año",
  "Temporal de 1 año o más",
  "Término indefinido",
  "Cooperado (cooperativa)",
  "Prestación de servicios",
  "No sé",
] as const;
export const SALARY_OPTIONS = [
  "Fijo (diario, semanal, quincenal o mensual)",
  "Una parte fija y otra variable",
  "Todo variable (a destajo, por producción o por comisión)",
] as const;

export const SOCIODEMOGRAPHIC_FIELDS = [
  "applicationDate",
  "fullName",
  "sex",
  "birthYear",
  "maritalStatus",
  "education",
  "occupation",
  "residenceCity",
  "residenceDepartment",
  "socioeconomicStratum",
  "housingType",
  "economicDependents",
  "workCity",
  "workDepartment",
  "companyTenureYears",
  "jobTitle",
  "jobTenureYears",
  "workArea",
  "contractType",
  "dailyHours",
  "salaryType",
] as const;

export const SOCIODEMOGRAPHIC_REQUIRED_FIELDS = SOCIODEMOGRAPHIC_FIELDS.filter(
  (field) => field !== "maritalStatus",
);

export type SociodemographicField = (typeof SOCIODEMOGRAPHIC_FIELDS)[number];
export type AnswerRecord = Record<string, string>;
export type SociodemographicRecord = Partial<Record<SociodemographicField, string>>;

export function intralaboralCount(form: "A" | "B") {
  return form === "A" ? V3_COUNTS.intralaboralA : V3_COUNTS.intralaboralB;
}

export function intralaboralCoreCount(form: "A" | "B") {
  return form === "A" ? 105 : 88;
}

export function customerItemNumbers(form: "A" | "B") {
  const first = form === "A" ? 106 : 89;
  return Array.from({ length: 9 }, (_, index) => first + index);
}

export const SUPERVISOR_ITEM_NUMBERS = Array.from({ length: 9 }, (_, index) => 115 + index);

export function applicableIntralaboralItems(input: {
  form: "A" | "B";
  servesCustomers: boolean;
  supervisesPeople: boolean;
}) {
  const items = Array.from({ length: intralaboralCoreCount(input.form) }, (_, index) => index + 1);
  if (input.servesCustomers) items.push(...customerItemNumbers(input.form));
  if (input.form === "A" && input.supervisesPeople) items.push(...SUPERVISOR_ITEM_NUMBERS);
  return items;
}

export function parseRecord(value: string | null | undefined): AnswerRecord {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}

export function answeredCount(answers: AnswerRecord, expected: number) {
  let count = 0;
  for (let item = 1; item <= expected; item += 1) {
    if (answers[String(item)]) count += 1;
  }
  return count;
}

export function answeredItemCount(answers: AnswerRecord, items: readonly number[]) {
  return items.reduce((count, item) => count + (answers[String(item)] ? 1 : 0), 0);
}

export function missingItemNumbers(answers: AnswerRecord, expected: number) {
  const missing: number[] = [];
  for (let item = 1; item <= expected; item += 1) {
    if (!answers[String(item)]) missing.push(item);
  }
  return missing;
}

export function readAnswers(
  form: FormData,
  expected: number,
  allowedOptions: readonly { value: string }[],
) {
  const allowed = new Set(allowedOptions.map((option) => option.value));
  const answers: AnswerRecord = {};
  for (let item = 1; item <= expected; item += 1) {
    const value = String(form.get(`item_${item}`) ?? "").trim();
    if (!value) continue;
    if (!allowed.has(value)) throw new Error(`Respuesta inválida en el ítem ${item}`);
    answers[String(item)] = value;
  }
  return answers;
}

export function readAnswersForItems(
  form: FormData,
  items: readonly number[],
  allowedOptions: readonly { value: string }[],
) {
  const allowed = new Set(allowedOptions.map((option) => option.value));
  const answers: AnswerRecord = {};
  for (const item of items) {
    const value = String(form.get(`item_${item}`) ?? "").trim();
    if (!value) continue;
    if (!allowed.has(value)) throw new Error(`Respuesta inválida en el ítem ${item}`);
    answers[String(item)] = value;
  }
  return answers;
}

export function readSociodemographic(form: FormData): SociodemographicRecord {
  const record: SociodemographicRecord = {};
  for (const key of SOCIODEMOGRAPHIC_FIELDS) {
    const value = String(form.get(key) ?? "").trim();
    if (value.length > 160) throw new Error(`El campo ${key} supera 160 caracteres`);
    if (value) record[key] = value;
  }

  const birthYear = Number(record.birthYear);
  const currentYear = new Date().getUTCFullYear();
  if (record.birthYear && (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > currentYear - 14)) {
    throw new Error("Revisa el año de nacimiento");
  }
  for (const key of ["economicDependents", "companyTenureYears", "jobTenureYears", "dailyHours"] as const) {
    if (!record[key]) continue;
    const value = Number(record[key]);
    if (!Number.isFinite(value) || value < 0 || value > (key === "dailyHours" ? 24 : 99)) {
      throw new Error(`Revisa el valor de ${key}`);
    }
  }
  return record;
}

export function missingSociodemographic(record: SociodemographicRecord) {
  return SOCIODEMOGRAPHIC_REQUIRED_FIELDS.filter((field) => !record[field]);
}

export function v3Completion(input: {
  form: "A" | "B";
  sociodemographic: SociodemographicRecord;
  intralaboral: AnswerRecord;
  extralaboral: AnswerRecord;
  stress: AnswerRecord;
  servesCustomers: boolean | null;
  supervisesPeople: boolean;
  consentVerified: boolean;
}) {
  const applicableIntralaboral = applicableIntralaboralItems({
    form: input.form,
    servesCustomers: input.servesCustomers === true,
    supervisesPeople: input.supervisesPeople,
  });
  const expectedIntralaboral = applicableIntralaboral.length;
  const socioMissing = missingSociodemographic(input.sociodemographic);
  const intraAnswered = answeredItemCount(input.intralaboral, applicableIntralaboral);
  const extraAnswered = answeredCount(input.extralaboral, V3_COUNTS.extralaboral);
  const stressAnswered = answeredCount(input.stress, V3_COUNTS.stress);
  return {
    expectedIntralaboral,
    applicableIntralaboral,
    filterPending: input.servesCustomers === null,
    socioMissing,
    intraAnswered,
    extraAnswered,
    stressAnswered,
    complete:
      socioMissing.length === 0 &&
      intraAnswered === expectedIntralaboral &&
      extraAnswered === V3_COUNTS.extralaboral &&
      stressAnswered === V3_COUNTS.stress &&
      input.servesCustomers !== null &&
      input.consentVerified,
  };
}

export function formForRole(role: RoleLevel): "A" | "B" {
  return role === "leadership" || role === "professional_technical" ? "A" : "B";
}
