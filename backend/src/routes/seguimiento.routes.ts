import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import { agregarActividad, cerrarExpediente, obtenerHistorial, pasarASeguimiento } from '../services/seguimiento.service.js';
import { AppError } from '../utils/errors.js';
import { isBlank, parseId } from '../utils/validation.js';

const router = Router();

type AsyncRoute = (req: Request, res: Response) => Promise<void>;

function asyncHandler(handler: AsyncRoute): RequestHandler {
  return (req, res, next) => {
    void handler(req, res).catch(next);
  };
}

function requireId(value: string): number {
  const id = parseId(value);
  if (id === null) {
    throw new AppError(400, 'El id debe ser un entero positivo.', {
      id: 'Proporcione un identificador de expediente válido.',
    });
  }
  return id;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

router.get(
  '/:id/historial',
  asyncHandler(async (req, res) => {
    const historial = await obtenerHistorial(requireId(req.params.id));
    res.json(historial);
  }),
);

router.post(
  '/:id/actividades',
  asyncHandler(async (req, res) => {
    const id = requireId(req.params.id);
    const body = isRecord(req.body) ? req.body : {};
    const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
    const tipo = body.tipo;
    const detalles: Record<string, string> = {};

    if (isBlank(descripcion)) {
      detalles.descripcion = 'La descripción de la actividad es obligatoria.';
    } else if (descripcion.length > 1000) {
      detalles.descripcion = 'La descripción no puede exceder 1000 caracteres.';
    }

    if (tipo !== undefined && tipo !== null && typeof tipo !== 'string') {
      detalles.tipo = 'El tipo de actividad debe ser texto.';
    } else if (typeof tipo === 'string' && tipo.trim().length > 50) {
      detalles.tipo = 'El tipo de actividad no puede exceder 50 caracteres.';
    }

    if (Object.keys(detalles).length > 0) {
      throw new AppError(400, 'Revise los campos marcados.', detalles);
    }

    const actividad = await agregarActividad(
      id,
      descripcion,
      typeof tipo === 'string' ? tipo.trim() || null : null,
    );
    res.status(201).json(actividad);
  }),
);

router.post(
  '/:id/seguimiento',
  asyncHandler(async (req, res) => {
    const expediente = await pasarASeguimiento(requireId(req.params.id));
    res.json(expediente);
  }),
);

router.post(
  '/:id/cierre',
  asyncHandler(async (req, res) => {
    const id = requireId(req.params.id);
    const body = isRecord(req.body) ? req.body : {};
    const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : '';

    if (isBlank(motivo)) {
      throw new AppError(400, 'Revise los campos marcados.', {
        motivo: 'El motivo de cierre es obligatorio.',
      });
    }
    if (motivo.length > 500) {
      throw new AppError(400, 'Revise los campos marcados.', {
        motivo: 'El motivo de cierre no puede exceder 500 caracteres.',
      });
    }

    const expediente = await cerrarExpediente(id, motivo);
    res.json(expediente);
  }),
);

export default router;
