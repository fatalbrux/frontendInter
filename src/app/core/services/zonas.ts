import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Zona } from '../interfaces/zona';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ZonasService {
  private readonly urlBase = `${environment.apiUrl}/zona`;
  private readonly http = inject(HttpClient);

  funListar(): Observable<Zona[]> {
    return this.http.get<Zona[]>(this.urlBase);
  }

  funGuardar(dato: Partial<Zona>) {
    return this.http.post(this.urlBase, dato);
  }

  funEditar(dato: Partial<Zona>, id: number) {
    return this.http.patch(`${this.urlBase}/${id}`, dato);
  }

  funEliminar(id: number) {
    return this.http.delete(`${this.urlBase}/${id}`);
  }
}