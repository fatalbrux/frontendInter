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
  tipoEquipoId: number;
  marcaId: number;
  clienteId: number | null;
}