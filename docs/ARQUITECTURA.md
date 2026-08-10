# Arquitectura

```mermaid
flowchart TD
  A[Administración autenticada] --> B[Rol y empresa]
  B --> C[Campaña e invitación]
  C --> D[Participante con token]
  D --> E[Consentimiento y respuesta]
  E --> F[D1]
  F --> G[Individual restringido]
  F --> H[Agregado protegido]
```

- `app/`: páginas y rutas HTTP.
- `components/`: interfaz reusable.
- `lib/auth.ts`: identidad, roles y alcance.
- `lib/security.ts`: CSRF, hashing, tokens, origen y CSV.
- `lib/instruments.ts`: definición demo reemplazable.
- `lib/scoring.ts`: cálculo puro y agregación.
- `db/` y `drizzle/`: esquema, acceso y migración.
- `worker/`: entrada y cabeceras de seguridad.

Las Formas A y B se fijan al invitar y nunca se agregan juntas. Solo superadministración y psicología/SST ven resultados individuales. Administración de empresa y consulta quedan limitadas a su organización.
