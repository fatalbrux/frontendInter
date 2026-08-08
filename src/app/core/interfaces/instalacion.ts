export interface ClienteResumen {
  id: number;
  nombres: string;
  apellidos: string;
  codigo?: string;
  ci?: string;
}

export interface EquipoResumen {
  id: number;
  codigo: string;
  modelo?: string;
  nroSerie?: string;
}

export interface ZonaResumen {
  id: number;
  nombre: string;
}

export interface TecnicoResumen {
  id: number;
  nombreCompleto: string;
}

export interface Instalacion {
  id: number;
  fechaInstalacion: Date;
  direccion: string;
  observaciones: string;
  creadoEn: Date;
  clienteId?: number;
  equipoId?: number;
  zonaId?: number;
  tecnicoId?: number;
  cliente?: ClienteResumen;
  equipo?: EquipoResumen;
  zona?: ZonaResumen;
  tecnico?: TecnicoResumen;
}