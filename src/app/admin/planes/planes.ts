import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanesService } from '../../core/services/planes';
import { Plan } from '../../core/interfaces/plan';

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planes.html'
})
export class Planes implements OnInit {
  private readonly planesService = inject(PlanesService);

  listaPlanes = signal<Plan[]>([]);
  mostrarModal = signal<boolean>(false);
  mostrarConfirmarEliminar = signal<boolean>(false);
  modoEdicion = signal<boolean>(false);
  idSeleccionado = signal<number | null>(null);
  idPlanAEliminar: number | null = null;

  formulario: Partial<Plan> = {
    nombre: '',
    anchoBanda: '',
    precioMensual: 0,
    descripcion: '',
    estado: 'Activo'
  };

  ngOnInit(): void {
    this.listar();
  }

  listar(): void {
    this.planesService.funListar().subscribe({
      next: (res) => this.listaPlanes.set(res),
      error: (err) => console.error(err)
    });
  }

  abrirModalCrear(): void {
    this.modoEdicion.set(false);
    this.idSeleccionado.set(null);
    this.formulario = {
      nombre: '',
      anchoBanda: '',
      precioMensual: 0,
      descripcion: '',
      estado: 'Activo'
    };
    this.mostrarModal.set(true);
  }

  seleccionarParaEditar(plan: Plan): void {
    this.modoEdicion.set(true);
    this.idSeleccionado.set(plan.id ?? null);
    this.formulario = {
      nombre: plan.nombre,
      anchoBanda: plan.anchoBanda,
      precioMensual: plan.precioMensual,
      descripcion: plan.descripcion,
      estado: plan.estado
    };
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  guardar(): void {
    if (this.modoEdicion() && this.idSeleccionado() !== null) {
      this.planesService.funEditar(this.formulario, this.idSeleccionado()!).subscribe({
        next: () => this.reiniciarYRefrescar(),
        error: (err) => console.error(err)
      });
    } else {
      this.planesService.funGuardar(this.formulario).subscribe({
        next: () => this.reiniciarYRefrescar(),
        error: (err) => console.error(err)
      });
    }
  }

  cambiarEstado(plan: Plan): void {
    const nuevoEstado = plan.estado === 'Activo' ? 'Inactivo' : 'Activo';
    this.planesService.funEditar({ estado: nuevoEstado }, plan.id).subscribe({
      next: () => this.listar(),
      error: (err) => console.error(err)
    });
  }

  eliminar(id: number): void {
    this.idPlanAEliminar = id;
    this.mostrarConfirmarEliminar.set(true);
  }

  confirmarEliminarReal(): void {
    if (this.idPlanAEliminar !== null) {
      this.planesService.funEliminar(this.idPlanAEliminar).subscribe({
        next: () => {
          this.mostrarConfirmarEliminar.set(false);
          this.idPlanAEliminar = null;
          this.listar();
        },
        error: (err) => console.error(err)
      });
    }
  }

  cancelarEliminar(): void {
    this.mostrarConfirmarEliminar.set(false);
    this.idPlanAEliminar = null;
  }

  reiniciarYRefrescar(): void {
    this.mostrarModal.set(false);
    this.modoEdicion.set(false);
    this.idSeleccionado.set(null);
    this.listar();
  }
}