"use client";

import { useState } from "react";

type PendingDocument = { id: string; csrf: string; name: string };

export function BatchProcessor({
  batchId,
  documents,
}: {
  batchId: string;
  documents: PendingDocument[];
}) {
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [current, setCurrent] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  async function processAll() {
    setRunning(true);
    setProcessed(0);
    setErrors([]);
    const failures: string[] = [];
    for (const document of documents) {
      setCurrent(document.name);
      const body = new FormData();
      body.set("csrf", document.csrf);
      try {
        const response = await fetch(
          `/api/admin/batches/${batchId}/documents/${document.id}/process`,
          { method: "POST", body, headers: { Accept: "application/json" } },
        );
        const payload = (await response.json()) as { ok?: boolean; error?: string };
        if (!response.ok || !payload.ok) {
          failures.push(`${document.name}: ${payload.error || "falló la lectura"}`);
        }
      } catch {
        failures.push(`${document.name}: se perdió la conexión`);
      }
      setProcessed((value) => value + 1);
    }
    setCurrent("");
    setErrors(failures);
    setRunning(false);
    if (!failures.length) window.location.reload();
  }

  const progress = documents.length
    ? Math.round((processed / documents.length) * 100)
    : 0;
  return (
    <div className="batch-processor">
      <div>
        <strong>Lectura secuencial</strong>
        <small>
          {running
            ? `Procesando ${current} · ${processed} de ${documents.length}`
            : `${documents.length} documento(s) pendientes o con error`}
        </small>
      </div>
      {running && (
        <span className="processor-progress" aria-label={`${progress}% completado`}>
          <span style={{ width: `${progress}%` }} />
        </span>
      )}
      <button
        className="button button-primary button-small"
        type="button"
        disabled={running || !documents.length}
        onClick={processAll}
      >
        {running ? "Procesando…" : "Procesar pendientes"}
      </button>
      {errors.length > 0 && (
        <div className="processor-errors" role="alert">
          <strong>{errors.length} documento(s) requieren atención.</strong>
          <ul>{errors.slice(0, 4).map((error) => <li key={error}>{error}</li>)}</ul>
          <button className="table-link" type="button" onClick={() => window.location.reload()}>
            Actualizar estado
          </button>
        </div>
      )}
    </div>
  );
}
