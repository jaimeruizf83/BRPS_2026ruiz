import assert from "node:assert/strict";
import test from "node:test";
import { normalizeUsername, validateUsername } from "../lib/usernames.ts";

test("normaliza el usuario antes de guardarlo", () => {
  assert.equal(normalizeUsername("  Jaime.Ruiz  "), "jaime.ruiz");
});

test("acepta usuarios seguros y rechaza formatos ambiguos", () => {
  assert.equal(validateUsername("jaime_ruiz-83"), "jaime_ruiz-83");
  assert.throws(() => validateUsername("jr"), /3 caracteres/);
  assert.throws(() => validateUsername("jaime ruiz"), /solo puede contener/);
  assert.throws(() => validateUsername("usuario@correo.com"), /solo puede contener/);
});
