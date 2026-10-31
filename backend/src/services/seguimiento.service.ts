import { getPool, sql } from '../config/db.js';
import { fromSqlError } from '../utils/errors.js';

export interface Actividad {
  id: number;
  expedienteId: number;
  descripcion: string;
  tipo: string | null;
  fecha: Date;
  orden: number;
}

export interface ExpedienteSeguimiento {
  id: number;
  codigo: string;
  solicitante: string;
  asunto: string;
  responsable: string;
  categoria: string | null;
  estado: 'Abierto' | 'En seguimiento' | 'Cerrado';
  fechaApertura: Date;
  fechaCierre: Date | null;
  motivoCierre: string | null;
  totalActividades: number;
}

export interface EntradaHistorial {
  expedienteId: number;
  orden: number;
  tipoEntrada: 'ACTIVIDAD' | 'ESTADO';
  fecha: Date;
  descripcion: string;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  motivo: string | null;
  tipoActividad: string | null;
}

async function translateSqlError<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const appError = fromSqlError(error);
    if (appError) {
      throw appError;
    }
    throw error;
  }
}

function requireResult<T>(value: T | undefined, operation: string): T {
  if (value === undefined) {
    throw new Error(`La base de datos no devolvió el resultado de ${operation}.`);
  }
  return value;
}

export function obtenerHistorial(expedienteId: number): Promise<EntradaHistorial[]> {
  return translateSqlError(async () => {
    const db = await getPool();
    const result = await db
      .request()
      .input('ExpedienteId', sql.Int, expedienteId)
      .query<EntradaHistorial>(`
        IF NOT EXISTS (SELECT 1 FROM dbo.Expedientes WHERE Id = @ExpedienteId)
          THROW 50404, N'El expediente no existe.', 1;

        SELECT expedienteId, orden, tipoEntrada, fecha, descripcion,
               estadoAnterior, estadoNuevo, motivo, tipoActividad
        FROM dbo.vw_HistorialExpediente
        WHERE expedienteId = @ExpedienteId
        ORDER BY orden ASC;
      `);

    return result.recordset;
  });
}

export function agregarActividad(
  expedienteId: number,
  descripcion: string,
  tipo: string | null,
): Promise<Actividad> {
  return translateSqlError(async () => {
    const db = await getPool();
    const result = await db
      .request()
      .input('ExpedienteId', sql.Int, expedienteId)
      .input('Descripcion', sql.NVarChar(1000), descripcion)
      .input('Tipo', sql.NVarChar(50), tipo)
      .execute<Actividad>('dbo.sp_AgregarActividad');

    return requireResult(result.recordset[0], 'crear la actividad');
  });
}

export function pasarASeguimiento(expedienteId: number): Promise<ExpedienteSeguimiento> {
  return translateSqlError(async () => {
    const db = await getPool();
    const result = await db
      .request()
      .input('ExpedienteId', sql.Int, expedienteId)
      .execute<ExpedienteSeguimiento>('dbo.sp_PasarASeguimiento');

    return requireResult(result.recordset[0], 'cambiar el estado del expediente');
  });
}

export function cerrarExpediente(expedienteId: number, motivo: string): Promise<ExpedienteSeguimiento> {
  return translateSqlError(async () => {
    const db = await getPool();
    const result = await db
      .request()
      .input('ExpedienteId', sql.Int, expedienteId)
      .input('Motivo', sql.NVarChar(500), motivo)
      .execute<ExpedienteSeguimiento>('dbo.sp_CerrarExpediente');

    return requireResult(result.recordset[0], 'cerrar el expediente');
  });
}
