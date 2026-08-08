import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Plan } from '../interfaces/plan';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class PlanesService {
  private readonly urlBase = `${environment.apiUrl}/plan`;
  private readonly http = inject(HttpClient);

  funListar(): Observable<Plan[]> {
    return this.http.get<Plan[]>(this.urlBase);
  }

  funGuardar(dato: Partial<Plan>) {
    return this.http.post(this.urlBase, dato);
  }

  funEditar(dato: Partial<Plan>, id: number) {
    return this.http.patch(`${this.urlBase}/${id}`, dato);
  }

  funEliminar(id: number) {
    return this.http.delete(`${this.urlBase}/${id}`);
  }
}