import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquiposService } from '../../core/services/equipos';
import { MarcasService } from '../../core/services/marcas';
import { TiposEquipoService } from '../../core/services/tipos-equipo';
import { ClienteResumen, Equipo } from '../../core/interfaces/equipo';
import { Marca } from '../../core/interfaces/marca';
import { TipoEquipo } from '../../core/interfaces/tipo-equipo';
import { ClientesService } from '../../core/services/clientes';
import { Cliente } from '../../core/interfaces/cliente';

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipos.html'
})
export class Equipos implements OnInit {
  private readonly equiposService = inject(EquiposService);
  private readonly marcasService = inject(MarcasService);
  private readonly tiposEquipoService = inject(TiposEquipoService);

  private readonly clientesService = inject(ClientesService);
  listaClientes = signal<Cliente[]>([]);
  // ================= EQUIPOS =================
  listaEquipos = signal<Equipo[]>([]);
  mostrarModal = signal<boolean>(false);
  mostrarConfirmarEliminar = signal<boolean>(false);
  modoEdicion = signal<boolean>(false);
  idSeleccionado = signal<number | null>(null);
  idEquipoAEliminar: number | null = null;
  busquedaClienteEquipo = signal<string>('');
  clienteSeleccionadoEquipo = signal<ClienteResumen | null>(null);

  formulario: Partial<Equipo> = {
    codigo: '',
    modelo: '',
    nroSerie: '',
    mac: '',
    ip: '',
    pppoeUsuario: '',
    pppoePassword: '',
    estado: 'Disponible',
    tipoEquipoId: undefined,
    marcaId: undefined,
    clienteId: undefined
  };

  // ---------- MARCAS ----------
  listaMarcas = signal<Marca[]>([]);
  mostrarModalMarca = signal<boolean>(false);
  mostrarConfirmarEliminarMarca = signal<boolean>(false);
  modoEdicionMarca = signal<boolean>(false);
  idMarcaSeleccionada = signal<number | null>(null);
  idMarcaAEliminar: number | null = null;
  formularioMarca: Partial<Marca> = { nombre: '' };

  // ---------- TIPOS DE EQUIPO ----------
  listaTiposEquipo = signal<TipoEquipo[]>([]);
  mostrarModalTipoEquipo = signal<boolean>(false);
  mostrarConfirmarEliminarTipoEquipo = signal<boolean>(false);
  modoEdicionTipoEquipo = signal<boolean>(false);
  idTipoEquipoSeleccionado = signal<number | null>(null);
  idTipoEquipoAEliminar: number | null = null;
  formularioTipoEquipo: Partial<TipoEquipo> = { nombre: '', descripcion: '' };

  ngOnInit(): void {
    this.listarEquipos();
    this.listarMarcas();
    this.listarTiposEquipo();
    this.listarClientes(); // nuevo
    this.listarClientesEquipo();
  }

  listarClientes(): void {
  this.clientesService.funListar().subscribe({
    next: (res) => this.listaClientes.set(res),
    error: (err) => console.error(err)
  });
}

listarClientesEquipo(): void {
  this.clientesService.funListar().subscribe({
    next: (res) => this.listaClientes.set(res),
    error: (err) => console.error(err)
  });
}

clientesEncontradosEquipo = computed(() => {
  const texto = this.busquedaClienteEquipo().trim().toLowerCase();
  if (!texto) return [];
  return this.listaClientes()
    .filter(c =>
      c.ci?.toLowerCase().includes(texto) ||
      `${c.nombres} ${c.apellidos}`.toLowerCase().includes(texto)
    )
    .slice(0, 8);
});

seleccionarClienteEquipo(cliente: Cliente): void {
  this.clienteSeleccionadoEquipo.set(cliente);
  this.formulario.clienteId = cliente.id;
  this.busquedaClienteEquipo.set('');
}

quitarClienteEquipo(): void {
  this.clienteSeleccionadoEquipo.set(null);
  this.formulario.clienteId = undefined;
  this.busquedaClienteEquipo.set('');
}

  // ================= EQUIPOS =================
  listarEquipos(): void {
    this.equiposService.funListar().subscribe({
      next: (res) => this.listaEquipos.set(res),
      error: (err) => console.error(err)
    });
  }

  abrirModalCrear(): void {
    this.modoEdicion.set(false);
    this.idSeleccionado.set(null);
  this.clienteSeleccionadoEquipo.set(null);   // nuevo
  this.busquedaClienteEquipo.set('');          // nuevo
    this.formulario = {
      codigo: '',
      modelo: '',
      nroSerie: '',
      mac: '',
      ip: '',
      pppoeUsuario: '',
      pppoePassword: '',
      estado: 'Disponible',
      tipoEquipoId: undefined,
      marcaId: undefined,
      clienteId: undefined
    };
    this.mostrarModal.set(true);
  }

  seleccionarParaEditar(equipo: Equipo): void {
    this.modoEdicion.set(true);
    this.idSeleccionado.set(equipo.id ?? null);
  this.clienteSeleccionadoEquipo.set(equipo.cliente ?? null);  // nuevo
  this.busquedaClienteEquipo.set('');                           // nuevo
    this.formulario = {
      codigo: equipo.codigo,
      modelo: equipo.modelo,
      nroSerie: equipo.nroSerie,
      mac: equipo.mac,
      ip: equipo.ip,
      pppoeUsuario: equipo.pppoeUsuario,
      pppoePassword: equipo.pppoePassword,
      estado: equipo.estado,
      tipoEquipoId: equipo.tipoEquipoId,
      marcaId: equipo.marcaId,
      clienteId: equipo.clienteId ?? undefined, // nuevo
    };
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  guardar(): void {
    if (this.modoEdicion() && this.idSeleccionado() !== null) {
      this.equiposService.funEditar(this.formulario, this.idSeleccionado()!).subscribe({
        next: () => this.reiniciarYRefrescar(),
        error: (err) => console.error(err)
      });
    } else {
      this.equiposService.funGuardar(this.formulario).subscribe({
        next: () => this.reiniciarYRefrescar(),
        error: (err) => console.error(err)
      });
    }
  }

  eliminar(id: number): void {
    this.idEquipoAEliminar = id;
    this.mostrarConfirmarEliminar.set(true);
  }

  confirmarEliminarReal(): void {
    if (this.idEquipoAEliminar !== null) {
      this.equiposService.funEliminar(this.idEquipoAEliminar).subscribe({
        next: () => {
          this.mostrarConfirmarEliminar.set(false);
          this.idEquipoAEliminar = null;
          this.listarEquipos();
        },
        error: (err) => console.error(err)
      });
    }
  }

  cancelarEliminar(): void {
    this.mostrarConfirmarEliminar.set(false);
    this.idEquipoAEliminar = null;
  }

  reiniciarYRefrescar(): void {
    this.mostrarModal.set(false);
    this.modoEdicion.set(false);
    this.idSeleccionado.set(null);
    this.listarEquipos();
  }

  // helpers para el html
  nombreMarca(marcaId: number): string {
    return this.listaMarcas().find(m => m.id === marcaId)?.nombre ?? '—';
  }

  nombreTipoEquipo(tipoEquipoId: number): string {
    return this.listaTiposEquipo().find(t => t.id === tipoEquipoId)?.nombre ?? '—';
  }

  contarPorEstado(estado: string): number {
    return this.listaEquipos().filter(e => e.estado === estado).length;
  }

  // ================= MARCAS =================
  listarMarcas(): void {
    this.marcasService.funListar().subscribe({
      next: (res) => this.listaMarcas.set(res),
      error: (err) => console.error(err)
    });
  }

  abrirModalCrearMarca(): void {
    this.modoEdicionMarca.set(false);
    this.idMarcaSeleccionada.set(null);
    this.formularioMarca = { nombre: '' };
    this.mostrarModalMarca.set(true);
  }

  seleccionarMarcaParaEditar(marca: Marca): void {
    this.modoEdicionMarca.set(true);
    this.idMarcaSeleccionada.set(marca.id ?? null);
    this.formularioMarca = { nombre: marca.nombre };
    this.mostrarModalMarca.set(true);
  }

  cerrarModalMarca(): void {
    this.mostrarModalMarca.set(false);
  }

  guardarMarca(): void {
    if (this.modoEdicionMarca() && this.idMarcaSeleccionada() !== null) {
      this.marcasService.funEditar(this.formularioMarca, this.idMarcaSeleccionada()!).subscribe({
        next: () => this.reiniciarYRefrescarMarca(),
        error: (err) => console.error(err)
      });
    } else {
      this.marcasService.funGuardar(this.formularioMarca).subscribe({
        next: () => this.reiniciarYRefrescarMarca(),
        error: (err) => console.error(err)
      });
    }
  }

  eliminarMarca(id: number): void {
    this.idMarcaAEliminar = id;
    this.mostrarConfirmarEliminarMarca.set(true);
  }

  confirmarEliminarMarcaReal(): void {
    if (this.idMarcaAEliminar !== null) {
      this.marcasService.funEliminar(this.idMarcaAEliminar).subscribe({
        next: () => {
          this.mostrarConfirmarEliminarMarca.set(false);
          this.idMarcaAEliminar = null;
          this.listarMarcas();
        },
        error: (err) => console.error(err)
      });
    }
  }

  cancelarEliminarMarca(): void {
    this.mostrarConfirmarEliminarMarca.set(false);
    this.idMarcaAEliminar = null;
  }

  reiniciarYRefrescarMarca(): void {
    this.mostrarModalMarca.set(false);
    this.modoEdicionMarca.set(false);
    this.idMarcaSeleccionada.set(null);
    this.listarMarcas();
  }

  // ================= TIPOS DE EQUIPO =================
  listarTiposEquipo(): void {
    this.tiposEquipoService.funListar().subscribe({
      next: (res) => this.listaTiposEquipo.set(res),
      error: (err) => console.error(err)
    });
  }

  abrirModalCrearTipoEquipo(): void {
    this.modoEdicionTipoEquipo.set(false);
    this.idTipoEquipoSeleccionado.set(null);
    this.formularioTipoEquipo = { nombre: '', descripcion: '' };
    this.mostrarModalTipoEquipo.set(true);
  }

  seleccionarTipoEquipoParaEditar(tipo: TipoEquipo): void {
    this.modoEdicionTipoEquipo.set(true);
    this.idTipoEquipoSeleccionado.set(tipo.id ?? null);
    this.formularioTipoEquipo = { nombre: tipo.nombre, descripcion: tipo.descripcion };
    this.mostrarModalTipoEquipo.set(true);
  }

  cerrarModalTipoEquipo(): void {
    this.mostrarModalTipoEquipo.set(false);
  }

  guardarTipoEquipo(): void {
    if (this.modoEdicionTipoEquipo() && this.idTipoEquipoSeleccionado() !== null) {
      this.tiposEquipoService.funEditar(this.formularioTipoEquipo, this.idTipoEquipoSeleccionado()!).subscribe({
        next: () => this.reiniciarYRefrescarTipoEquipo(),
        error: (err) => console.error(err)
      });
    } else {
      this.tiposEquipoService.funGuardar(this.formularioTipoEquipo).subscribe({
        next: () => this.reiniciarYRefrescarTipoEquipo(),
        error: (err) => console.error(err)
      });
    }
  }

  eliminarTipoEquipo(id: number): void {
    this.idTipoEquipoAEliminar = id;
    this.mostrarConfirmarEliminarTipoEquipo.set(true);
  }

  confirmarEliminarTipoEquipoReal(): void {
    if (this.idTipoEquipoAEliminar !== null) {
      this.tiposEquipoService.funEliminar(this.idTipoEquipoAEliminar).subscribe({
        next: () => {
          this.mostrarConfirmarEliminarTipoEquipo.set(false);
          this.idTipoEquipoAEliminar = null;
          this.listarTiposEquipo();
        },
        error: (err) => console.error(err)
      });
    }
  }

  cancelarEliminarTipoEquipo(): void {
    this.mostrarConfirmarEliminarTipoEquipo.set(false);
    this.idTipoEquipoAEliminar = null;
  }

  reiniciarYRefrescarTipoEquipo(): void {
    this.mostrarModalTipoEquipo.set(false);
    this.modoEdicionTipoEquipo.set(false);
    this.idTipoEquipoSeleccionado.set(null);
    this.listarTiposEquipo();
  }
}