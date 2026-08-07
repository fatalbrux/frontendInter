import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DashboardService } from '../../core/services/dashboard';
import { DashboardResumen } from '../../core/interfaces/dashboard';
import { Cliente } from '../../core/interfaces/cliente';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  resumen = signal<DashboardResumen | null>(null);
  proximosVencimientos = signal<Cliente[]>([]);
  deudoresConCorte = signal<Cliente[]>([]);
  cargando = signal<boolean>(true);

  // ---- datos formateados para ngx-charts ----
  datosIngresosMensuales = computed(() => {
    const res = this.resumen();
    if (!res) return [];
    return [{
      name: 'Ingresos',
      series: res.ingresosMensuales.map(i => ({ name: i.mes, value: Number(i.total) })),
    }];
  });

  datosClientesPorZona = computed(() => {
    const res = this.resumen();
    if (!res) return [];
    return res.clientesPorZona.map(z => ({ name: z.zona ?? 'Sin zona', value: Number(z.total) }));
  });

  datosEstadoClientes = computed(() => {
    const res = this.resumen();
    if (!res) return [];
    return [
      { name: 'Activos', value: res.clientesActivos },
      { name: 'Suspendidos', value: res.clientesSuspendidos },
    ];
  });

  datosMetodosPago = computed(() => {
    const res = this.resumen();
    if (!res) return [];
    return res.metodosPago.map(m => ({ name: m.metodo, value: Number(m.total) }));
  });

  datosEstadoEquipos = computed(() => {
    const res = this.resumen();
    if (!res) return [];
    return [
      { name: 'Instalado', value: res.equiposInstalados },
      { name: 'Disponible', value: res.equiposDisponibles },
      { name: 'Mantenimiento', value: res.equiposMantenimiento },
      { name: 'Dañado', value: res.equiposDanados },
    ];
  });

  colorScheme: any = {
  name: 'rojoISP',
  selectable: true,
  group: 'Ordinal' as any,
  domain: ['#dc2626', '#f87171', '#fca5a5', '#fecaca', '#16a34a'],
};
  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);

    this.dashboardService.funResumen().subscribe({
      next: (res) => { this.resumen.set(res); this.cargando.set(false); },
      error: (err) => { console.error(err); this.cargando.set(false); },
    });

    this.dashboardService.funProximosVencimientos().subscribe({
      next: (res) => this.proximosVencimientos.set(res),
      error: (err) => console.error(err),
    });

    this.dashboardService.funDeudoresConCorte().subscribe({
      next: (res) => this.deudoresConCorte.set(res),
      error: (err) => console.error(err),
    });
  }
}