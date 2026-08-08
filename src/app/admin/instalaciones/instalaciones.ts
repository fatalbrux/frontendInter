import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstalacionesService } from '../../core/services/instalaciones';
import { ClientesService } from '../../core/services/clientes';
import { EquiposService } from '../../core/services/equipos';
import { ZonasService } from '../../core/services/zonas';
import { Instalacion } from '../../core/interfaces/instalacion';
import { Cliente } from '../../core/interfaces/cliente';
import { Equipo } from '../../core/interfaces/equipo';
import { Zona } from '../../core/interfaces/zona';
import { ClienteResumen, EquipoResumen } from '../../core/interfaces/instalacion';
import { NotificacionesService } from '../../core/services/notificaciones';

@Component({
  selector: 'app-instalaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instalaciones.html'
})
export class Instalaciones implements OnInit {
  private readonly instalacionesService = inject(InstalacionesService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly clientesService = inject(ClientesService);
  private readonly equiposService = inject(EquiposService);
  private readonly zonasService = inject(ZonasService);

  // ================= DATOS BASE =================
  listaInstalaciones = signal<Instalacion[]>([]);
  listaClientes = signal<Cliente[]>([]);
  listaEquipos = signal<Equipo[]>([]);
  listaZonas = signal<Zona[]>([]);

  // solo equipos disponibles para instalar
  equiposDisponibles = computed(() =>
    this.listaEquipos().filter(e => e.estado === 'Disponible')
  );

  // ================= MODAL REGISTRAR INSTALACIÓN =================
  mostrarModal = signal<boolean>(false);

  // ---- búsqueda de cliente por CI ----
  busquedaCi = signal<string>('');
  //clienteSeleccionado = signal<Cliente | null>(null);

  clienteSeleccionado = signal<Cliente | ClienteResumen | null>(null);

  clientesEncontrados = computed(() => {
  const texto = this.busquedaCi().trim().toLowerCase();
  if (!texto) return [];
  return this.listaClientes()
    .filter(c =>
      c.ci?.toLowerCase().includes(texto) ||
      c.codigo?.toLowerCase().includes(texto) ||
      c.usuario?.toLowerCase().includes(texto) ||
      `${c.nombres} ${c.apellidos}`.toLowerCase().includes(texto)
    )
    .slice(0, 8);
});

  // ---- búsqueda de equipo por código ----
  busquedaCodigoEquipo = signal<string>('');
  //equipoSeleccionado = signal<Equipo | null>(null);

  equipoSeleccionado = signal<Equipo | EquipoResumen | null>(null);

  equiposEncontrados = computed(() => {
  const texto = this.busquedaCodigoEquipo().trim().toLowerCase();
  if (!texto) return [];
  return this.equiposDisponibles()
    .filter(e =>
      e.codigo?.toLowerCase().includes(texto) ||
      e.modelo?.toLowerCase().includes(texto) ||
      e.nroSerie?.toLowerCase().includes(texto) ||
      e.mac?.toLowerCase().includes(texto)
    )
    .slice(0, 8);
});

  fechaInstalacion: string = this.formatearInputDate(new Date());
  zonaIdSeleccionada = signal<number | undefined>(undefined);
  direccion = signal<string>('');
  observaciones = signal<string>('');

  // ---- edición / eliminación ----
  modoEdicion = signal<boolean>(false);
  idSeleccionado = signal<number | null>(null);
  mostrarConfirmarEliminar = signal<boolean>(false);
  idInstalacionAEliminar: number | null = null;

  ngOnInit(): void {
    this.listarInstalaciones();
    this.listarClientes();
    this.listarEquipos();
    this.listarZonas();
  }

  // ================= CARGA DE DATOS =================
  listarInstalaciones(): void {
    this.instalacionesService.funListar().subscribe({
      next: (res) => this.listaInstalaciones.set(res),
      error: (err) => console.error(err)
    });
  }

  listarClientes(): void {
    this.clientesService.funListar().subscribe({
      next: (res) => this.listaClientes.set(res),
      error: (err) => console.error(err)
    });
  }

  listarEquipos(): void {
    this.equiposService.funListar().subscribe({
      next: (res) => this.listaEquipos.set(res),
      error: (err) => console.error(err)
    });
  }

  listarZonas(): void {
    this.zonasService.funListar().subscribe({
      next: (res) => this.listaZonas.set(res),
      error: (err) => console.error(err)
    });
  }

  // ================= HELPERS TABLA =================
  nombreCliente(clienteId: number): string {
    const cliente = this.listaClientes().find(c => c.id === clienteId);
    return cliente ? `${cliente.nombres} ${cliente.apellidos}` : '—';
  }

  codigoEquipo(equipoId: number): string {
    return this.listaEquipos().find(e => e.id === equipoId)?.codigo ?? '—';
  }

  nombreZona(zonaId: number): string {
    return this.listaZonas().find(z => z.id === zonaId)?.nombre ?? '—';
  }

  // ================= MODAL =================
  abrirModalCrear(): void {
    this.modoEdicion.set(false);
    this.idSeleccionado.set(null);
    this.busquedaCi.set('');
    this.clienteSeleccionado.set(null);
    this.busquedaCodigoEquipo.set('');
    this.equipoSeleccionado.set(null);
    this.fechaInstalacion = this.formatearInputDate(new Date());
    this.zonaIdSeleccionada.set(undefined);
    this.direccion.set('');
    this.observaciones.set('');
    this.mostrarModal.set(true);
  }

seleccionarParaEditar(instalacion: Instalacion): void {
  this.modoEdicion.set(true);
  this.idSeleccionado.set(instalacion.id);

  this.busquedaCi.set('');
  this.clienteSeleccionado.set(instalacion.cliente ?? null);
  this.busquedaCodigoEquipo.set('');
  this.equipoSeleccionado.set(instalacion.equipo ?? null); // ya no necesitas "as any"
  this.fechaInstalacion = this.formatearInputDate(new Date(instalacion.fechaInstalacion));
  this.zonaIdSeleccionada.set(instalacion.zona?.id);
  this.direccion.set(instalacion.direccion ?? '');
  this.observaciones.set(instalacion.observaciones ?? '');

  this.mostrarModal.set(true);
}

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado.set(cliente);
    this.busquedaCi.set('');
    // autocompleta dirección de referencia si el campo está vacío
    if (!this.direccion() && cliente.direccion) {
      this.direccion.set(cliente.direccion);
    }
  }

  quitarClienteSeleccionado(): void {
    this.clienteSeleccionado.set(null);
    this.busquedaCi.set('');
  }

  seleccionarEquipo(equipo: Equipo): void {
    this.equipoSeleccionado.set(equipo);
    this.busquedaCodigoEquipo.set('');
  }

  quitarEquipoSeleccionado(): void {
    this.equipoSeleccionado.set(null);
    this.busquedaCodigoEquipo.set('');
  }

  guardar(): void {
    const cliente = this.clienteSeleccionado();
    const equipo = this.equipoSeleccionado();
    if (!cliente || !equipo || !this.zonaIdSeleccionada()) return;

    const dato: Partial<Instalacion> = {
      fechaInstalacion: new Date(this.fechaInstalacion),
      direccion: this.direccion(),
      observaciones: this.observaciones(),
      clienteId: cliente.id,
      equipoId: equipo.id,
      zonaId: this.zonaIdSeleccionada()
    };

    if (this.modoEdicion() && this.idSeleccionado() !== null) {
      this.instalacionesService.funEditar(dato, this.idSeleccionado()!).subscribe({
        next: () => { 
          this.notificaciones.exito('Instalacion actualizado exitosamente');
          this.reiniciarYRefrescar()},
        error: (err) => console.error(err)
      });
    } else {
      this.instalacionesService.funGuardar(dato).subscribe({
        next: () => {
          
          this.notificaciones.exito('Instalacion registrado exitosamente');
          this.reiniciarYRefrescar()},
        error: (err) => console.error(err)
      });
    }
  }

  eliminar(id: number): void {
    this.idInstalacionAEliminar = id;
    this.mostrarConfirmarEliminar.set(true);
  }

  confirmarEliminarReal(): void {
    if (this.idInstalacionAEliminar !== null) {
      this.instalacionesService.funEliminar(this.idInstalacionAEliminar).subscribe({
        next: () => {
          this.mostrarConfirmarEliminar.set(false);
          this.idInstalacionAEliminar = null;
          this.notificaciones.exito('Instalacion eliminado exitosamente');
          this.listarInstalaciones();
        },
        error: (err) => console.error(err)
      });
    }
  }

  cancelarEliminar(): void {
    this.mostrarConfirmarEliminar.set(false);
    this.idInstalacionAEliminar = null;
  }

  reiniciarYRefrescar(): void {
    this.mostrarModal.set(false);
    this.modoEdicion.set(false);
    this.idSeleccionado.set(null);
    this.listarInstalaciones();
    this.listarEquipos(); // refresca estado del equipo (pasa a "Instalado")
  }

  private formatearInputDate(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  busquedaInstalacion = signal<string>('');

instalacionesFiltradas = computed(() => {
  const texto = this.busquedaInstalacion().trim().toLowerCase();
  if (!texto) return this.listaInstalaciones();
  return this.listaInstalaciones().filter((i) =>
    `${i.cliente?.nombres} ${i.cliente?.apellidos}`.toLowerCase().includes(texto) ||
    i.equipo?.codigo?.toLowerCase().includes(texto) ||
    i.direccion?.toLowerCase().includes(texto)
  );
});
}