import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente } from '../interfaces/cliente';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly urlBase=`${environment.apiUrl}/cliente`;
  private readonly http=inject(HttpClient);

  funListar():Observable<Cliente[]>{
    return this.http.get<Cliente[]>(this.urlBase);
  }

   // Necesario para el perfil-cliente (GET /cliente/:id)
  funObtenerUno(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.urlBase}/${id}`);
  }


  funGuardar(dato:Partial<Cliente>){
    return this.http.post(this.urlBase,dato);
  }

  funEditar(dato:Partial<Cliente>,id:number){
    return this.http.patch(`${this.urlBase}/${id}`,dato);
  }

  funEliminar(id:number){
    return this.http.delete(`${this.urlBase}/${id}`);
  }
}