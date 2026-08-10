# Seguridad

Reporta vulnerabilidades mediante un GitHub Security Advisory privado. No publiques tokens, respuestas, datos personales ni capturas sensibles en issues.

## Controles

| Riesgo | Control |
|---|---|
| Suplantación | Identidad delegada y rol validado en servidor |
| Robo de enlace | Token aleatorio, hash, uso único y política de referencia |
| CSRF | HMAC con sujeto, propósito, vencimiento y mismo origen |
| Inyección | Consultas preparadas y validación de entradas |
| Reidentificación | Códigos seudónimos y supresión de grupos pequeños |
| Acceso cruzado | Verificación de organización en rutas protegidas |
| XSS/clickjacking | Escape de React, CSP y bloqueo de marcos |
| PDF malicioso o excesivo | Solo PDF con firma `%PDF-`, 15 MB por archivo, 50 MB por lote y sin ejecución local |
| SSRF por enlaces | Solo HTTPS de Drive, extracción estricta de ID y redirecciones limitadas a dominios de Google |
| Error de OCR | Borrador con confianza por ítem y confirmación profesional obligatoria |
| Exposición de originales | R2 privado, autorización por organización, `no-store` y eliminación configurable |

No confirmes `.env`. Rota `BRPS_APP_SECRET` u `OPENAI_API_KEY` si aparece en logs o commits. Antes de producción revisa acceso del Site, banco autorizado, roles, retención, respaldos y ejecuta `npm run check`.
