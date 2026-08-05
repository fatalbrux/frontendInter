import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente } from '../interfaces/cliente';

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
private readonly http=inject(HttpClient);
  // Pon aquí la URL real de tu backend (ej. el de NestJS)
  private readonly apiUrl='http://localhost:3000/cliente'; 

  probarConexion(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

}
