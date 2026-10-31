import type { ApiErrorBody } from '../types';

/** Error de la API con mensaje legible y detalles por campo. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detalles?: Record<string, string>,
  ) {
    super(message);
  }
}

/** fetch a /api con JSON. Lanza ApiError con el mensaje del backend. */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.');
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = body as ApiErrorBody | null;
    throw new ApiError(res.status, err?.error ?? 'Ocurrió un error inesperado.', err?.detalles);
  }
  return body as T;
}
