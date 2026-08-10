export const MAX_BATCH_FILES = 20;
export const MAX_DRIVE_LINKS = 20;
export const MAX_PDF_BYTES = 15 * 1024 * 1024;
export const MAX_BATCH_BYTES = 50 * 1024 * 1024;
export const MAX_EXTRACTED_ITEMS = 500;

export type RequestedForm = "auto" | "A" | "B";
export type DetectedForm = "A" | "B" | "unknown";

export type ExtractedAnswer = {
  itemNumber: number;
  selectedValue: number | null;
  confidence: number;
  multipleMarks: boolean;
  notes: string;
};

export type PdfExtraction = {
  participantCode: string;
  detectedForm: DetectedForm;
  hasSensitiveIdentity: boolean;
  documentConfidence: number;
  answers: ExtractedAnswer[];
  warnings: string[];
};

const DRIVE_HOSTS = new Set([
  "drive.google.com",
  "drive.usercontent.google.com",
]);

function cleanText(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function sanitizePdfName(value: string) {
  const cleaned = cleanText(value, 140)
    .replace(/[\\/]+/g, "-")
    .replace(/[^\p{L}\p{N}._() -]+/gu, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+/, "")
    .trim();
  const base = cleaned || "prueba.pdf";
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

export function isPdfBytes(bytes: Uint8Array) {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

export async function sha256Bytes(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy.buffer);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export type DriveReference =
  | { kind: "file"; id: string }
  | { kind: "folder"; id: string };

export function parseDriveReference(value: string): DriveReference {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("El enlace de Google Drive no es válido");
  }
  if (url.protocol !== "https:" || !DRIVE_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Solo se aceptan enlaces HTTPS de Google Drive");
  }

  const folderMatch = url.pathname.match(/\/drive\/folders\/([A-Za-z0-9_-]{10,200})/);
  if (folderMatch) return { kind: "folder", id: folderMatch[1] };

  const pathMatch = url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]{10,200})/);
  const queryId = url.searchParams.get("id");
  const id = pathMatch?.[1] || queryId || "";
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(id)) {
    throw new Error("No se pudo identificar el archivo PDF en el enlace de Drive");
  }
  return { kind: "file", id };
}

function isAllowedDriveRedirect(url: URL) {
  const host = url.hostname.toLowerCase();
  return (
    url.protocol === "https:" &&
    (DRIVE_HOSTS.has(host) || host.endsWith(".googleusercontent.com"))
  );
}

async function readLimitedBody(response: Response, maxBytes: number) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new Error("El PDF de Drive supera 15 MB");
  if (!response.body) throw new Error("Drive no devolvió contenido");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("El PDF de Drive supera 15 MB");
    }
    chunks.push(value);
  }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return joined;
}

function filenameFromDisposition(value: string | null) {
  if (!value) return "";
  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return "";
    }
  }
  return value.match(/filename="?([^";]+)"?/i)?.[1] ?? "";
}

export async function fetchDrivePdf(fileId: string) {
  let current = new URL("https://drive.usercontent.google.com/download");
  current.searchParams.set("id", fileId);
  current.searchParams.set("export", "download");
  current.searchParams.set("confirm", "t");

  let response: Response | null = null;
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    response = await fetch(current, {
      redirect: "manual",
      headers: { Accept: "application/pdf" },
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get("location");
    if (!location) throw new Error("Drive devolvió una redirección incompleta");
    const next = new URL(location, current);
    if (!isAllowedDriveRedirect(next)) {
      throw new Error("Drive redirigió a un destino no permitido");
    }
    current = next;
  }
  if (!response?.ok) {
    throw new Error(
      "No fue posible descargar el archivo. Compártelo para quien tenga el enlace.",
    );
  }
  const bytes = await readLimitedBody(response, MAX_PDF_BYTES);
  if (!isPdfBytes(bytes)) {
    throw new Error(
      "El enlace no devolvió un PDF. Verifica el permiso de uso compartido.",
    );
  }
  return {
    bytes,
    name: sanitizePdfName(
      filenameFromDisposition(response.headers.get("content-disposition")) ||
        `drive-${fileId.slice(0, 10)}.pdf`,
    ),
  };
}

export function suggestedParticipantCode(opaqueDocumentId: string) {
  const suffix = opaqueDocumentId
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 8);
  return `LOTE-${suffix || "PENDIENTE"}`;
}

function confidence(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

export function normalizeExtraction(value: unknown): PdfExtraction {
  if (!value || typeof value !== "object") {
    throw new Error("El motor de lectura no devolvió una estructura válida");
  }
  const raw = value as Record<string, unknown>;
  const detectedForm: DetectedForm = ["A", "B"].includes(String(raw.detectedForm))
    ? (String(raw.detectedForm) as "A" | "B")
    : "unknown";
  const sourceAnswers = Array.isArray(raw.answers) ? raw.answers : [];
  const byItem = new Map<number, ExtractedAnswer>();
  for (const item of sourceAnswers.slice(0, MAX_EXTRACTED_ITEMS)) {
    if (!item || typeof item !== "object") continue;
    const answer = item as Record<string, unknown>;
    const itemNumber = Number(answer.itemNumber);
    if (!Number.isInteger(itemNumber) || itemNumber < 1 || itemNumber > 999) continue;
    const selected = Number(answer.selectedValue);
    byItem.set(itemNumber, {
      itemNumber,
      selectedValue:
        Number.isInteger(selected) && selected >= 0 && selected <= 4
          ? selected
          : null,
      confidence: confidence(answer.confidence),
      multipleMarks: Boolean(answer.multipleMarks),
      notes: cleanText(answer.notes, 160),
    });
  }
  const warnings = (Array.isArray(raw.warnings) ? raw.warnings : [])
    .map((item) => cleanText(item, 240))
    .filter(Boolean)
    .slice(0, 20);
  if (Boolean(raw.hasSensitiveIdentity)) {
    warnings.unshift(
      "El documento parece contener datos identificables; reemplázalos por un código seudónimo.",
    );
  }
  return {
    participantCode: cleanText(raw.participantCode, 40),
    detectedForm,
    hasSensitiveIdentity: Boolean(raw.hasSensitiveIdentity),
    documentConfidence: confidence(raw.documentConfidence),
    answers: [...byItem.values()].sort((a, b) => a.itemNumber - b.itemNumber),
    warnings: [...new Set(warnings)],
  };
}

export function confidenceLabel(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Sin lectura";
  if (value >= 0.9) return "Alta";
  if (value >= 0.75) return "Media";
  return "Baja";
}

export function isDemoCompatible(
  answers: Array<{ item_number: number; selected_value: number | null; reviewed_value: number | null }>,
  expectedItems: number,
) {
  if (answers.length !== expectedItems) return false;
  return answers.every((answer, index) => {
    const value =
      answer.reviewed_value === null ? answer.selected_value : answer.reviewed_value;
    return answer.item_number === index + 1 && value !== null && value >= 0 && value <= 4;
  });
}
