import { Router } from 'express';

/*
 * Responsable: Daniel (rama feature/Daniel)
 * Prompts: docs/PLAN_EQUIPO.md -> sección Daniel
 * Contrato: docs/openapi.yaml (tag Expedientes)
 *
 * Por implementar:
 *   GET  /api/expedientes?q=&estado=   listar / buscar
 *   POST /api/expedientes              crear (sp_CrearExpediente)
 *   GET  /api/expedientes/:id          detalle (vw_Expedientes)
 */
const router = Router();

export default router;
