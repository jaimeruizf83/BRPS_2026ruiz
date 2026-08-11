import Link from "next/link";
import type { AnswerRecord, SociodemographicRecord } from "@/lib/v3";
import {
  CONTRACT_OPTIONS,
  EDUCATION_OPTIONS,
  HOUSING_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  SALARY_OPTIONS,
  SEX_OPTIONS,
  STRATUM_OPTIONS,
  answeredCount,
  answeredItemCount,
} from "@/lib/v3";

export type ManualStep = "datos" | "intralaboral" | "extralaboral" | "estres" | "revision";

const STEP_LABELS: Array<{ key: ManualStep; label: string; number: string }> = [
  { key: "datos", label: "Datos generales", number: "01" },
  { key: "intralaboral", label: "Intralaboral", number: "02" },
  { key: "extralaboral", label: "Extralaboral", number: "03" },
  { key: "estres", label: "Estrés", number: "04" },
  { key: "revision", label: "Revisión", number: "05" },
];

export function ManualStepNav({
  baseHref,
  current,
}: {
  baseHref: string;
  current: ManualStep;
}) {
  return (
    <nav className="manual-steps" aria-label="Etapas de captura manual">
      {STEP_LABELS.map((step) => (
        <Link
          className={step.key === current ? "is-current" : ""}
          href={`${baseHref}?paso=${step.key}`}
          key={step.key}
          aria-current={step.key === current ? "step" : undefined}
        >
          <span>{step.number}</span>
          <strong>{step.label}</strong>
        </Link>
      ))}
    </nav>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  required = true,
}: {
  id: string;
  label: string;
  value?: string;
  options: readonly string[];
  required?: boolean;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}{required ? " *" : ""}</label>
      <select id={id} name={id} defaultValue={value ?? ""} required={required}>
        <option value="" disabled>Selecciona</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

export function SociodemographicFields({
  values,
  participantCode,
  roleLabel,
  form,
}: {
  values: SociodemographicRecord;
  participantCode: string;
  roleLabel: string;
  form: "A" | "B";
}) {
  return (
    <div className="form-grid manual-data-grid">
      <div className="field">
        <label htmlFor="applicationDate">Fecha de aplicación *</label>
        <input id="applicationDate" name="applicationDate" type="date" defaultValue={values.applicationDate ?? ""} required />
      </div>
      <div className="field">
        <label htmlFor="participantCodeView">ID del respondiente</label>
        <input id="participantCodeView" value={participantCode} readOnly disabled />
      </div>
      <div className="field field-full">
        <label htmlFor="fullName">Nombre completo *</label>
        <input id="fullName" name="fullName" defaultValue={values.fullName ?? ""} maxLength={160} autoComplete="off" required />
        <small>Dato sensible: solo es visible para perfiles profesionales autorizados.</small>
      </div>
      <SelectField id="sex" label="Sexo" value={values.sex} options={SEX_OPTIONS} />
      <div className="field">
        <label htmlFor="birthYear">Año de nacimiento *</label>
        <input id="birthYear" name="birthYear" type="number" min="1900" max={new Date().getUTCFullYear() - 14} defaultValue={values.birthYear ?? ""} required />
      </div>
      <SelectField id="maritalStatus" label="Estado civil (compatibilidad V3)" value={values.maritalStatus} options={MARITAL_STATUS_OPTIONS} required={false} />
      <SelectField id="education" label="Último nivel de estudios" value={values.education} options={EDUCATION_OPTIONS} />
      <div className="field field-full">
        <label htmlFor="occupation">Ocupación o profesión *</label>
        <input id="occupation" name="occupation" defaultValue={values.occupation ?? ""} maxLength={160} required />
      </div>
      <div className="manual-section-label field-full">Residencia y hogar</div>
      <div className="field">
        <label htmlFor="residenceCity">Ciudad / municipio de residencia *</label>
        <input id="residenceCity" name="residenceCity" defaultValue={values.residenceCity ?? ""} maxLength={100} required />
      </div>
      <div className="field">
        <label htmlFor="residenceDepartment">Departamento de residencia *</label>
        <input id="residenceDepartment" name="residenceDepartment" defaultValue={values.residenceDepartment ?? ""} maxLength={100} required />
      </div>
      <SelectField id="socioeconomicStratum" label="Estrato de servicios públicos" value={values.socioeconomicStratum} options={STRATUM_OPTIONS} />
      <SelectField id="housingType" label="Tipo de vivienda" value={values.housingType} options={HOUSING_OPTIONS} />
      <div className="field">
        <label htmlFor="economicDependents">Personas que dependen económicamente *</label>
        <input id="economicDependents" name="economicDependents" type="number" min="0" max="99" defaultValue={values.economicDependents ?? ""} required />
      </div>
      <div className="manual-section-label field-full">Información ocupacional</div>
      <div className="field">
        <label htmlFor="workCity">Ciudad / municipio donde trabaja *</label>
        <input id="workCity" name="workCity" defaultValue={values.workCity ?? ""} maxLength={100} required />
      </div>
      <div className="field">
        <label htmlFor="workDepartment">Departamento donde trabaja *</label>
        <input id="workDepartment" name="workDepartment" defaultValue={values.workDepartment ?? ""} maxLength={100} required />
      </div>
      <div className="field">
        <label htmlFor="companyTenureYears">Años en la empresa *</label>
        <input id="companyTenureYears" name="companyTenureYears" type="number" min="0" max="99" step="0.1" defaultValue={values.companyTenureYears ?? ""} required />
        <small>Registra 0 si lleva menos de un año.</small>
      </div>
      <div className="field">
        <label htmlFor="jobTitle">Nombre del cargo *</label>
        <input id="jobTitle" name="jobTitle" defaultValue={values.jobTitle ?? ""} maxLength={160} required />
      </div>
      <div className="field field-full readonly-summary">
        <span>Nivel del cargo e instrumento</span>
        <strong>{roleLabel} · Intralaboral Forma {form}</strong>
      </div>
      <div className="field">
        <label htmlFor="jobTenureYears">Años en el cargo actual *</label>
        <input id="jobTenureYears" name="jobTenureYears" type="number" min="0" max="99" step="0.1" defaultValue={values.jobTenureYears ?? ""} required />
        <small>Registra 0 si lleva menos de un año.</small>
      </div>
      <div className="field">
        <label htmlFor="workArea">Departamento, área o sección *</label>
        <input id="workArea" name="workArea" defaultValue={values.workArea ?? ""} maxLength={160} required />
      </div>
      <SelectField id="contractType" label="Tipo de contrato" value={values.contractType} options={CONTRACT_OPTIONS} />
      <div className="field">
        <label htmlFor="dailyHours">Horas diarias establecidas *</label>
        <input id="dailyHours" name="dailyHours" type="number" min="0" max="24" step="0.5" defaultValue={values.dailyHours ?? ""} required />
      </div>
      <div className="field field-full">
        <label htmlFor="salaryType">Tipo de salario *</label>
        <select id="salaryType" name="salaryType" defaultValue={values.salaryType ?? ""} required>
          <option value="" disabled>Selecciona</option>
          {SALARY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
    </div>
  );
}

export function InstrumentCapture({
  title,
  description,
  expected,
  options,
  answers,
  itemNumbers,
}: {
  title: string;
  description: string;
  expected: number;
  options: readonly { value: string; label: string }[];
  answers: AnswerRecord;
  itemNumbers?: readonly number[];
}) {
  const items = itemNumbers ?? Array.from({ length: expected }, (_, index) => index + 1);
  const answered = itemNumbers ? answeredItemCount(answers, items) : answeredCount(answers, expected);
  return (
    <>
      <div className="manual-instrument-head">
        <div>
          <p className="eyebrow">Aplicativo V3</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="manual-counter"><strong>{answered}</strong><span>de {items.length}</span></div>
      </div>
      <div className="scale-legend" aria-label="Opciones de respuesta">
        {options.map((option) => <span key={option.value}>{option.label}</span>)}
      </div>
      <div className="manual-answer-grid">
        {items.map((item) => (
          <div className="manual-answer-row" key={item}>
            <label htmlFor={`item_${item}`}><span>{item}</span>Ítem {item}</label>
            <select id={`item_${item}`} name={`item_${item}`} defaultValue={answers[String(item)] ?? ""} aria-label={`Respuesta del ítem ${item}`}>
              <option value="">Sin respuesta</option>
              {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        ))}
      </div>
    </>
  );
}

export function CompletionMeter({
  label,
  value,
  expected,
}: {
  label: string;
  value: number;
  expected: number;
}) {
  const percentage = expected ? Math.round((value / expected) * 100) : 0;
  return (
    <article className={value === expected ? "is-complete" : ""}>
      <div><strong>{label}</strong><span>{value} de {expected}</span></div>
      <div className="progress-track"><span style={{ width: `${percentage}%` }} /></div>
      <small>{value === expected ? "Completo" : `${expected - value} pendiente(s)`}</small>
    </article>
  );
}
