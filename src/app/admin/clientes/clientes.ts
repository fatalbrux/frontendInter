import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientesService } from '../../core/services/clientes';
import { ZonasService } from '../../core/services/zonas';
import { PlanesService } from '../../core/services/planes';
import { PagosService } from '../../core/services/pagos';
import { Cliente, ClientePayload, EstadoCliente } from '../../core/interfaces/cliente';
import { Zona } from '../../core/interfaces/zona';
import { Plan } from '../../core/interfaces/plan';
import { PagoPayload, MetodoPago } from '../../core/interfaces/pago';

const FORMULARIO_VACIO: ClientePayload = {
  codigo: '',
  nombres: '',
  apellidos: '',
  ci: '',
  telefono: '',
  email: '',
  direccion: '',
  referencia: '',
  fechaInstalacion: undefined,
  fechaPrimerPago: undefined,
  estado: 'Activo',
  observaciones: '',
  zonaId: undefined,
  planId: undefined,
};

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html',
})
export class Clientes implements OnInit {
  private readonly router = inject(Router);
  private readonly clientesService = inject(ClientesService);
  private readonly zonasService = inject(ZonasService);
  private readonly planesService = inject(PlanesService);
  private readonly pagosService = inject(PagosService);

  // ---------- datos ----------
  listaClientes = signal<Cliente[]>([]);
  listaZonas = signal<Zona[]>([]);
  listaPlanes = signal<Plan[]>([]);

  // ---------- estado de UI ----------
  cargando = signal<boolean>(false);
  guardando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  mostrarModal = signal<boolean>(false);
  mostrarConfirmarEliminar = signal<boolean>(false);
  modoEdicion = signal<boolean>(false);
  idSeleccionado = signal<number | null>(null);
  idClienteAEliminar: number | null = null;

  // ---------- modal rápido de pago ----------
  mostrarModalPago = signal<boolean>(false);
  clienteParaPago = signal<Cliente | null>(null);
  guardandoPago = signal<boolean>(false);
  formularioPago: PagoPayload = this.formularioPagoVacio();

  formulario: ClientePayload = { ...FORMULARIO_VACIO };

  ngOnInit(): void {
    this.listar();
    this.cargarCatalogos();
  }

  // ---------- carga de datos ----------
  listar(): void {
    this.cargando.set(true);
    this.clientesService.funListar().subscribe({
      next: (res) => {
        this.listaClientes.set(res);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMensaje.set('No se pudo cargar la lista de clientes.');
        this.cargando.set(false);
      },
    });
  }

  cargarCatalogos(): void {
    this.zonasService.funListar().subscribe({
      next: (res) => this.listaZonas.set(res),
      error: (err) => console.error(err),
    });
    this.planesService.funListar().subscribe({
      next: (res) => this.listaPlanes.set(res),
      error: (err) => console.error(err),
    });
  }

  // ---------- modal crear / editar ----------
  abrirModalCrear(): void {
    this.modoEdicion.set(false);
    this.idSeleccionado.set(null);
    this.errorMensaje.set(null);
    this.formulario = {
      ...FORMULARIO_VACIO,
      codigo: `CLI-${Math.floor(100 + Math.random() * 900)}`, // sugerencia; el backend valida que sea único
    };
    this.mostrarModal.set(true);
  }

  seleccionarParaEditar(cli: Cliente): void {
    this.modoEdicion.set(true);
    this.idSeleccionado.set(cli.id);
    this.errorMensaje.set(null);
    this.formulario = {
      codigo: cli.codigo,
      nombres: cli.nombres,
      apellidos: cli.apellidos,
      ci: cli.ci ?? '',
      telefono: cli.telefono ?? '',
      email: cli.email ?? '',
      direccion: cli.direccion ?? '',
      referencia: cli.referencia ?? '',
      fechaInstalacion: cli.fechaInstalacion ?? undefined,
      fechaPrimerPago: cli.fechaPrimerPago ?? undefined,
      estado: cli.estado as EstadoCliente,
      observaciones: cli.observaciones ?? '',
      zonaId: cli.zona?.id,
      planId: cli.plan?.id,
    };
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  guardar(): void {
    this.guardando.set(true);
    this.errorMensaje.set(null);

    const idActual = this.idSeleccionado();

    const peticion =
      this.modoEdicion() && idActual !== null
        ? this.clientesService.funEditar(this.formulario, idActual)
        : this.clientesService.funGuardar(this.formulario);

    peticion.subscribe({
      next: () => this.reiniciarYRefrescar(),
      error: (err) => {
        console.error(err);
        this.errorMensaje.set(
          err?.error?.message ?? 'Ocurrió un error al guardar el cliente.',
        );
        this.guardando.set(false);
      },
    });
  }

  // ---------- eliminar ----------
  eliminar(id: number): void {
    this.idClienteAEliminar = id;
    this.mostrarConfirmarEliminar.set(true);
  }

  confirmarEliminarReal(): void {
    if (this.idClienteAEliminar === null) return;

    this.clientesService.funEliminar(this.idClienteAEliminar).subscribe({
      next: () => {
        this.mostrarConfirmarEliminar.set(false);
        this.idClienteAEliminar = null;
        this.listar();
      },
      error: (err) => {
        console.error(err);
        this.errorMensaje.set('No se pudo eliminar el cliente.');
        this.mostrarConfirmarEliminar.set(false);
      },
    });
  }

  cancelarEliminar(): void {
    this.mostrarConfirmarEliminar.set(false);
    this.idClienteAEliminar = null;
  }

  reiniciarYRefrescar(): void {
    this.mostrarModal.set(false);
    this.modoEdicion.set(false);
    this.idSeleccionado.set(null);
    this.guardando.set(false);
    this.listar();
  }

  // ---------- ver perfil ----------
  verPerfil(cli: Cliente): void {
    this.router.navigate(['/admin/clientes', cli.id]);
  }

  // ---------- pausa / play: alternar Activo <-> Suspendido ----------
  // Si el cliente está en "Corte de servicio", el botón de play lo reactiva a Activo.
  alternarEstado(cli: Cliente): void {
    const nuevoEstado: EstadoCliente = cli.estado === 'Activo' ? 'Suspendido' : 'Activo';

    this.clientesService.funEditar({ estado: nuevoEstado }, cli.id).subscribe({
      next: () => this.listar(),
      error: (err) => {
        console.error(err);
        this.errorMensaje.set('No se pudo cambiar el estado del cliente.');
      },
    });
  }

  // ---------- modal rápido: registrar pago ----------
  abrirModalPago(cli: Cliente): void {
    this.clienteParaPago.set(cli);
    this.formularioPago = {
      ...this.formularioPagoVacio(),
      clienteId: cli.id,
      monto: cli.plan?.precioMensual ?? 0,
      fechaPago: new Date().toISOString().slice(0, 10),
    };
    this.mostrarModalPago.set(true);
  }

  cerrarModalPago(): void {
    this.mostrarModalPago.set(false);
    this.clienteParaPago.set(null);
  }

  // Recalcula el monto automáticamente según los meses seleccionados y el precio del plan
  actualizarMontoPorMeses(): void {
    const cli = this.clienteParaPago();
    const precio = cli?.plan?.precioMensual ?? 0;
    this.formularioPago.monto = precio * (this.formularioPago.mesesPagados ?? 1);
  }

 guardarPago(): void {
  this.guardandoPago.set(true);
  this.errorMensaje.set(null);

  const cli = this.clienteParaPago();
  if (!cli) {
    this.guardandoPago.set(false);
    return;
  }

  const vencimientoAnterior = cli.proximoVencimiento ?? new Date();
  const nuevoVencimiento = this.calcularNuevoVencimiento(
    new Date(vencimientoAnterior),
    this.formularioPago.mesesPagados ?? 1
  );

  const dato: PagoPayload = {
    ...this.formularioPago,
    vencimientoAnterior: new Date(vencimientoAnterior),
    nuevoVencimiento,
  };

  this.pagosService.funGuardar(dato).subscribe({
    next: () => {
      this.guardandoPago.set(false);
      this.cerrarModalPago();
      this.listar();
    },
    error: (err) => {
      console.error(err);
      this.errorMensaje.set(err?.error?.message ?? 'Ocurrió un error al registrar el pago.');
      this.guardandoPago.set(false);
    },
  });
}

private calcularNuevoVencimiento(fechaBase: Date, meses: number): Date {
  const nueva = new Date(fechaBase);
  nueva.setMonth(nueva.getMonth() + meses);
  return nueva;
}
//Funciones para calcular vencimiento del modal preview
private parseFechaLocal(fecha: string | Date): Date {
  if (fecha instanceof Date) return fecha;
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Cuántos días de anticipación se permite pagar antes del vencimiento
private readonly DIAS_ANTICIPACION_PAGO = 5;

vencimientoPreview(): string {
  const cli = this.clienteParaPago();
  if (!cli) return '—';

  const base = cli.proximoVencimiento
    ? this.parseFechaLocal(cli.proximoVencimiento)
    : new Date();

  const meses = this.formularioPago.mesesPagados ?? 1;
  const nueva = this.calcularNuevoVencimiento(base, meses); // reutiliza la que ya tienes

  return nueva.toLocaleDateString('es-BO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// true = puede pagar, false = todavía está al día
puedeRegistrarPago(cli: Cliente): boolean {
  if (!cli.proximoVencimiento) return true; // sin vencimiento registrado, se permite

  const vencimiento = this.parseFechaLocal(cli.proximoVencimiento);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const limiteAnticipado = new Date(vencimiento);
  limiteAnticipado.setDate(limiteAnticipado.getDate() - this.DIAS_ANTICIPACION_PAGO);

  return hoy >= limiteAnticipado;
}

diasParaVencimiento(cli: Cliente): number {
  if (!cli.proximoVencimiento) return 0;
  const vencimiento = this.parseFechaLocal(cli.proximoVencimiento);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diffMs = vencimiento.getTime() - hoy.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}




  private formularioPagoVacio(): PagoPayload {
    return {
      clienteId: 0,
      fechaPago: new Date().toISOString().slice(0, 10),
      mesesPagados: 1,
      monto: 0,
      metodoPago: 'Efectivo' as MetodoPago,
      notas: '',
    };
  }

  // ---------- helpers de presentación ----------
  claseEstado(estado: EstadoCliente): string {
    switch (estado) {
      case 'Activo':
        return 'bg-emerald-50 text-emerald-600';
      case 'Suspendido':
        return 'bg-amber-50 text-amber-600';
      case 'Corte de servicio':
        return 'bg-rose-50 text-rose-600';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  }
}
