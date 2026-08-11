export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string) {
  const username = normalizeUsername(value);
  if (username.length < 3) {
    throw new Error("El usuario debe tener al menos 3 caracteres");
  }
  if (username.length > 50) {
    throw new Error("El usuario supera 50 caracteres");
  }
  if (!/^[a-z0-9._-]+$/.test(username)) {
    throw new Error("El usuario solo puede contener letras, números, punto, guion y guion bajo");
  }
  return username;
}
