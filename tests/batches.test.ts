import assert from "node:assert/strict";
import test from "node:test";
import {
  isDemoCompatible,
  isPdfBytes,
  normalizeExtraction,
  parseDriveReference,
  sanitizePdfName,
  suggestedParticipantCode,
} from "../lib/batches.ts";

test("identifica enlaces individuales y carpetas de Google Drive", () => {
  assert.deepEqual(
    parseDriveReference("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing"),
    { kind: "file", id: "1AbCdEfGhIjKlMnOp" },
  );
  assert.deepEqual(
    parseDriveReference("https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp"),
    { kind: "folder", id: "1AbCdEfGhIjKlMnOp" },
  );
});

test("rechaza enlaces externos y HTTP", () => {
  assert.throws(
    () => parseDriveReference("https://example.com/file/d/1AbCdEfGhIjKlMnOp"),
    /Google Drive/,
  );
  assert.throws(
    () => parseDriveReference("http://drive.google.com/file/d/1AbCdEfGhIjKlMnOp"),
    /HTTPS/,
  );
});

test("valida la firma PDF y neutraliza el nombre", () => {
  assert.equal(isPdfBytes(new TextEncoder().encode("%PDF-1.7")), true);
  assert.equal(isPdfBytes(new TextEncoder().encode("<html>")), false);
  const name = sanitizePdfName("../../prueba<script>.PDF");
  assert.equal(name.includes("/"), false);
  assert.equal(name.includes("<"), false);
  assert.equal(name.toLowerCase().endsWith(".pdf"), true);
  assert.equal(suggestedParticipantCode("a1b2-c3d4-e5f6"), "LOTE-A1B2C3D4");
});

test("normaliza extracción, vacíos, duplicados y señal de identidad", () => {
  const extraction = normalizeExtraction({
    participantCode: " P-001 ",
    detectedForm: "A",
    hasSensitiveIdentity: true,
    documentConfidence: 1.4,
    warnings: ["Hoja inclinada"],
    answers: [
      { itemNumber: 2, selectedValue: -1, confidence: 0.4, multipleMarks: true, notes: "dos" },
      { itemNumber: 1, selectedValue: 3, confidence: 0.9, multipleMarks: false, notes: "" },
      { itemNumber: 1, selectedValue: 4, confidence: 0.8, multipleMarks: false, notes: "corregida" },
    ],
  });
  assert.equal(extraction.documentConfidence, 1);
  assert.equal(extraction.answers.length, 2);
  assert.deepEqual(extraction.answers.map((answer) => answer.itemNumber), [1, 2]);
  assert.equal(extraction.answers[0].selectedValue, 4);
  assert.equal(extraction.answers[1].selectedValue, null);
  assert.match(extraction.warnings[0], /identificables/);
});

test("solo considera compatible una matriz demo completa y contigua", () => {
  const complete = [1, 2, 3].map((item) => ({
    item_number: item,
    selected_value: item % 5,
    reviewed_value: null,
  }));
  assert.equal(isDemoCompatible(complete, 3), true);
  assert.equal(isDemoCompatible(complete.slice(0, 2), 3), false);
  assert.equal(
    isDemoCompatible([{ ...complete[0], item_number: 2 }, complete[1], complete[2]], 3),
    false,
  );
  assert.equal(
    isDemoCompatible([{ ...complete[0], reviewed_value: -1 }, complete[1], complete[2]], 3),
    false,
  );
});
