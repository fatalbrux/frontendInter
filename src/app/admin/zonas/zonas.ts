import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZonasService } from '../../core/services/zonas';
import { CiudadesService } from '../../core/services/ciudades';
import { Zona } from '../../core/interfaces/zona';
import { Ciudad } from '../../core/interfaces/ciudad';

@Component({
  selector: 'app-zonas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zonas.html'
})
export class Zonas implements OnInit {
  private readonly zonasService = inject(ZonasService);
  private readonly ciudadesService = inject(CiudadesService);

  // ---------- CIUDADES ----------
  listaCiudades = signal<Ciudad[]>([]);
  mostrarModalCiudad = signal<boolean>(false);
  mostrarConfirmarEliminarCiudad = signal<boolean>(false);
  modoEdicionCiudad = signal<boolean>(false);
  idCiudadSeleccionada = signal<number | null>(null);
  idCiudadAEliminar: number | null = null;

  formularioCiudad: Partial<Ciudad> = { nombre: '' };

  // ---------- ZONAS ----------
  listaZonas = signal<Zona[]>([]);
  mostrarModalZona = signal<boolean>(false);
  mostrarConfirmarEliminarZona = signal<boolean>(false);
  modoEdicionZona = signal<boolean>(false);
  idZonaSeleccionada = signal<number | null>(null);
  idZonaAEliminar: number | null = null;

  formularioZona: Partial<Zona> = {
    nombre: '',
    estado: 'Activa',
    ciudadId: undefined
  };

  ngOnInit(): void {
    this.listarCiudades();
    this.listarZonas();
  }

  // ================= CIUDADES =================
  listarCiudades(): void {
    this.ciudadesService.funListar().subscribe({
      next: (res) => this.listaCiudades.set(res),
      error: (err) => console.error(err)
    });
  }

  abrirModalCrearCiudad(): void {
    this.modoEdicionCiudad.set(false);
    this.idCiudadSeleccionada.set(null);
    this.formularioCiudad = { nombre: '' };
    this.mostrarModalCiudad.set(true);
  }

  seleccionarCiudadParaEditar(ciudad: Ciudad): void {
    this.modoEdicionCiudad.set(true);
    this.idCiudadSeleccionada.set(ciudad.id ?? null);
    this.formularioCiudad = { nombre: ciudad.nombre };
    this.mostrarModalCiudad.set(true);
  }

  cerrarModalCiudad(): void {
    this.mostrarModalCiudad.set(false);
  }

  guardarCiudad(): void {
    if (this.modoEdicionCiudad() && this.idCiudadSeleccionada() !== null) {
      this.ciudadesService.funEditar(this.formularioCiudad, this.idCiudadSeleccionada()!).subscribe({
        next: () => this.reiniciarYRefrescarCiudad(),
        error: (err) => console.error(err)
      });
    } else {
      this.ciudadesService.funGuardar(this.formularioCiudad).subscribe({
        next: () => this.reiniciarYRefrescarCiudad(),
        error: (err) => console.error(err)
      });
    }
  }

  eliminarCiudad(id: number): void {
    this.idCiudadAEliminar = id;
    this.mostrarConfirmarEliminarCiudad.set(true);
  }

  confirmarEliminarCiudadReal(): void {
    if (this.idCiudadAEliminar !== null) {
      this.ciudadesService.funEliminar(this.idCiudadAEliminar).subscribe({
        next: () => {
          this.mostrarConfirmarEliminarCiudad.set(false);
          this.idCiudadAEliminar = null;
          this.listarCiudades();
        },
        error: (err) => console.error(err)
      });
    }
  }

  cancelarEliminarCiudad(): void {
    this.mostrarConfirmarEliminarCiudad.set(false);
    this.idCiudadAEliminar = null;
  }

  reiniciarYRefrescarCiudad(): void {
    this.mostrarModalCiudad.set(false);
    this.modoEdicionCiudad.set(false);
    this.idCiudadSeleccionada.set(null);
    this.listarCiudades();
  }

  // ================= ZONAS =================
  listarZonas(): void {
    this.zonasService.funListar().subscribe({
      next: (res) => this.listaZonas.set(res),
      error: (err) => console.error(err)
    });
  }

  abrirModalCrearZona(): void {
    this.modoEdicionZona.set(false);
    this.idZonaSeleccionada.set(null);
    this.formularioZona = { nombre: '', estado: 'Activa', ciudadId: undefined };
    this.mostrarModalZona.set(true);
  }

  seleccionarZonaParaEditar(zona: Zona): void {
    this.modoEdicionZona.set(true);
    this.idZonaSeleccionada.set(zona.id ?? null);
    this.formularioZona = {
      nombre: zona.nombre,
      estado: zona.estado,
    ciudadId: zona.ciudad?.id, // cambia aquí
    };
    this.mostrarModalZona.set(true);
  }

  cerrarModalZona(): void {
    this.mostrarModalZona.set(false);
  }

  guardarZona(): void {
    if (this.modoEdicionZona() && this.idZonaSeleccionada() !== null) {
      this.zonasService.funEditar(this.formularioZona, this.idZonaSeleccionada()!).subscribe({
        next: () => this.reiniciarYRefrescarZona(),
        error: (err) => console.error(err)
      });
    } else {
      this.zonasService.funGuardar(this.formularioZona).subscribe({
        next: () => this.reiniciarYRefrescarZona(),
        error: (err) => console.error(err)
      });
    }
  }

  cambiarEstadoZona(zona: Zona): void {
    const nuevoEstado = zona.estado === 'Activa' ? 'Inactiva' : 'Activa';
    this.zonasService.funEditar({ estado: nuevoEstado }, zona.id).subscribe({
      next: () => this.listarZonas(),
      error: (err) => console.error(err)
    });
  }

  eliminarZona(id: number): void {
    this.idZonaAEliminar = id;
    this.mostrarConfirmarEliminarZona.set(true);
  }

  confirmarEliminarZonaReal(): void {
    if (this.idZonaAEliminar !== null) {
      this.zonasService.funEliminar(this.idZonaAEliminar).subscribe({
        next: () => {
          this.mostrarConfirmarEliminarZona.set(false);
          this.idZonaAEliminar = null;
          this.listarZonas();
        },
        error: (err) => console.error(err)
      });
    }
  }

  cancelarEliminarZona(): void {
    this.mostrarConfirmarEliminarZona.set(false);
    this.idZonaAEliminar = null;
  }

  reiniciarYRefrescarZona(): void {
    this.mostrarModalZona.set(false);
    this.modoEdicionZona.set(false);
    this.idZonaSeleccionada.set(null);
    this.listarZonas();
  }

  // helper para el html
  nombreCiudad(ciudadId: number | undefined): string {
  return this.listaCiudades().find(c => c.id === ciudadId)?.nombre ?? '—';
}
}