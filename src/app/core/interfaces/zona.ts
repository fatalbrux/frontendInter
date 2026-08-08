export interface CiudadResumen {
  id: number;
  nombre: string;
}

export interface Zona {
  id: number;
  nombre: string;
  estado: string;
  creadoEn: Date;
  ciudadId?: number;
  ciudad?: CiudadResumen;
}