# Privacidad

Guía técnica, no asesoría jurídica. La app no necesita nombres, documentos ni correos de participantes. Usa códigos sin significado externo y conserva cualquier tabla de correspondencia fuera del sistema.

Se almacenan identidad y rol de administradores; datos de campaña; código, cargo, Forma y consentimiento; respuestas, resultado, fecha y hash de IP. El hash de IP sigue siendo dato protegido y no aparece en la interfaz ni en exportaciones.

En el flujo por lotes, los PDF escaneados se guardan temporalmente en un bucket R2 privado bajo identificadores opacos. La lectura automática se realiza en servidor y solicita no transcribir nombres ni otros identificadores; aun así, el documento puede contenerlos y debe tratarse como información sensible. La configuración recomendada elimina el original al confirmar la revisión y conserva solo el código seudónimo, la matriz tabulada, confianza, advertencias y auditoría.

Antes de recolectar datos reales:

1. documenta responsable, finalidad, base aplicable y atención a titulares;
2. entrega enlaces por canal privado;
3. evita segmentos reidentificables;
4. mantén un mínimo grupal de 5 o más;
5. limita individuales a profesionales legitimados;
6. define retención, respaldo, restauración y eliminación;
7. protege y elimina las exportaciones conforme a esa política.
8. evita carpetas públicas permanentes en Drive; comparte solo el archivo durante la importación y revoca el vínculo después;
9. define si el proveedor de lectura automática cumple las condiciones contractuales y geográficas aplicables antes de activarlo.
