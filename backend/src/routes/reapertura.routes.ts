import { Router, type NextFunction, type Request, type Response } from 'express';
import { getPool, sql } from '../config/db.js';
import { AppError } from '../utils/errors.js';
import { isBlank, parseId } from '../utils/validation.js';

/*
 * Parte 2 - Reabrir expediente (Cerrado -> En seguimiento).
 * Responsable: mavasquez. Archivo separado para no tocar seguimiento.routes.ts (Jaqui).
 * Montado en /api/expedientes. Contrato: docs/openapi.yaml (tag Reapertura).
 *
 * La API valida el motivo para dar un error por campo; la regla de estado
 * (solo Cerrado) y el resto viven en dbo.sp_ReabrirExpediente, así que
 * nadie puede saltársela llamando la API directamente.
 */
const router = Router();

const MAX_MOTIVO = 500;

router.post('/:id/reapertura', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) throw new AppError(400, 'Identificador inválido.');

    const motivo: unknown = req.body?.motivo;
    if (isBlank(motivo)) {
      throw new AppError(400, 'Revise los campos marcados.', {
        motivo: 'El motivo de reapertura es obligatorio.',
      });
    }
    if ((motivo as string).trim().length > MAX_MOTIVO) {
      throw new AppError(400, 'Revise los campos marcados.', {
        motivo: `El motivo no puede superar ${MAX_MOTIVO} caracteres.`,
      });
    }

    const db = await getPool();
    const result = await db
      .request()
      .input('ExpedienteId', sql.Int, id)
      .input('Motivo', sql.NVarChar(MAX_MOTIVO), (motivo as string).trim())
      .execute('dbo.sp_ReabrirExpediente');

    res.status(200).json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
