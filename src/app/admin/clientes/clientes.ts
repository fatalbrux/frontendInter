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
import { PagoPayload, MetodoPago, BancoPago } from '../../core/interfaces/pago';


interface MesPago {
  fecha: Date;
  label: string;
  estado: 'no-aplica' | 'pagado' | 'disponible' | 'bloqueado-futuro' | 'seleccionado';
}

const FORMULARIO_VACIO: ClientePayload = {
  codigo: '',
  nombres: '',
  apellidos: '',
  ci: '',
  usuario: '',
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

// LOGICA DE FECHAS DE VENCIMIENTO
  private fechaEfectivaVencimiento(cliente: Cliente): Date | null {
  if (cliente.proximoVencimiento) return this.parseFechaLocal(cliente.proximoVencimiento);

  const base = cliente.fechaPrimerPago ?? cliente.fechaInstalacion;
  if (!base) return null;

  const fecha = this.parseFechaLocal(base);
  fecha.setMonth(fecha.getMonth() + 2);
  return fecha;
}

private fechaBaseVencimiento(cliente: Cliente): Date {
  return this.fechaEfectivaVencimiento(cliente) ?? new Date();
}

fechaVencimientoDisplay(cliente: Cliente): string {
  const efectiva = this.fechaEfectivaVencimiento(cliente);
  if (!efectiva) return 'Sin registro previo';

  const d = String(efectiva.getDate()).padStart(2, '0');
  const m = String(efectiva.getMonth() + 1).padStart(2, '0');
  const y = efectiva.getFullYear();
  return `${d}/${m}/${y}`;
}










  // ---------- datos ----------
  listaClientes = signal<Cliente[]>([]);
  listaZonas = signal<Zona[]>([]);
  listaPlanes = signal<Plan[]>([]);
  bancosDisponibles: BancoPago[] = ['Banco Unión', 'Banco BNB', 'Banco Prodem', 'Tigo Money'];
bancoSeleccionado = signal<BancoPago | null>(null);

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
      usuario: cli.usuario ?? '',
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


  const datoLimpio = this.limpiarPayload(this.formulario); // nuevo

    const peticion =
      this.modoEdicion() && idActual !== null
      ? this.clientesService.funEditar(datoLimpio, idActual)
      : this.clientesService.funGuardar(datoLimpio);

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
  this.bancoSeleccionado.set(null);
  this.mesesAPagarCliente.set(0); // nuevo
  this.pagoAdelantadoCliente.set(false); // nuevo
  this.formularioPago = {
    ...this.formularioPagoVacio(),
    clienteId: cli.id,
    monto: 0,
    fechaPago: new Date().toISOString().slice(0, 10),
  };
  this.mostrarModalPago.set(true);
  this.anioGridCliente.set(new Date().getFullYear()); // agrega esta línea
}

  cerrarModalPago(): void {
    this.mostrarModalPago.set(false);
    this.clienteParaPago.set(null);
  }

  // Recalcula el monto automáticamente según los meses seleccionados y el precio del plan
  actualizarMontoPorMeses(): void {
    const cli = this.clienteParaPago();
  const precio = Number(cli?.plan?.precioMensual ?? 0); // cambia aquí
    
  this.formularioPago.monto = precio * this.mesesAPagarCliente(); // antes: this.formularioPago.mesesPagados
  this.formularioPago.mesesPagados = this.mesesAPagarCliente();
  
  
  }

guardarPago(): void {
  this.guardandoPago.set(true);
  this.errorMensaje.set(null);

  const cli = this.clienteParaPago();
  if (!cli) {
    this.guardandoPago.set(false);
    return;
  }

  const seleccionados = this.mesesGridCliente().filter((m) => m.estado === 'seleccionado');
  if (seleccionados.length === 0) {
    this.guardandoPago.set(false);
    return;
  }

  const vencimientoAnterior = this.fechaBaseVencimiento(cli);
  const ultimoMes = seleccionados[seleccionados.length - 1].fecha;
  const nuevoVencimiento = new Date(ultimoMes.getFullYear(), ultimoMes.getMonth() + 2, 1);

  const dato: PagoPayload = {
    ...this.formularioPago,
    vencimientoAnterior: vencimientoAnterior,
    nuevoVencimiento: nuevoVencimiento,
    ...(this.formularioPago.metodoPago === 'Código QR' && { banco: this.bancoSeleccionado() ?? undefined }),
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

private limpiarPayload(payload: ClientePayload): ClientePayload {
  const limpio = { ...payload };
  (Object.keys(limpio) as (keyof ClientePayload)[]).forEach((key) => {
    if (limpio[key] === '') {
      (limpio[key] as any) = undefined;
    }
  });
  return limpio;
}

// Cuántos días de anticipación se permite pagar antes del vencimiento
private readonly DIAS_ANTICIPACION_PAGO = 5;

vencimientoPreview(): string {
  const cliente = this.clienteParaPago();
  if (!cliente) return '—';

  const seleccionados = this.mesesGridCliente().filter((m) => m.estado === 'seleccionado');
  if (seleccionados.length === 0) return '—';

  const ultimoMes = seleccionados[seleccionados.length - 1].fecha;
  const cobertura = new Date(ultimoMes.getFullYear(), ultimoMes.getMonth() + 1, 1);

  const d = String(cobertura.getDate()).padStart(2, '0');
  const m = String(cobertura.getMonth() + 1).padStart(2, '0');
  const y = cobertura.getFullYear();
  return `${d}/${m}/${y}`;
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

  zonasParaFormulario = computed(() => {
  const activas = this.listaZonas().filter(z => z.estado === 'Activa');
  const actualId = this.formulario.zonaId;
  const yaIncluida = activas.some(z => z.id === actualId);

  if (actualId && !yaIncluida) {
    const inactiva = this.listaZonas().find(z => z.id === actualId);
    if (inactiva) return [...activas, inactiva];
  }
  return activas;
});

planesParaFormulario = computed(() => {
  const activos = this.listaPlanes().filter(p => p.estado === 'Activo');
  const actualId = this.formulario.planId;
  const yaIncluido = activos.some(p => p.id === actualId);

  if (actualId && !yaIncluido) {
    const inactivo = this.listaPlanes().find(p => p.id === actualId);
    if (inactivo) return [...activos, inactivo];
  }
  return activos;
});

  busquedaTexto = signal<string>('');
filtroZonaId = signal<number | 'Todos'>('Todos');
filtroEstado = signal<string>('Todos');

clientesFiltrados = computed(() => {
  const texto = this.busquedaTexto().trim().toLowerCase();
  const zonaId = this.filtroZonaId();
  const estado = this.filtroEstado();

  return this.listaClientes().filter((cli) => {
    const coincideTexto =
      !texto ||
      `${cli.nombres} ${cli.apellidos}`.toLowerCase().includes(texto) ||
      cli.ci?.toLowerCase().includes(texto) ||
      cli.codigo?.toLowerCase().includes(texto) ||
      cli.telefono?.toLowerCase().includes(texto) ||
      cli.usuario?.toLowerCase().includes(texto);

    const coincideZona = zonaId === 'Todos' || cli.zona?.id === zonaId;

    let coincideEstado = true;
    if (estado === 'Moroso') {
      coincideEstado = this.mesesDeCliente(cli) >= 1;
    } else if (estado !== 'Todos') {
      coincideEstado = cli.estado === estado;
    }

    return coincideTexto && coincideZona && coincideEstado;
  });
});

private mesesDeCliente(cliente: Cliente): number {
  const efectiva = this.fechaEfectivaVencimiento(cliente); // ya lo tienes en el archivo
  if (!efectiva) return 0;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (efectiva >= hoy) return 0;

  let meses = (hoy.getFullYear() - efectiva.getFullYear()) * 12 + (hoy.getMonth() - efectiva.getMonth());
  if (hoy.getDate() < efectiva.getDate()) meses -= 1;
  return Math.max(meses, 1);
}


mesesAPagarCliente = signal<number>(1);
pagoAdelantadoCliente = signal<boolean>(false);

private formatMesAnio(fecha: Date): string {
  const texto = fecha.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

anioGridCliente = signal<number>(new Date().getFullYear());
readonly currentYear = new Date().getFullYear();

cambiarAnioGridCliente(delta: number): void {
  const nuevo = this.anioGridCliente() + delta;
  if (nuevo < this.currentYear || nuevo > this.currentYear + 1) return;
  this.anioGridCliente.set(nuevo);
}

mesesGridCliente = computed(() => {
  const cliente = this.clienteParaPago();
  if (!cliente) return [];
  return this.generarMesesGrid(cliente, this.mesesAPagarCliente(), this.pagoAdelantadoCliente(), this.anioGridCliente());
});

private inicioDeMes(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

private mesRealmenteDebido(fechaCobrable: Date): Date {
  return new Date(fechaCobrable.getFullYear(), fechaCobrable.getMonth() - 1, 1);
}

private generarMesesGrid(cliente: Cliente, mesesSeleccionados: number, adelanto: boolean, anio: number): MesPago[] {
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActualIndex = hoy.getMonth();

  const inicioServicioRaw = cliente.fechaPrimerPago ?? cliente.fechaInstalacion ?? null;
  const inicioServicio = inicioServicioRaw ? this.inicioDeMes(this.parseFechaLocal(inicioServicioRaw)) : null;

  const vencimientoEfectivo = this.fechaEfectivaVencimiento(cliente);
  const vencimientoMes = vencimientoEfectivo ? this.mesRealmenteDebido(this.inicioDeMes(vencimientoEfectivo)) : null;

  const meses: MesPago[] = [];
  for (let m = 0; m < 12; m++) {
    const fechaMes = new Date(anio, m, 1);
    let estado: MesPago['estado'];

    if (inicioServicio && fechaMes < inicioServicio) {
      estado = 'no-aplica';
    } else if (vencimientoMes && fechaMes < vencimientoMes) {
      estado = 'pagado';
    } else if (anio < anioActual || (anio === anioActual && m < mesActualIndex)) {
      estado = 'disponible';
    } else {
      estado = 'bloqueado-futuro';
    }

    meses.push({ fecha: fechaMes, label: fechaMes.toLocaleDateString('es-BO', { month: 'short' }), estado });
  }

  const gridCompleto = this.gridAcumuladoHastaCliente(cliente, anio, adelanto);
  const idsSeleccionados = new Set(gridCompleto.slice(0, mesesSeleccionados).map((f) => f.getTime()));

  return meses.map((m) => idsSeleccionados.has(m.fecha.getTime()) ? { ...m, estado: 'seleccionado' as const } : m);
}

seleccionarMesGridCliente(mes: MesPago): void {
  if (mes.estado === 'no-aplica' || mes.estado === 'pagado') return;
  if (mes.estado === 'bloqueado-futuro' && !this.pagoAdelantadoCliente()) return;

  const cliente = this.clienteParaPago();
  if (!cliente) return;

  const acumulado = this.gridAcumuladoHastaCliente(cliente, this.anioGridCliente(), this.pagoAdelantadoCliente());
  const idx = acumulado.findIndex((f) => f.getTime() === mes.fecha.getTime());
  if (idx === -1) return;

  this.mesesAPagarCliente.set(idx + 1);
  this.actualizarMontoPorMeses();
}


togglePagoAdelantadoCliente(): void {
  const nuevoValor = !this.pagoAdelantadoCliente();
  this.pagoAdelantadoCliente.set(nuevoValor);

  if (!nuevoValor) {
    const cliente = this.clienteParaPago();
    if (cliente) {
      const gridSinAdelanto = this.generarMesesGrid(cliente, 0, false, this.anioGridCliente());
      const totalDisponibles = gridSinAdelanto.filter((m) => m.estado === 'disponible').length;
      if (this.mesesAPagarCliente() > totalDisponibles) {
        this.mesesAPagarCliente.set(totalDisponibles);
        this.actualizarMontoPorMeses();
      }
    }
  }
}


private gridAcumuladoHastaCliente(cliente: Cliente, anioLimite: number, adelanto: boolean): Date[] {
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActualIndex = hoy.getMonth();

  const inicioServicioRaw = cliente.fechaPrimerPago ?? cliente.fechaInstalacion ?? null;
  const inicioServicio = inicioServicioRaw ? this.inicioDeMes(this.parseFechaLocal(inicioServicioRaw)) : null;

  const vencimientoEfectivo = this.fechaEfectivaVencimiento(cliente);
  const vencimientoMes = vencimientoEfectivo ? this.mesRealmenteDebido(this.inicioDeMes(vencimientoEfectivo)) : null;



  const resultado: Date[] = [];
  for (let anio = anioActual; anio <= anioLimite; anio++) {
    for (let m = 0; m < 12; m++) {
      const fechaMes = new Date(anio, m, 1);
      if (inicioServicio && fechaMes < inicioServicio) continue;
      if (vencimientoMes && fechaMes < vencimientoMes) continue;

      const esPasado = anio < anioActual || (anio === anioActual && m < mesActualIndex);
      if (esPasado || adelanto) resultado.push(fechaMes);
    }
  }
  return resultado;
}

proximoVencimientoFormateadoCliente(): string {
  const cliente = this.clienteParaPago();
  if (!cliente) return '—';
  const efectiva = this.fechaEfectivaVencimiento(cliente);
  if (!efectiva) return 'Sin registro previo';
  return this.formatMesAnio(efectiva);
}

mesCubiertoHastaCliente(): string {
  const cliente = this.clienteParaPago();
  if (!cliente) return '—';
  const acumulado = this.gridAcumuladoHastaCliente(cliente, this.anioGridCliente(), this.pagoAdelantadoCliente());
  const seleccionados = acumulado.slice(0, this.mesesAPagarCliente());
  if (seleccionados.length === 0) return '—';
  return this.formatMesAnio(seleccionados[seleccionados.length - 1]);
}

cobrarAPartirDeCliente(): string {
  const cliente = this.clienteParaPago();
  if (!cliente) return '—';
  const acumulado = this.gridAcumuladoHastaCliente(cliente, this.anioGridCliente(), this.pagoAdelantadoCliente());
  const seleccionados = acumulado.slice(0, this.mesesAPagarCliente());
  if (seleccionados.length === 0) return '—';
  const ultimoMes = seleccionados[seleccionados.length - 1];
  const proximo = new Date(ultimoMes.getFullYear(), ultimoMes.getMonth() + 2, 1);
  return this.formatMesAnio(proximo);
}

}
