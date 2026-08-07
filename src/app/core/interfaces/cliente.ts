export interface ZonaResumen {
  id: number;
  nombre: string;
}

export interface PlanResumen {
  id: number;
  nombre: string;
  precioMensual: number;
}

export interface Cliente {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  ci: string;
  telefono: string;
  direccion: string;
  email: string;
  referencia: string;
  fechaInstalacion: Date;
  fechaPrimerPago: Date;
  estado: string;
  proximoVencimiento: Date;
  observaciones: string;
  creadoEn: Date;
  zona: ZonaResumen;
  plan: PlanResumen;
}

export type EstadoCliente = 'Activo' | 'Suspendido' | 'Corte de servicio';

export interface ClientePayload {
  codigo?: string;
  nombres?: string;
  apellidos?: string;
  ci?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  referencia?: string;
  fechaInstalacion?: Date;
  fechaPrimerPago?: Date;
  estado?: EstadoCliente;
  observaciones?: string;
  zonaId?: number;
  planId?: number;
}