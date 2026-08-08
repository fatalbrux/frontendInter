import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pago, PagoPayload } from '../interfaces/pago';
import { environment } from '../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly urlBase = `${environment.apiUrl}/pago`;
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