import { getPool, sql } from '../config/db.js';

export const MAX_SOLICITANTE = 150;
export const MAX_ASUNTO = 500;
export const MAX_RESPONSABLE = 150;

const MAX_INT = 2147483647;

export interface DatosExpediente {
  solicitante: string;
  asunto: string;
  responsable: string;
  categoria: string | null;
}

/** Id o código numérico válido para una columna INT; null en cualquier otro caso. */
export function aIdEntero(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id > 0 && id <= MAX_INT ? id : null;
}

/** La regla de apertura (código, fecha, estado e historial) vive en dbo.sp_CrearExpediente. */
export async function crearExpediente(datos: DatosExpediente) {
  const db = await getPool();
  const result = await db
    .request()
    .input('Solicitante', sql.NVarChar(MAX_SOLICITANTE), datos.solicitante)
    .input('Asunto', sql.NVarChar(MAX_ASUNTO), datos.asunto)
    .input('Responsable', sql.NVarChar(MAX_RESPONSABLE), datos.responsable)
    .input('Categoria', sql.NVarChar(20), datos.categoria)
    .execute('dbo.sp_CrearExpediente');
  return result.recordset[0];
}

/** q coincide con el código, el id o parte del solicitante, sin distinguir mayúsculas. */
export async function listarExpedientes(q: string | null, estado: string | null) {
  const db = await getPool();
  const result = await db
    .request()
    .input('Q', sql.NVarChar(sql.MAX), q)
    .input('Id', sql.Int, q === null ? null : aIdEntero(q))
    // % _ [ se buscan como texto literal, no como comodines de LIKE.
    .input('Patron', sql.NVarChar(sql.MAX), q === null ? null : `%${q.replace(/[\\%_[]/g, '\\$&')}%`)
    .input('Estado', sql.NVarChar(sql.MAX), estado)
    .query(`
      SELECT *
      FROM dbo.vw_Expedientes
      WHERE (@Estado IS NULL OR estado = @Estado)
        AND (@Q IS NULL
             OR UPPER(codigo) = UPPER(@Q)
             OR id = @Id
             OR UPPER(solicitante) LIKE UPPER(@Patron) ESCAPE N'\\')
      ORDER BY id DESC
    `);
  return result.recordset;
}

export async function obtenerExpediente(id: number) {
  const db = await getPool();
  const result = await db
    .request()
    .input('Id', sql.Int, id)
    .query('SELECT * FROM dbo.vw_Expedientes WHERE id = @Id');
  return result.recordset[0] ?? null;
}
