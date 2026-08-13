import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

export interface DatosRecibo {
  nroRecibo: string;
  fechaPago: string | Date;
  monto: number;
  mesesPagados: number;
  metodoPago: string;
  nombreCliente: string;
  usuarioCliente?: string | null;
  telefonoCliente?: string | null;
  proximoVencimiento?: string | Date | null;
}

// ================= DATOS DE LA EMPRESA =================
const EMPRESA = {
  nombre: 'SETCOM IT',
  direccion: 'Calle M Ñuflo de Chavez # 550',
  ciudad: 'Oruro - Bolivia',
  telefono: '73811118',
  nit: '7292602019',
};
// =========================================================

const OSCURO: [number, number, number] = [55, 58, 64];
const GRIS: [number, number, number] = [110, 116, 125];
const CLARO: [number, number, number] = [225, 227, 230];
const BORDE: [number, number, number] = [160, 166, 174];
const TEXTO: [number, number, number] = [35, 38, 43];

const ANCHO_PAPEL = 58;
const MARGEN = 4;
const ANCHO_UTIL = ANCHO_PAPEL - MARGEN * 2; // 50mm

@Injectable({ providedIn: 'root' })
export class ReciboService {

  generarRecibo(datos: DatosRecibo): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [ANCHO_PAPEL, 170] });
    const topDoc = 9; // baseline del nombre de la empresa
    let y = topDoc;

    doc.setFont('helvetica', 'normal');

    // ---------- ENCABEZADO EMPRESA ----------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...OSCURO);
    doc.text(EMPRESA.nombre, ANCHO_PAPEL / 2, y, { align: 'center' });
    y += 4.3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(...GRIS);
    y = this.textoCentradoMultilinea(doc, `Dir: ${EMPRESA.direccion}`, y);
    y = this.textoCentradoMultilinea(doc, `Ciudad: ${EMPRESA.ciudad}`, y);
    y = this.textoCentradoMultilinea(doc, `Tel: ${EMPRESA.telefono}  NIT: ${EMPRESA.nit}`, y);

    y += 2.5;

    // ---------- BARRA TÍTULO ----------
    doc.setFillColor(...OSCURO);
    doc.rect(MARGEN, y, ANCHO_UTIL, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('RECIBO DE PAGO', ANCHO_PAPEL / 2, y + 4, { align: 'center' });
    y += 6;

    // ---------- SECCIÓN: DATOS DEL CLIENTE ----------
    y = this.barraSeccion(doc, y, 'DATOS DEL CLIENTE');
    y = this.filaDinamica(doc, y, 'Cliente', datos.nombreCliente);
    y = this.filaDinamica(doc, y, 'Usuario', datos.usuarioCliente || '-----');
    y = this.filaDinamica(doc, y, 'Teléfono', datos.telefonoCliente || '-----');
    y = this.filaDinamica(doc, y, 'Fecha pago', this.formatearFecha(datos.fechaPago));
    y = this.filaDinamica(doc, y, 'N° recibo', datos.nroRecibo);

    y += 3;

    // ---------- SECCIÓN: DETALLE DEL PAGO ----------
    y = this.barraSeccion(doc, y, 'DETALLE DEL PAGO');
    y = this.filaDinamica(doc, y, 'Método pago', datos.metodoPago);
    y = this.filaDinamica(doc, y, 'Meses pagados', String(datos.mesesPagados));
    y = this.filaDinamica(doc, y, 'Próx. vencim.', this.formatearFechaOpcional(datos.proximoVencimiento));

    y += 3;

    // ---------- IMPORTE (destacado) ----------
    doc.setFillColor(...CLARO);
    doc.setDrawColor(...BORDE);
    doc.setLineWidth(0.18);
    doc.rect(MARGEN, y, ANCHO_UTIL, 8, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...OSCURO);
    doc.text('IMPORTE PAGADO', MARGEN + 1.5, y + 5);
    doc.setFontSize(8.5);
    doc.text(`Bs. ${datos.monto}`, ANCHO_PAPEL - MARGEN - 1.5, y + 5, { align: 'right' });
    y += 8;

    y += 7;

    // ---------- PIE ----------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...OSCURO);
    doc.text('GRACIAS POR SU PAGO', ANCHO_PAPEL / 2, y, { align: 'center' });
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(...GRIS);
    y = this.textoCentradoMultilinea(doc, 'Comprobante interno, no tiene validez', y);
    y = this.textoCentradoMultilinea(doc, 'como factura fiscal.', y);

    y += 4;

    // ---------- MARCO GENERAL ----------
    doc.setDrawColor(...OSCURO);
    doc.setLineWidth(0.25);
    doc.rect(MARGEN, topDoc - 6, ANCHO_UTIL, (y - (topDoc - 6)));

    // ---------- Nombre + descarga ----------
    const nombreArchivo = this.generarNombreArchivo(datos.nombreCliente);
    doc.setProperties({ title: nombreArchivo.replace('.pdf', '') });
    doc.save(nombreArchivo);

    const blobUrl = doc.output('bloburl');
    window.open(blobUrl as any, '_blank');
  }

  // ---------- Helpers de dibujo ----------

  private barraSeccion(doc: jsPDF, y: number, titulo: string): number {
    // Solo relleno, sin borde, para que no genere una línea doble
    // contra la barra de arriba (título) ni contra las filas de abajo.
    doc.setFillColor(...CLARO);
    doc.rect(MARGEN, y, ANCHO_UTIL, 4.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...OSCURO);
    doc.text(titulo, MARGEN + 1.5, y + 3.1);
    return y + 4.5;
  }

  private filaDinamica(doc: jsPDF, y: number, label: string, valor: string): number {
    const anchoLabel = 17;
    const anchoValor = ANCHO_UTIL - anchoLabel;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.3);
    const lineas = doc.splitTextToSize(valor, anchoValor - 2);
    const alto = Math.max(5.2, lineas.length * 2.9 + 2.3);

    doc.setDrawColor(...BORDE);
    doc.setLineWidth(0.12);
    doc.setFillColor(...CLARO);
    doc.rect(MARGEN, y, anchoLabel, alto, 'FD');
    doc.rect(MARGEN + anchoLabel, y, anchoValor, alto, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...TEXTO);
    doc.text(label, MARGEN + 1.2, y + 3.6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.3);
    doc.text(lineas, MARGEN + anchoLabel + 1.2, y + 3.6);

    return y + alto;
  }

  private textoCentradoMultilinea(doc: jsPDF, texto: string, y: number): number {
    const lineas = doc.splitTextToSize(texto, ANCHO_UTIL);
    doc.text(lineas, ANCHO_PAPEL / 2, y, { align: 'center' });
    return y + lineas.length * 2.8;
  }

  private generarNombreArchivo(nombreCliente: string): string {
    const hoy = new Date();
    const d = String(hoy.getDate()).padStart(2, '0');
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const y = hoy.getFullYear();

    const nombreLimpio = nombreCliente
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');

    return `Recibo_${nombreLimpio}_${d}-${m}-${y}.pdf`;
  }

  private formatearFecha(fecha: string | Date): string {
    const f = fecha instanceof Date ? fecha : new Date(fecha);
    const d = String(f.getDate()).padStart(2, '0');
    const m = String(f.getMonth() + 1).padStart(2, '0');
    const y = f.getFullYear();
    return `${d}/${m}/${y}`;
  }

  private formatearFechaOpcional(fecha?: string | Date | null): string {
    if (!fecha) return '-----';
    return this.formatearFecha(fecha);
  }
}