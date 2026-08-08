import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Equipo } from '../interfaces/equipo';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EquiposService {
  private readonly urlBase = `${environment.apiUrl}/equipo`;
  private readonly http = inject(HttpClient);

  funListar(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(this.urlBase);
  }

  funSiguienteCodigo(): Observable<{ codigo: string }> {
  return this.http.get<{ codigo: string }>(`${this.urlBase}/siguiente-codigo`);
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