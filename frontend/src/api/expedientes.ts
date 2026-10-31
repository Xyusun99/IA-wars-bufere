/*
 * Responsable: Dayana (rama feature/Dayana)
 * Cliente de /expedientes según docs/openapi.yaml (apertura, listado y búsqueda).
 */
import type { Estado, Expediente, NuevoExpediente } from '../types';
import { request } from './client';

/** GET /expedientes: lista todo o busca por código, id o nombre/alias (q) y estado. */
export function listarExpedientes(q?: string, estado?: Estado): Promise<Expediente[]> {
  const params = new URLSearchParams();
  if (q?.trim()) params.set('q', q.trim());
  if (estado) params.set('estado', estado);
  const query = params.toString();
  return request<Expediente[]>(`/expedientes${query ? `?${query}` : ''}`);
}

/** POST /expedientes: abre un expediente (estado inicial Abierto). */
export function crearExpediente(data: NuevoExpediente): Promise<Expediente> {
  return request<Expediente>('/expedientes', { method: 'POST', body: JSON.stringify(data) });
}
