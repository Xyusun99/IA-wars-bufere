/** Error con código HTTP y detalles por campo (formato del contrato OpenAPI). */
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public detalles?: Record<string, string>,
  ) {
    super(message);
  }
}

/** Códigos THROW definidos en database/init.sql -> HTTP. */
const SQL_TO_HTTP: Record<number, number> = {
  50400: 400,
  50404: 404,
  50409: 409,
  50422: 422,
};

/** Convierte errores lanzados por los procedimientos almacenados en AppError. */
export function fromSqlError(err: unknown): AppError | null {
  const number = (err as { number?: number })?.number;
  if (number && SQL_TO_HTTP[number]) {
    return new AppError(SQL_TO_HTTP[number], (err as Error).message);
  }
  return null;
}
