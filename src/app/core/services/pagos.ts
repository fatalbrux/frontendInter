import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pago, PagoPayload } from '../interfaces/pago';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly urlBase = 'http://localhost:3000/pago';
  private readonly http = inject(HttpClient);

  funListar(): Observable<Pago[]> {
    return this.http.get<Pago[]>(this.urlBase);
  }

  funGuardar(dato: PagoPayload): Observable<Pago> {
    return this.http.post<Pago>(this.urlBase, dato);
  }

  funEditar(dato: Partial<PagoPayload>, id: number): Observable<Pago> {
    return this.http.patch<Pago>(`${this.urlBase}/${id}`, dato);
  }

  funEliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}