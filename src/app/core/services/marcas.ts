import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Marca } from '../interfaces/marca';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MarcasService {
  private readonly urlBase = `${environment.apiUrl}/marca`;
  private readonly http = inject(HttpClient);

  funListar(): Observable<Marca[]> {
    return this.http.get<Marca[]>(this.urlBase);
  }

  funGuardar(dato: Partial<Marca>) {
    return this.http.post(this.urlBase, dato);
  }

  funEditar(dato: Partial<Marca>, id: number) {
    return this.http.patch(`${this.urlBase}/${id}`, dato);
  }

  funEliminar(id: number) {
    return this.http.delete(`${this.urlBase}/${id}`);
  }
}