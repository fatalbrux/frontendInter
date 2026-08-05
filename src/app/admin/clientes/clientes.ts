import { Component, inject, OnInit, signal } from '@angular/core';
import { ClientesService }  from '../../core/services/clientes';
import { Cliente } from '../../core/interfaces/cliente';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [JsonPipe],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit {
  private readonly clientesService=inject(ClientesService);
  
  protected readonly datosBack=signal<Cliente[]>([]);
  protected readonly errorConexion=signal<string|null>(null);

  ngOnInit(): void {
    this.clientesService.probarConexion().subscribe({
      next:(res:Cliente[])=>{
        this.datosBack.set(res);
      },
      error:(err:unknown)=>{
        console.error(err);
        this.errorConexion.set('No se pudo conectar con el backend');
      }
    });
  }
}