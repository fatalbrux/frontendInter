import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Ciudad } from '../interfaces/ciudad';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CiudadesService {
  private readonly urlBase = `${environment.apiUrl}/ciudad`;
  private readonly http = inject(HttpClient);

  funListar(): Observable<Ciudad[]> {
    return this.http.get<Ciudad[]>(this.urlBase);
  }

  funGuardar(dato: Partial<Ciudad>) {
    return this.http.post(this.urlBase, dato);
  }

  funEditar(dato: Partial<Ciudad>, id: number) {
    return this.http.patch(`${this.urlBase}/${id}`, dato);
  }

  funEliminar(id: number) {
    return this.http.delete(`${this.urlBase}/${id}`);
  }
}