export interface Instalacion {
  id: number;
  fechaInstalacion: Date;
  direccion: string;
  observaciones: string;
  creadoEn: Date;
  clienteId: number;
  equipoId: number;
  zonaId: number;
  tecnicoId: number;
}