import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardResumen, DeudorCorte, ProximoVencimiento } from '../interfaces/dashboard';
import { Cliente } from '../interfaces/cliente';
import { ClienteMoroso } from '../interfaces/dashboard';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly urlBase = `${environment.apiUrl}/dashboard`;
  private readonly http = inject(HttpClient);

  funResumen(): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(`${this.urlBase}/resumen`);
  }

  funProximosVencimientos(): Observable<ProximoVencimiento[]> {
  return this.http.get<ProximoVencimiento[]>(`${this.urlBase}/proximos-vencimientos`);
}

funDeudoresConCorte(): Observable<DeudorCorte[]> {
  return this.http.get<DeudorCorte[]>(`${this.urlBase}/deudores-corte`);
}

  funMorosos(): Observable<ClienteMoroso[]> {
  return this.http.get<ClienteMoroso[]>(`${this.urlBase}/morosos`);
}
}