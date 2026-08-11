# Integración de instrumento autorizado

No copies ítems desde archivos históricos o manuales sin confirmar derechos de uso y reproducción.

1. Conserva evidencia de fuente, versión y autorización.
2. Modela A y B por separado.
3. Define ítem, dimensión, opciones y dirección de puntuación.
4. Carga factores y baremos autorizados por Forma.
5. Crea vectores de prueba sin PII y compara con la herramienta de referencia.
6. Revisa cálculo y redondeo de forma independiente.
7. Versiona el instrumento y conserva trazabilidad histórica.
8. Mantén versionado el motor manual y conserva la etiqueta demo en cualquier flujo no validado de forma independiente.

El motor manual V3 implementado en `lib/v3-scoring.ts` conserva separados los resultados de Forma A y B, aplica filtros oficiales, tolerancias de datos faltantes, factores de transformación, baremos por grupo ocupacional y la ponderación de estrés. Sus vectores de control no contienen información personal.

Para habilitar calificación real de PDF escaneados, agrega también una plantilla de lectura validada: cantidad y numeración de ítems, orden de las cinco posiciones, reglas de inversión, detección A/B y casos de doble marca o blanco. Evalúa la concordancia contra una muestra anonimizada revisada por dos profesionales antes de aceptar resultados automáticos. La confianza del modelo orienta la revisión, pero no sustituye la verificación del original.

Puntos de integración del OCR: `lib/openai-extraction.ts`, el esquema de respuestas por instrumento y las pruebas de concordancia. No reutilices `lib/instruments.ts` o `lib/scoring.ts` para resultados oficiales: ambos pertenecen al banco digital demostrativo.
