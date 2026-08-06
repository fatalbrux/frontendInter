import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Equipo } from '../interfaces/equipo';

@Injectable({ providedIn: 'root' })
export class EquiposService {
  private readonly urlBase = 'http://localhost:3000/equipo';
  private readonly http = inject(HttpClient);

  funListar(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(this.urlBase);
  }

  funGuardar(dato: Partial<Equipo>) {
    return this.http.post(this.urlBase, dato);
  }

  funEditar(dato: Partial<Equipo>, id: number) {
    return this.http.patch(`${this.urlBase}/${id}`, dato);
  }

  funEliminar(id: number) {
    return this.http.delete(`${this.urlBase}/${id}`);
  }
}