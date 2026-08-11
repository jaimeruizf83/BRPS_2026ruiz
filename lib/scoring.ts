import { RISK_LEVELS } from "./instruments.ts";
import type { Instrument, RiskLevel, ScoreResult } from "./types.ts";

export function roundOne(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10;
}

export function classifyRisk(score: number, baremos: RiskLevel[] = RISK_LEVELS) {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error("El puntaje transformado debe estar entre 0 y 100");
  }
  const level = baremos.find((item) => score <= item.max);
  if (!level) throw new Error("No existe un baremo para el puntaje");
  return { key: level.key, label: level.label };
}

export function scoreSubmission(
  definition: Instrument,
  answers: Record<string, number | string>,
): ScoreResult {
  const normalized = new Map<string, number>();
  for (const question of definition.questions) {
    const numeric = Number(answers[question.id]);
    if (!Number.isInteger(numeric) || numeric < 0 || numeric > 4) {
      throw new Error(`Respuesta inválida o ausente para ${question.id}`);
    }
    normalized.set(
      question.id,
      question.direction === "protective" ? 4 - numeric : numeric,
    );
  }

  const dimensions = definition.dimensions.map((dimension) => {
    const questions = definition.questions.filter(
      (question) => question.dimension === dimension.key,
    );
    if (!questions.length) {
      throw new Error(`La dimensión ${dimension.key} no tiene preguntas`);
    }
    const raw = questions.reduce(
      (sum, question) => sum + (normalized.get(question.id) ?? 0),
      0,
    );
    const score = roundOne((raw / dimension.factor) * 100);
    return {
      key: dimension.key,
      label: dimension.label,
      domain: dimension.domain,
      raw,
      factor: dimension.factor,
      score,
      risk: classifyRisk(score, dimension.baremos),
    };
  });

  const domainResults = Object.entries(definition.domains).map(([key, label]) => {
    const members = dimensions.filter((dimension) => dimension.domain === key);
    const raw = members.reduce((sum, dimension) => sum + dimension.raw, 0);
    const factor = members.reduce((sum, dimension) => sum + dimension.factor, 0);
    const score = roundOne((raw / factor) * 100);
    return { key, label, raw, factor, score, risk: classifyRisk(score) };
  });

  const raw = dimensions.reduce((sum, dimension) => sum + dimension.raw, 0);
  const factor = dimensions.reduce((sum, dimension) => sum + dimension.factor, 0);
  const score = roundOne((raw / factor) * 100);

  return {
    instrumentId: definition.id,
    form: definition.form,
    version: definition.version,
    isDemo: definition.isDemo,
    answered: definition.questions.length,
    dimensions,
    domains: domainResults,
    total: { raw, factor, score, risk: classifyRisk(score) },
    calculatedAt: new Date().toISOString(),
  };
}

export function aggregateByForm(results: ScoreResult[], minimumGroupSize = 5) {
  const grouped = new Map<"A" | "B", ScoreResult[]>();
  for (const result of results) {
    grouped.set(result.form, [...(grouped.get(result.form) ?? []), result]);
  }

  return [...grouped.entries()].map(([form, formResults]) => {
    if (formResults.length < minimumGroupSize) {
      return {
        form,
        count: formResults.length,
        minimumGroupSize,
        suppressed: true as const,
        dimensions: [],
        total: null,
      };
    }
    const dimensions = formResults[0].dimensions.map((reference) => {
      const values = formResults.map(
        (result) =>
          result.dimensions.find(
            (dimension) => dimension.key === reference.key,
          )!,
      );
      return {
        key: reference.key,
        label: reference.label,
        domain: reference.domain,
        average: roundOne(
          values.reduce((sum, value) => sum + value.score, 0) / values.length,
        ),
        riskCounts: Object.fromEntries(
          RISK_LEVELS.map((level) => [
            level.key,
            values.filter((value) => value.risk.key === level.key).length,
          ]),
        ),
      };
    });
    const score = roundOne(
      formResults.reduce((sum, result) => sum + result.total.score, 0) /
        formResults.length,
    );
    return {
      form,
      count: formResults.length,
      minimumGroupSize,
      suppressed: false as const,
      dimensions,
      total: { score, risk: classifyRisk(score) },
    };
  });
}
