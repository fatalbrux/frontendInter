import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BackupInfo {
  nombre: string;
  ruta: string;
  fecha: string;
  tamanoKB: number;
}

export interface ConfiguracionBackup {
  frecuencia: 'diario' | 'semanal' | 'mensual';
  activado: boolean;
}

@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly urlBase = `${environment.apiUrl}/backup`;
  private readonly http = inject(HttpClient);

  funListar(): Observable<BackupInfo[]> {
    return this.http.get<BackupInfo[]>(this.urlBase);
  }

  funGenerar(): Observable<{ mensaje: string; ruta: string }> {
    return this.http.post<{ mensaje: string; ruta: string }>(`${this.urlBase}/manual`, {});
  }

  funRestaurar(ruta: string): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.urlBase}/restaurar`, { ruta });
  }

  /** Restaura a partir de un archivo .json elegido por el usuario (ej. traído de otra PC). */
  funRestaurarDesdeArchivo(archivo: File): Observable<{ mensaje: string }> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<{ mensaje: string }>(`${this.urlBase}/restaurar-archivo`, formData);
  }

  // responseType 'blob' porque el backend devuelve el archivo directamente (res.download)
  funDescargar(nombre: string): Observable<Blob> {
    return this.http.get(`${this.urlBase}/descargar/${nombre}`, { responseType: 'blob' });
    
  }

  funObtenerConfiguracion(): Observable<ConfiguracionBackup> {
  return this.http.get<ConfiguracionBackup>(`${this.urlBase}/configuracion`);
}

funGuardarConfiguracion(config: ConfiguracionBackup): Observable<ConfiguracionBackup> {
  return this.http.post<ConfiguracionBackup>(`${this.urlBase}/configuracion`, config);
}

}