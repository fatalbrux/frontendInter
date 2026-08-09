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
  mesesAPagar = signal<number>(1);
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
    this.mesesAPagar.set(1);
    this.metodoPago.set('Efectivo');
    this.notas.set('');
    this.mostrarModal.set(true);
    this.bancoSeleccionado.set(null);
    this.pagoAdelantado.set(false); // nuevo
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado.set(cliente);
    this.busquedaCi.set('');
    this.mesesAPagar.set(1);
    this.pagoAdelantado.set(false); // nuevo
  }

  quitarClienteSeleccionado(): void {
    this.clienteSeleccionado.set(null);
    this.busquedaCi.set('');
  }

  confirmarPago(): void {
    const cliente = this.clienteSeleccionado();
    if (!cliente) return;
    if (!this.puedeRegistrarPago(cliente)) return; // nuevo
    
    
    const seleccionados = this.mesesGrid().filter((m) => m.estado === 'seleccionado');
  if (seleccionados.length === 0) return;

  const vencimientoAnterior = this.fechaBaseVencimiento(cliente);
  const ultimoMes = seleccionados[seleccionados.length - 1].fecha;
  const nuevoVencimiento = new Date(ultimoMes.getFullYear(), ultimoMes.getMonth() + 1, 1);

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
        this.listarClientes(); // refresca próximo vencimiento del cliente
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
  fecha.setMonth(fecha.getMonth() + 1);
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

  const seleccionados = this.mesesGrid().filter((m) => m.estado === 'seleccionado');
  if (seleccionados.length === 0) return '—';

  const ultimoMes = seleccionados[seleccionados.length - 1].fecha;
  // El pago cubre hasta el mes siguiente al último mes pagado
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

mesesGrid = computed(() => {
  const cliente = this.clienteSeleccionado();
  if (!cliente) return [];
  return this.generarMesesGrid(cliente, this.mesesAPagar(), this.pagoAdelantado());
});

private inicioDeMes(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

private generarMesesGrid(cliente: Cliente, mesesSeleccionados: number, adelanto: boolean): MesPago[] {
  const anioActual = new Date().getFullYear();
  const hoy = new Date();
  const mesActualIndex = hoy.getMonth(); // 0 = enero

  const inicioServicioRaw = cliente.fechaPrimerPago ?? cliente.fechaInstalacion ?? null;
  const inicioServicio = inicioServicioRaw ? this.inicioDeMes(this.parseFechaLocal(inicioServicioRaw)) : null;

  const vencimientoEfectivo = this.fechaEfectivaVencimiento(cliente);
  const vencimientoMes = vencimientoEfectivo ? this.inicioDeMes(vencimientoEfectivo) : null;

  const meses: MesPago[] = [];
  for (let m = 0; m < 12; m++) {
    const fechaMes = new Date(anioActual, m, 1);
    let estado: MesPago['estado'];

    if (inicioServicio && fechaMes < inicioServicio) {
      estado = 'no-aplica';
    } else if (vencimientoMes && fechaMes < vencimientoMes) {
      estado = 'pagado';
    } else if (m < mesActualIndex) {
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

  let contados = 0;
  return meses.map((m) => {
    const esClickable = m.estado === 'disponible' || (adelanto && m.estado === 'bloqueado-futuro');
    if (esClickable) {
      contados++;
      if (contados <= mesesSeleccionados) {
        return { ...m, estado: 'seleccionado' as const };
      }
    }
    return m;
  });
}

seleccionarMesGrid(mes: MesPago): void {
  if (mes.estado === 'no-aplica' || mes.estado === 'pagado') return;
  if (mes.estado === 'bloqueado-futuro' && !this.pagoAdelantado()) return;

  const clickables = this.mesesGrid().filter(
    (m) => m.estado === 'disponible' || m.estado === 'seleccionado' ||
    (this.pagoAdelantado() && m.estado === 'bloqueado-futuro')
  );
  const idx = clickables.findIndex((m) => m.fecha.getTime() === mes.fecha.getTime());
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
      const gridSinAdelanto = this.generarMesesGrid(cliente, 0, false);
      const totalDisponibles = gridSinAdelanto.filter((m) => m.estado === 'disponible').length;
      if (this.mesesAPagar() > totalDisponibles) {
        this.mesesAPagar.set(totalDisponibles);
      }
    }
  }
}


}