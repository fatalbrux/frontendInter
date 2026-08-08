import { Injectable, signal } from '@angular/core';

export type TipoNotificacion = 'exito' | 'error' | 'info';

export interface Notificacion {
  mensaje: string;
  tipo: TipoNotificacion;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  notificacion = signal<Notificacion | null>(null);
  private temporizador: any = null;

  mostrar(mensaje: string, tipo: TipoNotificacion = 'exito', duracionMs = 3000): void {
    this.notificacion.set({ mensaje, tipo });

    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.notificacion.set(null), duracionMs);
  }

  exito(mensaje: string): void {
    this.mostrar(mensaje, 'exito');
  }

  error(mensaje: string): void {
    this.mostrar(mensaje, 'error');
  }

  cerrar(): void {
    this.notificacion.set(null);
  }
}