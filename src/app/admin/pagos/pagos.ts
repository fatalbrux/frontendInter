import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagosService } from '../../core/services/pagos';
import { ClientesService } from '../../core/services/clientes';
import { PlanesService } from '../../core/services/planes';
import { BancoPago, MetodoPago, Pago, PagoPayload } from '../../core/interfaces/pago';
import { Cliente } from '../../core/interfaces/cliente';
import { Plan } from '../../core/interfaces/plan';
import { NotificacionesService } from '../../core/services/notificaciones';
interface MesPago {
  fecha: Date;
  label: string;
  estado: 'no-aplica' | 'pagado' | 'disponible' | 'bloqueado-futuro' | 'seleccionado';
}
@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos.html'
})
export class Pagos implements OnInit {
  private readonly pagosService = inject(PagosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly clientesService = inject(ClientesService);
  private readonly planesService = inject(PlanesService);
  private parseFechaLocal(fecha: string | Date): Date {
  if (fecha instanceof Date) return fecha;
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(y, m - 1, d);
}
  private readonly DIAS_ANTICIPACION_PAGO = 5;
  readonly currentYear = new Date().getFullYear();

puedeRegistrarPago(cliente: Cliente | null): boolean {
  if (!cliente) return false;
  if (!cliente.proximoVencimiento) return true;

  const vencimiento = this.parseFechaLocal(cliente.proximoVencimiento);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const limiteAnticipado = new Date(vencimiento);
  limiteAnticipado.setDate(limiteAnticipado.getDate() - this.DIAS_ANTICIPACION_PAGO);

  return hoy >= limiteAnticipado;
}

  // ================= DATOS BASE =================
  listaPagos = signal<Pago[]>([]);
  listaClientes = signal<Cliente[]>([]);
  listaPlanes = signal<Plan[]>([]);
  bancosDisponibles: BancoPago[] = ['Banco Unión', 'Banco BNB', 'Banco Prodem', 'Tigo Money'];
  bancoSeleccionado = signal<BancoPago | null>(null);

  // ================= FILTROS TABLA =================
  busquedaTabla = signal<string>('');
  filtroMetodo = signal<string>('Todos');

  pagosFiltrados = computed(() => {
  const texto = this.busquedaTabla().toLowerCase().trim();
  const metodo = this.filtroMetodo();
  return this.listaPagos().filter(pago => {
    const nombre = this.nombreClientePago(pago).toLowerCase();
    const coincideTexto = !texto || nombre.includes(texto) || pago.nroRecibo.toLowerCase().includes(texto);
    const coincideMetodo = metodo === 'Todos' || pago.metodoPago === metodo;
    return coincideTexto && coincideMetodo;
  });
});

  // ================= MODAL REGISTRAR PAGO =================
  mostrarModal = signal<boolean>(false);

  // búsqueda de cliente por CI
  busquedaCi = signal<string>('');
  clienteSeleccionado = signal<Cliente | null>(null);

  clientesEncontrados = computed(() => {
  const texto = this.busquedaCi().trim().toLowerCase();
  if (!texto) return [];
  return this.listaClientes()
    .filter(c =>
      c.ci?.toLowerCase().includes(texto) ||
      c.usuario?.toLowerCase().includes(texto) ||
      `${c.nombres} ${c.apellidos}`.toLowerCase().includes(texto)
    )
    .slice(0, 8);
});

  fechaPago: string = this.formatearInputDate(new Date());
  mesesAPagar = signal<number>(0);
  metodoPago = signal<string>('Efectivo');
  notas = signal<string>('');

  precioMensualSeleccionado = computed(() => {
  const cliente = this.clienteSeleccionado();
  if (!cliente) return 0;
  const plan = this.listaPlanes().find(p => p.id === cliente.plan?.id);
  return Number(plan?.precioMensual ?? 0); // agrega Number() si no lo tenías
});

  mesesPendientes = computed(() => {
    const cliente = this.clienteSeleccionado();
    if (!cliente || !cliente.proximoVencimiento) return 0;
    const hoy = new Date();
    const venc = new Date(cliente.proximoVencimiento);
    const diffMeses = (hoy.getFullYear() - venc.getFullYear()) * 12 + (hoy.getMonth() - venc.getMonth());
    return diffMeses > 0 ? diffMeses : 0;
  });

  opcionesMeses = computed(() => {
    const precio = this.precioMensualSeleccionado();
    return [1, 2, 3, 4, 5, 6].map(n => ({ meses: n, monto: precio * n }));
  });

  totalACobrar = computed(() => this.precioMensualSeleccionado() * this.mesesAPagar());

  ngOnInit(): void {
    this.listarPagos();
    this.listarClientes();
    this.listarPlanes();
  }

  // ================= CARGA DE DATOS =================
  listarPagos(): void {
    this.pagosService.funListar().subscribe({
      next: (res) => this.listaPagos.set(res),
      error: (err) => console.error(err)
    });
  }

  listarClientes(): void {
    this.clientesService.funListar().subscribe({
      next: (res) => this.listaClientes.set(res),
      error: (err) => console.error(err)
    });
  }

  listarPlanes(): void {
    this.planesService.funListar().subscribe({
      next: (res) => this.listaPlanes.set(res),
      error: (err) => console.error(err)
    });
  }

  // ================= HELPERS TABLA =================
  nombreCliente(clienteId: number): string {
    const cliente = this.listaClientes().find(c => c.id === clienteId);
    return cliente ? `${cliente.nombres} ${cliente.apellidos}` : '—';
  }
  nombreClientePago(pago: Pago): string {
  return pago.cliente ? `${pago.cliente.nombres} ${pago.cliente.apellidos}` : '—';
}

  nombreUsuarioPago(pago: Pago): string {
  return pago.cliente?.usuario ?? '—';
  }

  totalIngresosMes(): number {
    const hoy = new Date();
    return this.listaPagos()
      .filter(p => {
        const f = new Date(p.fechaPago);
        return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
      })
      .reduce((acum, p) => acum + Number(p.monto), 0);
  }

  cobrosHoy(): number {
    const hoy = new Date().toDateString();
    return this.listaPagos()
      .filter(p => new Date(p.fechaPago).toDateString() === hoy)
      .reduce((acum, p) => acum + Number(p.monto), 0);
  }

  // ================= MODAL =================
  abrirModal(): void {
    this.busquedaCi.set('');
    this.clienteSeleccionado.set(null);
    this.fechaPago = this.formatearInputDate(new Date());
    this.mesesAPagar.set(0);
    this.metodoPago.set('Efectivo');
    this.notas.set('');
    this.mostrarModal.set(true);
    this.bancoSeleccionado.set(null);
    this.pagoAdelantado.set(false); // nuevo
    this.anioGrid.set(new Date().getFullYear());
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado.set(cliente);
    this.busquedaCi.set('');
    this.mesesAPagar.set(0);
    this.pagoAdelantado.set(false); // nuevo
    this.anioGrid.set(new Date().getFullYear());
  }

  quitarClienteSeleccionado(): void {
    this.clienteSeleccionado.set(null);
    this.busquedaCi.set('');
  }

confirmarPago(): void {
  const cliente = this.clienteSeleccionado();
  if (!cliente) return;
   if (!this.puedeRegistrarPago(cliente) && !this.pagoAdelantado()) {
    this.notificaciones.error('Este cliente aún no puede pagar. Activa "Pago adelantado" si quieres registrar el pago igual.');
    return;
  }
  const acumulado = this.gridAcumuladoHasta(cliente, this.anioGrid(), this.pagoAdelantado());
  const seleccionados = acumulado.slice(0, this.mesesAPagar());
  if (seleccionados.length === 0) return;

  const vencimientoAnterior = this.fechaBaseVencimiento(cliente);
  const ultimoMes = seleccionados[seleccionados.length - 1];
  const nuevoVencimiento = new Date(ultimoMes.getFullYear(), ultimoMes.getMonth() + 2, 1);

  const dato: PagoPayload = {
    fechaPago: this.fechaPago,
    mesesPagados: this.mesesAPagar(),
    monto: this.totalACobrar(),
    metodoPago: this.metodoPago() as MetodoPago,
    vencimientoAnterior: vencimientoAnterior,
    nuevoVencimiento: nuevoVencimiento,
    notas: this.notas(),
    clienteId: cliente.id,
    ...(this.metodoPago() === 'Código QR' && { banco: this.bancoSeleccionado() ?? undefined }),
  };

  this.pagosService.funGuardar(dato).subscribe({
    next: () => {
      this.mostrarModal.set(false);
      this.listarPagos();
      this.notificaciones.exito('Pago registrado exitosamente');
      this.listarClientes();
    },
    error: (err) => console.error(err)
  });
}

  private calcularNuevoVencimiento(fechaBase: Date, meses: number): Date {
    const nueva = new Date(fechaBase);
    nueva.setMonth(nueva.getMonth() + meses);
    return nueva;
  }
 //LOGICA DE FECHAS DE VENCIMIENTO
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

vencimientoPreview = computed(() => {
  const cliente = this.clienteSeleccionado();
  if (!cliente) return '—';

  const acumulado = this.gridAcumuladoHasta(cliente, this.anioGrid(), this.pagoAdelantado());
  const seleccionados = acumulado.slice(0, this.mesesAPagar());
  if (seleccionados.length === 0) return '—';

  const ultimoMes = seleccionados[seleccionados.length - 1];
  const cobertura = new Date(ultimoMes.getFullYear(), ultimoMes.getMonth() + 1, 1);

  const d = String(cobertura.getDate()).padStart(2, '0');
  const m = String(cobertura.getMonth() + 1).padStart(2, '0');
  const y = cobertura.getFullYear();
  return `${d}/${m}/${y}`;
});

  private formatearInputDate(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }


  pagoAdelantado = signal<boolean>(false);


anioGrid = signal<number>(new Date().getFullYear());


mesesGrid = computed(() => {
  const cliente = this.clienteSeleccionado();
  if (!cliente) return [];
  return this.generarMesesGrid(cliente, this.mesesAPagar(), this.pagoAdelantado(), this.anioGrid());
});


cambiarAnioGrid(delta: number): void {
  const anioActual = new Date().getFullYear();
  const nuevo = this.anioGrid() + delta;
  // No permite retroceder antes del año actual ni avanzar más de 1 año adelante
  if (nuevo < anioActual || nuevo > anioActual + 1) return;
  this.anioGrid.set(nuevo);
}

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

    meses.push({
      fecha: fechaMes,
      label: fechaMes.toLocaleDateString('es-BO', { month: 'short' }),
      estado,
    });
  }

  // La cuenta de "seleccionados" tiene que considerar TODOS los meses clickables
  // desde el inicio del servicio hasta el año que se está mostrando (no solo los de este año),
  // para que la selección se mantenga correcta al cambiar de año.
  const gridCompleto = this.gridAcumuladoHasta(cliente, anio, adelanto);
  const idsSeleccionados = new Set(
    gridCompleto.slice(0, mesesSeleccionados).map((f) => f.getTime())
  );

  return meses.map((m) => {
    if (idsSeleccionados.has(m.fecha.getTime())) {
      return { ...m, estado: 'seleccionado' as const };
    }
    return m;
  });
}

// Genera la secuencia completa de fechas clickables (disponible + adelanto),
// empezando desde el primer mes disponible, cruzando el límite de año si hace falta.
private gridAcumuladoHasta(cliente: Cliente, anioLimite: number, adelanto: boolean): Date[] {
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
      if (vencimientoMes && fechaMes < vencimientoMes) continue; // ya pagado, no cuenta como clickable

      const esPasado = anio < anioActual || (anio === anioActual && m < mesActualIndex);
      if (esPasado || adelanto) {
        resultado.push(fechaMes);
      }
    }
  }
  return resultado;
}







seleccionarMesGrid(mes: MesPago): void {
  if (mes.estado === 'no-aplica' || mes.estado === 'pagado') return;
  if (mes.estado === 'bloqueado-futuro' && !this.pagoAdelantado()) return;

  const cliente = this.clienteSeleccionado();
  if (!cliente) return;

  const acumulado = this.gridAcumuladoHasta(cliente, this.anioGrid(), this.pagoAdelantado());
  const idx = acumulado.findIndex((f) => f.getTime() === mes.fecha.getTime());
  if (idx === -1) return;

  this.mesesAPagar.set(idx + 1);
}

togglePagoAdelantado(): void {
  const nuevoValor = !this.pagoAdelantado();
  this.pagoAdelantado.set(nuevoValor);

  // Si se desactiva el adelanto, recorta la selección a solo los meses
  // realmente adeudados, para no dejar "seleccionados" meses futuros bloqueados.
  if (!nuevoValor) {
    const cliente = this.clienteSeleccionado();
    if (cliente) {
      const gridSinAdelanto = this.generarMesesGrid(cliente, 0, false, this.anioGrid());
      const totalDisponibles = gridSinAdelanto.filter((m) => m.estado === 'disponible').length;
      if (this.mesesAPagar() > totalDisponibles) {
        this.mesesAPagar.set(totalDisponibles);
      }
    }
  }
}

// este método ya no bloquea el formulario, solo informa
clienteAlDia(cliente: Cliente): boolean {
  return !this.puedeRegistrarPago(cliente);
}

private formatMesAnio(fecha: Date): string {
  const texto = fecha.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

mesCubiertoHasta = computed(() => {
  const cliente = this.clienteSeleccionado();
  if (!cliente) return '—';
  const acumulado = this.gridAcumuladoHasta(cliente, this.anioGrid(), this.pagoAdelantado());
  const seleccionados = acumulado.slice(0, this.mesesAPagar());
  if (seleccionados.length === 0) return '—';
  const ultimoMes = seleccionados[seleccionados.length - 1];
  return this.formatMesAnio(ultimoMes); // sin sumar nada, es el mes real cubierto
});


cobrarAPartirDe = computed(() => {
  const cliente = this.clienteSeleccionado();
  if (!cliente) return '—';
  const acumulado = this.gridAcumuladoHasta(cliente, this.anioGrid(), this.pagoAdelantado());
  const seleccionados = acumulado.slice(0, this.mesesAPagar());
  if (seleccionados.length === 0) return '—';
  const ultimoMes = seleccionados[seleccionados.length - 1];
  // +2: salta el mes siguiente (aún no consumido/facturable) y apunta al que sí lo será
  const proximo = new Date(ultimoMes.getFullYear(), ultimoMes.getMonth() + 2, 1);
  return this.formatMesAnio(proximo);
});

}