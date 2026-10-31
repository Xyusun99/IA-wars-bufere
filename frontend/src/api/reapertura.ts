// Parte 2 - Responsable: mavasquez. Archivo separado de api/seguimiento.ts (Bagner).
import type { Expediente } from '../types';
import { request } from './client';

/** POST /expedientes/:id/reapertura  (Cerrado -> En seguimiento). */
export function reabrirExpediente(id: number, motivo: string): Promise<Expediente> {
  return request<Expediente>(`/expedientes/${id}/reapertura`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  });
}
