import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../../core/services/clientes';
import { Cliente } from '../../core/interfaces/cliente';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html'
})
export class Clientes implements OnInit {
  private readonly clientesService=inject(ClientesService);

  listaClientes=signal<Cliente[]>([]);
  mostrarModal=signal<boolean>(false);
  mostrarConfirmarEliminar=signal<boolean>(false);
  modoEdicion=signal<boolean>(false);
  idSeleccionado=signal<number|null>(null);
  idClienteAEliminar:number|null=null;

  formulario: Partial<Cliente>={
    codigo: '',
    nombres: '',
    apellidos: '',
    ci: '',
    telefono: '',
    direccion: '',
    correo: '',
    referencia: '',
    fechaInstalacion: undefined,
    fechaPrimerPago: undefined,
    estado: 'Activo',
    observaciones: '',
    zonaId: 1,
    planId: 1
  };

  ngOnInit(): void {
    this.listar();
  }

  listar(): void {
    this.clientesService.funListar().subscribe({
      next: (res)=>this.listaClientes.set(res),
      error: (err)=>console.error(err)
    });
  }

  abrirModalCrear(): void {
    this.modoEdicion.set(false);
    this.idSeleccionado.set(null);
    this.formulario={
      codigo: `CLI-${Math.floor(100+Math.random()*900)}`,
      nombres: '',
      apellidos: '',
      ci: '',
      telefono: '',
      direccion: '',
      correo: '',
      referencia: '',
      fechaInstalacion: undefined,
      fechaPrimerPago: undefined,
      estado: 'Activo',
      observaciones: '',
      zonaId: 1,
      planId: 1
    };
    this.mostrarModal.set(true);
  }

  seleccionarParaEditar(cli: Cliente): void {
    this.modoEdicion.set(true);
    this.idSeleccionado.set(cli.id??null);
    this.formulario={
      codigo: cli.codigo,
      nombres: cli.nombres,
      apellidos: cli.apellidos,
      ci: cli.ci,
      telefono: cli.telefono,
      direccion: cli.direccion,
      correo: cli.correo,
      referencia: cli.referencia,
      fechaInstalacion: cli.fechaInstalacion,
      fechaPrimerPago: cli.fechaPrimerPago,
      estado: cli.estado,
      observaciones: cli.observaciones,
      zonaId: cli.zonaId,
      planId: cli.planId
    };
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  guardar(): void {
    if(this.modoEdicion() && this.idSeleccionado()!==null){
      this.clientesService.funEditar(this.formulario, this.idSeleccionado()!).subscribe({
        next: ()=>this.reiniciarYRefrescar(),
        error: (err)=>console.error(err)
      });
    }else{
      this.clientesService.funGuardar(this.formulario).subscribe({
        next: ()=>this.reiniciarYRefrescar(),
        error: (err)=>console.error(err)
      });
    }
  }

  eliminar(id: number): void {
    this.idClienteAEliminar=id;
    this.mostrarConfirmarEliminar.set(true);
  }

  confirmarEliminarReal(): void {
    if(this.idClienteAEliminar!==null){
      this.clientesService.funEliminar(this.idClienteAEliminar).subscribe({
        next: ()=>{
          this.mostrarConfirmarEliminar.set(false);
          this.idClienteAEliminar=null;
          this.listar();
        },
        error: (err)=>console.error(err)
      });
    }
  }

  cancelarEliminar(): void {
    this.mostrarConfirmarEliminar.set(false);
    this.idClienteAEliminar=null;
  }

  reiniciarYRefrescar(): void {
    this.mostrarModal.set(false);
    this.modoEdicion.set(false);
    this.idSeleccionado.set(null);
    this.listar();
  }
}