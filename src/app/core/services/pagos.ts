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

  funSubirComprobante(pagoId: number, archivo: File): Observable<{ mensaje: string; comprobanteUrl: string }> {
  const formData = new FormData();
  formData.append('archivo', archivo);
    return this.http.post<{ mensaje: string; comprobanteUrl: string }>(`${this.urlBase}/${pagoId}/comprobante`, formData);
  }

  funVerComprobante(pagoId: number): Observable<Blob> {
    return this.http.get(`${this.urlBase}/${pagoId}/comprobante`, { responseType: 'blob' });
  }

  funEditar(dato: Partial<PagoPayload>, id: number): Observable<Pago> {
    return this.http.patch<Pago>(`${this.urlBase}/${id}`, dato);
  }

  funEliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}