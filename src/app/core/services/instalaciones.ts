import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Instalacion } from '../interfaces/instalacion';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InstalacionesService {
  private readonly urlBase = `${environment.apiUrl}/instalacion`;
  private readonly http = inject(HttpClient);

  funListar(): Observable<Instalacion[]> {
    return this.http.get<Instalacion[]>(this.urlBase);
  }

  funGuardar(dato: Partial<Instalacion>) {
    return this.http.post(this.urlBase, dato);
  }

  funEditar(dato: Partial<Instalacion>, id: number) {
    return this.http.patch(`${this.urlBase}/${id}`, dato);
  }

  funEliminar(id: number) {
    return this.http.delete(`${this.urlBase}/${id}`);
  }
}