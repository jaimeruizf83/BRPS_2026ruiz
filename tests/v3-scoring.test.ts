import assert from "node:assert/strict";
import test from "node:test";
import { V3_BAREMOS } from "../lib/v3-scoring-data.ts";
import { scoreV3Battery, V3_SCORING_VERSION } from "../lib/v3-scoring.ts";

type Frequency = "always" | "almost_always" | "sometimes" | "almost_never" | "never";

function repeated(count: number, value: Frequency) {
  return Object.fromEntries(Array.from({ length: count }, (_, index) => [String(index + 1), value]));
}

function score(input: Partial<Parameters<typeof scoreV3Battery>[0]> = {}) {
  return scoreV3Battery({
    form: "A",
    roleLevel: "leadership",
    intralaboral: repeated(123, "sometimes"),
    extralaboral: repeated(31, "sometimes"),
    stress: repeated(31, "sometimes"),
    servesCustomers: true,
    supervisesPeople: true,
    ...input,
  });
}

test("todos los baremos cubren de 0,0 a 100,0 sin vacíos", () => {
  for (const [code, bands] of Object.entries(V3_BAREMOS)) {
    for (let tenth = 0; tenth <= 1000; tenth += 1) {
      const value = tenth / 10;
      const matches = bands.filter((band) => value >= band.from && value <= band.to);
      assert.equal(matches.length, 1, `${code} debe cubrir ${value.toFixed(1)} exactamente una vez`);
    }
  }
});

test("calcula y clasifica los totales oficiales de un caso de control Forma A", () => {
  const intralaboral = repeated(123, "sometimes");
  for (const item of [4,5,6,9,12,14,32,34,39,40,41,42,43,44,45,46]) intralaboral[String(item)] = "never";
  const extralaboral = repeated(31, "always");
  extralaboral["2"] = "never";
  const result = score({ intralaboral, extralaboral });

  assert.equal(result.engineVersion, V3_SCORING_VERSION);
  assert.equal(result.intralaboral.total.raw, 278);
  assert.equal(result.intralaboral.total.score, 56.5);
  assert.equal(result.extralaboral.total.raw, 28);
  assert.equal(result.extralaboral.total.score, 22.6);
  assert.equal(result.general.raw, 306);
  assert.equal(result.general.score, 49.7);
  assert.equal(result.valid, true);
});

test("respeta factores de transformación de dimensiones Forma A y B", () => {
  const intralaboralA = repeated(123, "sometimes");
  for (const item of [76, 77, 78]) intralaboralA[String(item)] = "never";
  const resultA = score({ intralaboral: intralaboralA });
  const relations = resultA.intralaboral.dimensions.find((dimension) => dimension.key === "A_DIM_relaciones");
  assert.equal(relations?.raw, 34);
  assert.equal(relations?.score, 60.7);

  const intralaboralB = repeated(97, "always");
  intralaboralB["21"] = "almost_always";
  const resultB = score({
    form: "B",
    roleLevel: "operator",
    intralaboral: intralaboralB,
    supervisesPeople: false,
  });
  const workday = resultB.intralaboral.dimensions.find((dimension) => dimension.key === "B_DIM_jornada");
  assert.equal(workday?.raw, 7);
  assert.equal(workday?.score, 29.2);
});

test("aplica en cero los bloques descartados por filtros oficiales", () => {
  const intralaboral = repeated(105, "sometimes");
  const result = score({
    intralaboral,
    servesCustomers: false,
    supervisesPeople: false,
    roleLevel: "professional_technical",
  });
  const emotional = result.intralaboral.dimensions.find((dimension) => dimension.key === "A_DIM_emocionales");
  const collaborators = result.intralaboral.dimensions.find((dimension) => dimension.key === "A_DIM_colaboradores");
  assert.deepEqual({ applicable: emotional?.applicable, raw: emotional?.raw, score: emotional?.score }, { applicable: false, raw: 0, score: 0 });
  assert.deepEqual({ applicable: collaborators?.applicable, raw: collaborators?.raw, score: collaborators?.score }, { applicable: false, raw: 0, score: 0 });
  assert.equal(result.intralaboral.total.valid, true);
});

test("aplica las reglas oficiales de datos faltantes", () => {
  const oneMissing = repeated(123, "sometimes");
  delete oneMissing["63"];
  const accepted = score({ intralaboral: oneMissing });
  const leadershipAccepted = accepted.intralaboral.dimensions.find((dimension) => dimension.key === "A_DIM_liderazgo");
  assert.equal(leadershipAccepted?.valid, true);
  assert.deepEqual(leadershipAccepted?.missingItems, [63]);

  const twoMissing = { ...oneMissing };
  delete twoMissing["64"];
  const rejected = score({ intralaboral: twoMissing });
  const leadershipRejected = rejected.intralaboral.dimensions.find((dimension) => dimension.key === "A_DIM_liderazgo");
  assert.equal(leadershipRejected?.valid, false);
  assert.equal(rejected.intralaboral.total.valid, false);
  assert.equal(rejected.general.valid, false);
});

test("calcula el promedio ponderado de estrés y exige 31 respuestas", () => {
  const maximum = score({ stress: repeated(31, "always") });
  assert.equal(maximum.stress.raw, 61.2);
  assert.equal(maximum.stress.score, 100);
  assert.equal(maximum.stress.risk?.key, "very_high");

  const incomplete = repeated(31, "sometimes");
  delete incomplete["31"];
  const invalid = score({ stress: incomplete });
  assert.equal(invalid.stress.valid, false);
  assert.deepEqual(invalid.stress.missingItems, [31]);
  assert.equal(invalid.valid, false);
});
