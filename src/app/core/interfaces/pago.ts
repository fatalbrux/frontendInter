export interface Pago {
  id: number;
  nroRecibo: string;
  fechaPago: Date;
  mesesPagados: number;
  monto: number;
  metodoPago: string;
  vencimientoAnterior: Date;
  nuevoVencimiento: Date;
  notas: string;
  creadoEn: Date;
  clienteId: number;
  usuarioId: number;
}