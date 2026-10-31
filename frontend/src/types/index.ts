// Tipos espejo de docs/openapi.yaml. Si cambia el contrato, se actualiza aquí.

export type Estado = 'Abierto' | 'En seguimiento' | 'Cerrado';
export type Categoria = 'Civil' | 'Familiar' | 'Laboral';

export interface Expediente {
  id: number;
  codigo: string;
  solicitante: string;
  asunto: string;
  responsable: string;
  categoria: Categoria | null;
  estado: Estado;
  fechaApertura: string;
  fechaCierre: string | null;
  motivoCierre: string | null;
  totalActividades: number;
}

export interface NuevoExpediente {
  solicitante: string;
  asunto: string;
  responsable: string;
  categoria?: Categoria | null;
}

export interface Actividad {
  id: number;
  expedienteId: number;
  descripcion: string;
  tipo: string | null;
  fecha: string;
  orden: number;
}

export interface NuevaActividad {
  descripcion: string;
  tipo?: string | null;
}

export interface EntradaHistorial {
  expedienteId: number;
  orden: number;
  tipoEntrada: 'ACTIVIDAD' | 'ESTADO';
  fecha: string;
  descripcion: string;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  motivo: string | null;
  tipoActividad: string | null;
}

export interface ApiErrorBody {
  error: string;
  detalles?: Record<string, string>;
}
