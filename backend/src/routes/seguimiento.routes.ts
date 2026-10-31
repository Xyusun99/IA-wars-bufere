import { Router } from 'express';

/*
 * Responsable: Jaqui (rama feature/Jaqui)
 * Prompts: docs/PLAN_EQUIPO.md -> sección Jaqui
 * Contrato: docs/openapi.yaml (tag Seguimiento)
 *
 * Por implementar (montado en /api/expedientes):
 *   GET  /:id/historial      vw_HistorialExpediente ORDER BY orden
 *   POST /:id/actividades    sp_AgregarActividad
 *   POST /:id/seguimiento    sp_PasarASeguimiento
 *   POST /:id/cierre         sp_CerrarExpediente
 */
const router = Router();

export default router;
