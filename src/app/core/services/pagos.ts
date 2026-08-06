import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pago } from '../interfaces/pago';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly urlBase = 'http://localhost:3000/pago';
  private readonly http = inject(HttpClient);

  funListar(): Observable<Pago[]> {
    return this.http.get<Pago[]>(this.urlBase);
  }

  funGuardar(dato: Partial<Pago>) {
    return this.http.post(this.urlBase, dato);
  }

  funEditar(dato: Partial<Pago>, id: number) {
    return this.http.patch(`${this.urlBase}/${id}`, dato);
  }

  funEliminar(id: number) {
    return this.http.delete(`${this.urlBase}/${id}`);
  }
}