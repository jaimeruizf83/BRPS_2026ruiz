const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeZone: "America/Bogota",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

export function formatDate(value?: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "—";
}

export function formatDateTime(value?: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : "—";
}

export const ROLE_LABELS = {
  super_admin: "Superadministración",
  psychologist: "Profesional SST / psicología",
  company_admin: "Administración de empresa",
  viewer: "Solo lectura",
} as const;

export const STATUS_LABELS = {
  draft: "Borrador",
  active: "Activa",
  closed: "Cerrada",
  invited: "Invitado",
  started: "Iniciado",
  completed: "Completado",
} as const;
