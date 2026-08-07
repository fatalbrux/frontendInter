import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DashboardService } from '../../core/services/dashboard';
import { DashboardResumen } from '../../core/interfaces/dashboard';

interface ReporteCard {
  titulo: string;
  icono: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './reportes.html',
})
export class Reportes implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  resumen = signal<DashboardResumen | null>(null);
  cargando = signal<boolean>(true);

  datosIngresosMensuales = computed(() => {
    const res = this.resumen();
    if (!res) return [];
    return res.ingresosMensuales.map(i => ({ name: i.mes, value: Number(i.total) }));
  });

  datosClientesPorZona = computed(() => {
    const res = this.resumen();
    if (!res) return [];
    return res.clientesPorZona.map(z => ({ name: z.zona ?? 'Sin zona', value: Number(z.total) }));
  });

  colorScheme: any = {
    name: 'rojoISP',
    selectable: true,
    group: 'Ordinal' as any,
    domain: ['#dc2626', '#f87171', '#fca5a5', '#fecaca'],
  };

  reportes: ReporteCard[] = [
    { titulo: 'Clientes Activos', icono: '✅' },
    { titulo: 'Clientes Suspendidos', icono: '⏸️' },
    { titulo: 'Clientes con Corte', icono: '🚫' },
    { titulo: 'Clientes Morosos', icono: '⚠️' },
    { titulo: 'Clientes por Zona', icono: '📍' },
    { titulo: 'Equipos Instalados', icono: '📡' },
    { titulo: 'Equipos Disponibles', icono: '📦' },
    { titulo: 'Equipos Dañados', icono: '🔴' },
    { titulo: 'Ingresos Diarios', icono: '💵' },
    { titulo: 'Ingresos Mensuales', icono: '📈' },
    { titulo: 'Ingresos Anuales', icono: '🏦' },
    { titulo: 'Pagos por Método', icono: '💳' },
    { titulo: 'Clientes Mayor Deuda', icono: '🔥' },
    { titulo: 'Clientes Mayor Antigüedad', icono: '🏆' },
  ];

  ngOnInit(): void {
    this.dashboardService.funResumen().subscribe({
      next: (res) => { this.resumen.set(res); this.cargando.set(false); },
      error: (err) => { console.error(err); this.cargando.set(false); },
    });
  }

  generarPdf(reporte: ReporteCard): void {
    console.log('PDF (pendiente):', reporte.titulo);
  }

  generarExcel(reporte: ReporteCard): void {
    console.log('Excel (pendiente):', reporte.titulo);
  }

  imprimir(reporte: ReporteCard): void {
    console.log('Imprimir (pendiente):', reporte.titulo);
  }
}