import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardResumen } from '../interfaces/dashboard';
import { Cliente } from '../interfaces/cliente';
import { ClienteMoroso } from '../interfaces/dashboard';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly urlBase = 'http://localhost:3000/dashboard';
  private readonly http = inject(HttpClient);

  funResumen(): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(`${this.urlBase}/resumen`);
  }

  funProximosVencimientos(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.urlBase}/proximos-vencimientos`);
  }

  funDeudoresConCorte(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.urlBase}/deudores-corte`);
  }

  funMorosos(): Observable<ClienteMoroso[]> {
  return this.http.get<ClienteMoroso[]>(`${this.urlBase}/morosos`);
}
}