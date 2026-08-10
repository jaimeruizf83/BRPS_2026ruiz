# BRPS 2026 Ruiz

Aplicación web segura y responsive para organizar campañas de evaluación de factores de riesgo psicosocial, asignar la Forma A o B según el nivel del cargo, registrar consentimiento, calcular resultados configurables y producir reportes con controles de confidencialidad.

## Importante: versión demostrativa

El producto funciona de extremo a extremo, pero contiene un **banco sintético**. No incluye preguntas, claves ni baremos oficiales y sus resultados **no son válidos para diagnóstico ni decisiones ocupacionales**. Antes del uso real, un profesional autorizado debe integrar una copia legítima del instrumento, verificar cálculos y aprobar el tratamiento de datos.

No se incluyen el Excel histórico, contraseñas, nombres de trabajadores ni respuestas reales.

## Incluye

- Inicio responsive y panel de control.
- Identidad administradora de ChatGPT; la app no almacena contraseñas.
- Roles: superadministración, profesional SST/psicología, administración de empresa y consulta.
- Organizaciones, equipo, campañas y estados de aplicación.
- Códigos seudónimos y enlaces aleatorios de un solo uso, guardados solo como hash.
- Asignación automática A/B por nivel del cargo.
- Consentimiento versionado y prevención de duplicados.
- Cálculo por dimensión, dominio y total.
- Resultados individuales restringidos.
- Reportes A/B separados, con supresión bajo el mínimo grupal.
- CSV protegido contra fórmulas, auditoría, impresión/PDF y diseño móvil.
- Calificación por lotes con carga múltiple de PDF o enlaces individuales compartidos de Google Drive.
- Almacenamiento privado R2, lectura estructurada, confianza por ítem y revisión profesional obligatoria.
- Tabulación CSV flexible y calificación demo solo cuando la hoja coincide con la plantilla disponible.

## Arquitectura

| Capa | Tecnología |
|---|---|
| Interfaz y servidor | React App Router sobre Vinext |
| Ejecución | Cloudflare Worker / OpenAI Sites |
| Persistencia | Cloudflare D1 (metadatos) + R2 privado (PDF temporales) |
| Identidad | Sign in with ChatGPT administrado por Sites |
| Migraciones | Drizzle Kit |
| Calidad | ESLint + Node Test Runner + GitHub Actions |

Más detalle en [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md).

## Configuración

Node.js 22.13 o superior y un proyecto Sites con binding D1 `DB`.

```dotenv
BRPS_ADMIN_EMAILS=administrador@ejemplo.com
BRPS_APP_SECRET=secreto-aleatorio-de-32-o-mas-caracteres
MIN_GROUP_SIZE=5
OPENAI_API_KEY=secreto-del-proyecto
OPENAI_BATCH_MODEL=gpt-4.1
```

- `BRPS_ADMIN_EMAILS`: lista separada por comas de superadministradores iniciales.
- `BRPS_APP_SECRET`: secreto HMAC; debe configurarse como secreto del entorno.
- `MIN_GROUP_SIZE`: mínimo para mostrar agregados; el código nunca permite menos de 3.
- `OPENAI_API_KEY`: secreto usado en servidor para pretabular PDF; nunca se expone al navegador.
- `OPENAI_BATCH_MODEL`: modelo con visión y entrada PDF; el valor predeterminado es `gpt-4.1`.

```bash
npm ci
npm run dev
npm run check
```

Para cambiar el esquema, edita `db/schema.ts` y ejecuta `npm run db:generate`.

## Flujo

1. Registra organizaciones y responsables.
2. Crea una campaña en borrador.
3. Genera un código seudónimo y selecciona el nivel del cargo; la app fija A o B.
4. Activa la campaña y entrega el enlace por un canal privado.
5. El participante consiente, responde y envía una vez.
6. Monitorea avance, cierra la campaña y consulta reportes protegidos.

### Flujo por lotes

1. Abre **Lotes**, selecciona una campaña y carga hasta 20 PDF (15 MB cada uno, 50 MB por lote) o pega enlaces individuales de Drive.
2. Procesa los documentos de forma secuencial. Los enlaces de Drive deben estar compartidos para quien tenga el vínculo; las carpetas privadas requieren OAuth y no se importan.
3. Compara cada posición detectada con el original, corrige dudas y confirma la tabulación.
4. Exporta la matriz a CSV. La incorporación a resultados solo se permite con una plantilla compatible y consentimiento verificado.

La llamada de lectura usa la Responses API con salida JSON estricta y `store: false`. Los originales pueden eliminarse automáticamente después de la confirmación.

## Seguridad y privacidad

La app usa autorización en servidor, tokens de 256 bits, SHA-256, CSRF HMAC con vencimiento, comprobación de origen, consultas preparadas, cabeceras CSP/HSTS/anti-iframe, alcance por organización y mínimo grupal. Consulta [SECURITY.md](SECURITY.md) y [docs/PRIVACIDAD.md](docs/PRIVACIDAD.md).

## Instrumento autorizado

La integración responsable se documenta en [docs/INSTRUMENTO_OFICIAL.md](docs/INSTRUMENTO_OFICIAL.md). Referencias oficiales:

- [Fondo de Riesgos Laborales — descargas](https://www.fondoriesgoslaborales.gov.co/descargas/)
- [Resolución 2764 de 2022](https://www.fondoriesgoslaborales.gov.co/wp-content/uploads/2022/08/Resolucion-2764.pdf)
- [Manual intralaboral — Formas A y B](https://www.fondoriesgoslaborales.gov.co/wp-content/uploads/2025/06/2.-Manual-evaluacion-de-factores-de-riesgo-psicosociales-intralaboral-forma-AyB.pdf)

## Licencia

Código MIT. Los instrumentos de terceros conservan sus propias condiciones y no están cubiertos por esta licencia.
