export type MetodoPago = 'Efectivo' | 'Código QR';
export type BancoPago = 'Banco Unión' | 'Banco BNB' | 'Banco Prodem' | 'Tigo Money';

export interface ClienteResumenPago {
  id: number;
  nombres: string;
  apellidos: string;
  usuario?: string; // 👈 agregar

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
  banco?: BancoPago;
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
  banco?: BancoPago;
  vencimientoAnterior?: Date;
  nuevoVencimiento?: Date;
  notas?: string;
}