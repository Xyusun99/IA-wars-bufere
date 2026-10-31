import { request } from './client';
import type { Actividad, EntradaHistorial, Expediente, NuevaActividad } from '../types';

export function obtenerExpediente(id: number): Promise<Expediente> {
  return request<Expediente>(`/expedientes/${id}`);
}

export function obtenerHistorial(id: number): Promise<EntradaHistorial[]> {
  return request<EntradaHistorial[]>(`/expedientes/${id}/historial`);
}

export function agregarActividad(id: number, data: NuevaActividad): Promise<Actividad> {
  return request<Actividad>(`/expedientes/${id}/actividades`, {
    method: 'POST', body: JSON.stringify(data),
  });
}

export function pasarASeguimiento(id: number): Promise<Expediente> {
  return request<Expediente>(`/expedientes/${id}/seguimiento`, { method: 'POST' });
}

export function cerrarExpediente(id: number, motivo: string): Promise<Expediente> {
  return request<Expediente>(`/expedientes/${id}/cierre`, {
    method: 'POST', body: JSON.stringify({ motivo }),
  });
}
