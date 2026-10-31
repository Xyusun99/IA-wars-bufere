import type { NextFunction, Request, Response } from 'express';
import { AppError, fromSqlError } from '../utils/errors.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const appError = err instanceof AppError ? err : fromSqlError(err);
  if (appError) {
    return res.status(appError.status).json({ error: appError.message, detalles: appError.detalles });
  }
  console.error(err);
  res.status(500).json({ error: 'Ocurrió un error inesperado. Intente de nuevo.' });
}
