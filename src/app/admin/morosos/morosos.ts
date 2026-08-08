import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../core/services/dashboard';
import { ClienteMoroso } from '../../core/interfaces/dashboard';

@Component({
  selector: 'app-morosos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './morosos.html',
})
export class Morosos implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  listaMorosos = signal<ClienteMoroso[]>([]);
  cargando = signal<boolean>(true);

  unMes = computed(() => this.listaMorosos().filter((c) => c.mesesDeuda === 1));
  dosMeses = computed(() => this.listaMorosos().filter((c) => c.mesesDeuda === 2));
  tresOMas = computed(() => this.listaMorosos().filter((c) => c.mesesDeuda >= 3));

  deudaUnMes = computed(() => this.unMes().reduce((a, c) => a + c.deudaTotal, 0));
  deudaDosMeses = computed(() => this.dosMeses().reduce((a, c) => a + c.deudaTotal, 0));
  deudaTresOMas = computed(() => this.tresOMas().reduce((a, c) => a + c.deudaTotal, 0));

  ngOnInit(): void {
    this.dashboardService.funMorosos().subscribe({
      next: (res) => { this.listaMorosos.set(res); this.cargando.set(false); },
      error: (err) => { console.error(err); this.cargando.set(false); },
    });
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'Activo': return 'bg-emerald-50 text-emerald-600';
      case 'Suspendido': return 'bg-amber-50 text-amber-600';
      case 'Corte de servicio': return 'bg-rose-50 text-rose-600';
      default: return 'bg-gray-100 text-gray-500';
    }
  }

  clasePuntoEstado(estado: string): string {
  switch (estado) {
    case 'Activo': return 'bg-emerald-500';
    case 'Suspendido': return 'bg-amber-500';
    case 'Corte de servicio': return 'bg-rose-500';
    default: return 'bg-gray-400';
  }
}
}