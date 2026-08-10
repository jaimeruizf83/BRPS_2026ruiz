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

No confirmes `.env`. Rota `BRPS_APP_SECRET` si aparece en logs o commits. Antes de producción revisa acceso del Site, banco autorizado, roles, retención, respaldos y ejecuta `npm run check`.
