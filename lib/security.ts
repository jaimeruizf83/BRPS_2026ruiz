import { getBindings } from "@/db";

const encoder = new TextEncoder();
const CONSENT_VERSION = "2026-08-demo-v1";

export { CONSENT_VERSION };

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function appSecret() {
  const value = getBindings().BRPS_APP_SECRET?.trim();
  if (!value || value.length < 32) {
    throw new Error("BRPS_APP_SECRET debe tener al menos 32 caracteres");
  }
  return value;
}

async function hmac(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function randomToken(bytes = 32) {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function issueCsrf(subject: string, purpose: string, ttlMinutes = 30) {
  const payload = bytesToBase64Url(
    encoder.encode(
      JSON.stringify({
        subject,
        purpose,
        expires: Date.now() + ttlMinutes * 60_000,
        nonce: randomToken(12),
      }),
    ),
  );
  const signature = bytesToBase64Url(await hmac(payload));
  return `${payload}.${signature}`;
}

export async function verifyCsrf(
  token: string,
  subject: string,
  purpose: string,
) {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return false;
    const expected = await hmac(payload);
    const actual = base64UrlToBytes(signature);
    if (expected.length !== actual.length) return false;
    let difference = 0;
    for (let index = 0; index < expected.length; index += 1) {
      difference |= expected[index] ^ actual[index];
    }
    if (difference !== 0) return false;
    const data = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as {
      subject?: string;
      purpose?: string;
      expires?: number;
    };
    return (
      data.subject === subject &&
      data.purpose === purpose &&
      Number(data.expires) >= Date.now()
    );
  } catch {
    return false;
  }
}

export async function hashIp(ip: string) {
  return bytesToBase64Url(await hmac(`ip:${ip || "unknown"}`));
}

export function requestIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function isSameOrigin(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "none"].includes(fetchSite)) return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

export function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  const neutralized = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${neutralized.replaceAll('"', '""')}"`;
}

export function minimumGroupSize() {
  const configured = Number(getBindings().MIN_GROUP_SIZE ?? 5);
  return Number.isInteger(configured) && configured >= 3 ? configured : 5;
}
