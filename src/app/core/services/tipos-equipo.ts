import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TipoEquipo } from '../interfaces/tipo-equipo';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TiposEquipoService {
  private readonly urlBase = `${environment.apiUrl}/tipo-equipo`;
  private readonly http = inject(HttpClient);

  funListar(): Observable<TipoEquipo[]> {
    return this.http.get<TipoEquipo[]>(this.urlBase);
  }

  funGuardar(dato: Partial<TipoEquipo>) {
    return this.http.post(this.urlBase, dato);
  }

  funEditar(dato: Partial<TipoEquipo>, id: number) {
    return this.http.patch(`${this.urlBase}/${id}`, dato);
  }

  funEliminar(id: number) {
    return this.http.delete(`${this.urlBase}/${id}`);
  }
}