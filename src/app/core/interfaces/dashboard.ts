export interface ClientePorZona {
  zona: string;
  total: number;
}

export interface IngresoMensual {
  mes: string;
  total: number;
}

export interface MetodoPagoResumen {
  metodo: string;
  total: number;
}

export interface ClienteMoroso {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  ci: string;
  zona: string | null;
  precioMensual: number;
  mesesDeuda: number;
  deudaTotal: number;
  ultimoPago: string | null;
  estado: string;
}


export interface ProximoVencimiento {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  zona: string | null;
  proximoVencimiento: string;
  precioMensual: number;
}

export interface DeudorCorte {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  zona: string | null;
  mesesDeuda: number;
  deudaTotal: number;
}

export interface DashboardResumen {
  totalClientes: number;
  clientesActivos: number;
  clientesSuspendidos: number;
  clientesCorte: number;
  equiposInstalados: number;
  equiposDisponibles: number;
  equiposMantenimiento: number;
  equiposDanados: number;
  cobrosHoy: number;
  ingresosMes: number;
  ingresosAno: number;
  clientesPorZona: ClientePorZona[];
  ingresosMensuales: IngresoMensual[];
  metodosPago: MetodoPagoResumen[];
}