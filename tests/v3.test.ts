import test from "node:test";
import assert from "node:assert/strict";
import {
  SOCIODEMOGRAPHIC_REQUIRED_FIELDS,
  V3_COUNTS,
  applicableIntralaboralItems,
  v3Completion,
} from "../lib/v3.ts";

function answers(items: readonly number[]) {
  return Object.fromEntries(items.map((item) => [String(item), "always"]));
}

test("V3 conserva los máximos oficiales por instrumento", () => {
  assert.deepEqual(V3_COUNTS, {
    intralaboralA: 123,
    intralaboralB: 97,
    extralaboral: 31,
    stress: 31,
  });
});

test("los filtros definen los ítems intralaborales aplicables", () => {
  assert.equal(applicableIntralaboralItems({ form: "A", servesCustomers: false, supervisesPeople: false }).length, 105);
  assert.equal(applicableIntralaboralItems({ form: "A", servesCustomers: true, supervisesPeople: false }).length, 114);
  assert.equal(applicableIntralaboralItems({ form: "A", servesCustomers: false, supervisesPeople: true }).length, 114);
  assert.equal(applicableIntralaboralItems({ form: "A", servesCustomers: true, supervisesPeople: true }).length, 123);
  assert.equal(applicableIntralaboralItems({ form: "B", servesCustomers: false, supervisesPeople: false }).length, 88);
  assert.equal(applicableIntralaboralItems({ form: "B", servesCustomers: true, supervisesPeople: false }).length, 97);
});

test("una captura completa no exige bloques marcados como no aplicables", () => {
  const intraItems = applicableIntralaboralItems({ form: "A", servesCustomers: false, supervisesPeople: false });
  const completion = v3Completion({
    form: "A",
    sociodemographic: Object.fromEntries(SOCIODEMOGRAPHIC_REQUIRED_FIELDS.map((field) => [field, "dato"])),
    intralaboral: answers(intraItems),
    extralaboral: answers(Array.from({ length: 31 }, (_, index) => index + 1)),
    stress: answers(Array.from({ length: 31 }, (_, index) => index + 1)),
    servesCustomers: false,
    supervisesPeople: false,
    consentVerified: true,
  });
  assert.equal(completion.expectedIntralaboral, 105);
  assert.equal(completion.complete, true);
});

test("el filtro y cualquier respuesta aplicable pendiente impiden finalizar", () => {
  const base = applicableIntralaboralItems({ form: "B", servesCustomers: false, supervisesPeople: false });
  const common = {
    form: "B" as const,
    sociodemographic: Object.fromEntries(SOCIODEMOGRAPHIC_REQUIRED_FIELDS.map((field) => [field, "dato"])),
    extralaboral: answers(Array.from({ length: 31 }, (_, index) => index + 1)),
    stress: answers(Array.from({ length: 31 }, (_, index) => index + 1)),
    supervisesPeople: false,
    consentVerified: true,
  };
  assert.equal(v3Completion({ ...common, intralaboral: answers(base), servesCustomers: null }).complete, false);
  assert.equal(v3Completion({ ...common, intralaboral: answers(base.slice(1)), servesCustomers: false }).complete, false);
});
