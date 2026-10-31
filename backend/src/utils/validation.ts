/** true si el valor no es texto o queda vacío después de trim(). */
export function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0;
}

/** Convierte el parámetro :id en entero positivo o devuelve null. */
export function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
