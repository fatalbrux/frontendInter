import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagosService } from '../../core/services/pagos';
import { ClientesService } from '../../core/services/clientes';
import { PlanesService } from '../../core/services/planes';
import { MetodoPago, Pago, PagoPayload } from '../../core/interfaces/pago';
import { Cliente } from '../../core/interfaces/cliente';
import { Plan } from '../../core/interfaces/plan';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos.html'
})
export class Pagos implements OnInit {
  private readonly pagosService = inject(PagosService);
  private readonly clientesService = inject(ClientesService);
  private readonly planesService = inject(PlanesService);

  // ================= DATOS BASE =================
  listaPagos = signal<Pago[]>([]);
  listaClientes = signal<Cliente[]>([]);
  listaPlanes = signal<Plan[]>([]);

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
    const texto = this.busquedaCi().trim();
    if (!texto) return [];
    return this.listaClientes()
      .filter(c => c.ci?.toLowerCase().includes(texto.toLowerCase()))
      .slice(0, 8);
  });

  fechaPago: string = this.formatearInputDate(new Date());
  mesesAPagar = signal<number>(1);
  metodoPago = signal<string>('Efectivo');
  notas = signal<string>('');

  precioMensualSeleccionado = computed(() => {
    const cliente = this.clienteSeleccionado();
    return cliente?.plan?.precioMensual ?? 0;
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
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado.set(cliente);
    this.busquedaCi.set('');
    this.mesesAPagar.set(1);
  }

  quitarClienteSeleccionado(): void {
    this.clienteSeleccionado.set(null);
    this.busquedaCi.set('');
  }

  confirmarPago(): void {
    const cliente = this.clienteSeleccionado();
    if (!cliente) return;

    const vencimientoAnterior = cliente.proximoVencimiento ?? new Date();
    const nuevoVencimiento = this.calcularNuevoVencimiento(new Date(vencimientoAnterior), this.mesesAPagar());

    const dato: PagoPayload = {
      fechaPago: this.fechaPago,
      mesesPagados: this.mesesAPagar(),
      monto: this.totalACobrar(),
      metodoPago: this.metodoPago() as MetodoPago,
      vencimientoAnterior: new Date(vencimientoAnterior),
      nuevoVencimiento: nuevoVencimiento,
      notas: this.notas(),
      clienteId: cliente.id
    };

    this.pagosService.funGuardar(dato).subscribe({
      next: () => {
        this.mostrarModal.set(false);
        this.listarPagos();
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

  private formatearInputDate(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}