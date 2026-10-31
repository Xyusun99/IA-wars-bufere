import { Router, type NextFunction, type Request, type Response } from 'express';
import {
  MAX_ASUNTO,
  MAX_RESPONSABLE,
  MAX_SOLICITANTE,
  aIdEntero,
  crearExpediente,
  listarExpedientes,
  obtenerExpediente,
} from '../services/expedientes.service.js';
import { AppError } from '../utils/errors.js';
import { isBlank } from '../utils/validation.js';

/*
 * Responsable: Daniel (rama feature/Daniel)
 * Contrato: docs/openapi.yaml (tag Expedientes)
 *
 *   GET  /api/expedientes?q=&estado=   listar / buscar
 *   POST /api/expedientes              crear (sp_CrearExpediente)
 *   GET  /api/expedientes/:id          detalle (vw_Expedientes)
 *
 * La API valida para devolver un error por campo; la apertura y sus reglas
 * viven en dbo.sp_CrearExpediente. Sin rutas comodín: seguimiento y reapertura
 * se montan después sobre el mismo prefijo.
 */
const router = Router();

const CATEGORIAS = ['Civil', 'Familiar', 'Laboral'];

function validarTexto(
  detalles: Record<string, string>,
  campo: string,
  value: unknown,
  max: number,
  obligatorio: string,
  etiqueta: string,
) {
  if (isBlank(value)) {
    detalles[campo] = obligatorio;
  } else if ((value as string).trim().length > max) {
    detalles[campo] = `${etiqueta} no puede superar ${max} caracteres.`;
  }
}

/** Texto de un parámetro de consulta; null si falta, está vacío o viene repetido. */
function textoDeConsulta(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expedientes = await listarExpedientes(textoDeConsulta(req.query.q), textoDeConsulta(req.query.estado));
    res.status(200).json(expedientes);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { solicitante, asunto, responsable, categoria } = (req.body ?? {}) as Record<string, unknown>;

    const detalles: Record<string, string> = {};
    validarTexto(detalles, 'solicitante', solicitante, MAX_SOLICITANTE, 'El nombre o alias del solicitante es obligatorio.', 'El nombre o alias');
    validarTexto(detalles, 'asunto', asunto, MAX_ASUNTO, 'La descripción del asunto es obligatoria.', 'La descripción');
    validarTexto(detalles, 'responsable', responsable, MAX_RESPONSABLE, 'El nombre del responsable es obligatorio.', 'El nombre del responsable');

    const sinCategoria = categoria === undefined || categoria === null || categoria === '';
    if (!sinCategoria && !CATEGORIAS.includes(categoria as string)) {
      detalles.categoria = 'La categoría debe ser Civil, Familiar o Laboral.';
    }

    if (Object.keys(detalles).length > 0) {
      throw new AppError(400, 'Revise los campos marcados.', detalles);
    }

    const expediente = await crearExpediente({
      solicitante: (solicitante as string).trim(),
      asunto: (asunto as string).trim(),
      responsable: (responsable as string).trim(),
      categoria: sinCategoria ? null : (categoria as string),
    });
    res.status(201).json(expediente);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = aIdEntero(req.params.id);
    if (id === null) throw new AppError(400, 'Identificador inválido.');

    const expediente = await obtenerExpediente(id);
    if (!expediente) throw new AppError(404, 'El expediente no existe.');

    res.status(200).json(expediente);
  } catch (err) {
    next(err);
  }
});

export default router;
