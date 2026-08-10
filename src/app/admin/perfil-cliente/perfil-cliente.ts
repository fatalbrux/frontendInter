import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientesService } from '../../core/services/clientes';
import { EquiposService } from '../../core/services/equipos';
import { PagosService } from '../../core/services/pagos';
import { Cliente } from '../../core/interfaces/cliente';
import { Equipo } from '../../core/interfaces/equipo';
import { Pago } from '../../core/interfaces/pago';

type Tab = 'general' | 'equipo' | 'pagos';

@Component({
  selector: 'app-perfil-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil-cliente.html',
})
export class PerfilCliente implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientesService = inject(ClientesService);
  private readonly equiposService = inject(EquiposService);
  private readonly pagosService = inject(PagosService);

  cliente = signal<Cliente | null>(null);
equipos = signal<Equipo[]>([]);
  pagos = signal<Pago[]>([]);
  cargando = signal<boolean>(true);
  tabActiva = signal<Tab>('general');

  totalPagado = computed(() =>
    this.pagos().reduce((acc, p) => acc + Number(p.monto), 0),
  );

  ultimoPago = computed(() => {
  const lista = this.pagos();
  if (!lista.length) return null;
  return [...lista].sort(
    (a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()
  )[0];
});

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/admin/clientes']);
      return;
    }
    this.cargarDatos(id);
  }

  cargarDatos(id: number): void {
    this.cargando.set(true);

    this.clientesService.funObtenerUno(id).subscribe({
      next: (res) => {
        this.cliente.set(res);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.cargando.set(false);
      },
    });

    // TODO: cuando agregues GET /equipo?clienteId=X en el backend,
    // reemplaza este filtro en el front por la petición directa (más eficiente).
this.equiposService.funListar().subscribe({
  next: (res) => {
    const equiposDelCliente = res.filter((e) => e.cliente?.id === id);
    this.equipos.set(equiposDelCliente);
  },
  error: (err) => console.error(err),
});

this.equiposService.funListar().subscribe({
  next: (res) => {
    const equiposDelCliente = res.filter(
      (e) => e.cliente?.id === id && e.estado === 'Instalado'
    );
    this.equipos.set(equiposDelCliente);
  },
  error: (err) => console.error(err),
});

  }

  volver(): void {
    this.router.navigate(['/admin/clientes']);
  }

  cambiarTab(tab: Tab): void {
    this.tabActiva.set(tab);
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'Activo': return 'bg-emerald-50 text-emerald-600';
      case 'Suspendido': return 'bg-amber-50 text-amber-600';
      case 'Corte de servicio': return 'bg-rose-50 text-rose-600';
      default: return 'bg-gray-100 text-gray-500';
    }
  }

  claseEstadoEquipo(estado: string): string {
    switch (estado) {
      case 'Instalado': return 'bg-indigo-50 text-indigo-600';
      case 'Disponible': return 'bg-emerald-50 text-emerald-600';
      case 'En mantenimiento': return 'bg-amber-50 text-amber-600';
      case 'Dañado': return 'bg-rose-50 text-rose-600';
      default: return 'bg-gray-100 text-gray-500';
    }
  }

  iniciales(cli: Cliente): string {
    return `${cli.nombres?.[0] ?? ''}${cli.apellidos?.[0] ?? ''}`.toUpperCase();
  }
}
