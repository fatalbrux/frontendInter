export interface MarcaResumen {
  id: number;
  nombre: string;
}

export interface TipoEquipoResumen {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface ClienteResumen {
  id: number;
  nombres: string;
  apellidos: string;
  ci?: string;
  usuario?: string | null; // agrega | null
}

export interface Equipo {
  id: number;
  codigo: string;
  modelo: string;
  nroSerie: string;
  mac: string;
  ip: string;
  pppoeUsuario: string;
  pppoePassword: string;
  estado: string;
  creadoEn: Date;
  tipoEquipoId?: number;
  marcaId?: number;
  clienteId?: number | null;
  marca?: MarcaResumen;
  tipoEquipo?: TipoEquipoResumen;
  cliente?: ClienteResumen;
}