import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, validatePassword, verifyPassword } from "../lib/passwords.ts";

test("exige una contraseña extensa y diversa", () => {
  assert.throws(() => validatePassword("Corta1983"), /12 caracteres/);
  assert.throws(() => validatePassword("solominusculaslargas"), /tres tipos/);
  assert.doesNotThrow(() => validatePassword("Clave-Segura-2026"));
});

test("guarda un hash salado y verifica sin revelar la contraseña", async () => {
  const password = "Clave-Segura-2026";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.match(first, /^pbkdf2-sha256:120000:/);
  assert.equal(first.includes(password), false);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("Clave-Incorrecta-2026", first), false);
});
