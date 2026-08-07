export type MetodoPago = 'Efectivo' | 'Código QR';
export interface ClienteResumenPago {
  id: number;
  nombres: string;
  apellidos: string;
}

export interface Pago {
  id: number;
  nroRecibo: string;
  cliente?: ClienteResumenPago;
  clienteId?: number;
  usuario?: { id: number; nombreCompleto: string } | null;
  usuarioId?: number;
  fechaPago: Date;
  mesesPagados: number;
  monto: number;
  metodoPago: string;
  vencimientoAnterior: Date | null;
  nuevoVencimiento: Date | null;
  notas: string;
  creadoEn: Date;
}

export interface PagoPayload {
  clienteId: number;
  usuarioId?: number;
  fechaPago: string;
  mesesPagados: number;
  monto: number;
  metodoPago: MetodoPago;
  vencimientoAnterior?: Date;
  nuevoVencimiento?: Date;
  notas?: string;
}