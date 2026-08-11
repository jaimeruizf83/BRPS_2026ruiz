const encoder = new TextEncoder();
const ITERATIONS = 120_000;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations },
      key,
      256,
    ),
  );
}

export function validatePassword(password: string) {
  if (password.length < 12) throw new Error("La contraseña debe tener al menos 12 caracteres");
  if (password.length > 128) throw new Error("La contraseña supera 128 caracteres");
  const categories = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length;
  if (categories < 3) {
    throw new Error("Combina al menos tres tipos: mayúsculas, minúsculas, números y símbolos");
  }
}

export async function hashPassword(password: string) {
  validatePassword(password);
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2-sha256:${ITERATIONS}:${toBase64Url(salt)}:${toBase64Url(hash)}`;
}

export async function verifyPassword(password: string, encoded: string) {
  try {
    const [algorithm, iterationsRaw, saltRaw, hashRaw] = encoded.split(":");
    const iterations = Number(iterationsRaw);
    if (algorithm !== "pbkdf2-sha256" || !Number.isInteger(iterations) || iterations < 100_000) return false;
    const expected = fromBase64Url(hashRaw);
    const actual = await derive(password, fromBase64Url(saltRaw), iterations);
    if (actual.length !== expected.length) return false;
    let difference = 0;
    for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
    return difference === 0;
  } catch {
    return false;
  }
}
