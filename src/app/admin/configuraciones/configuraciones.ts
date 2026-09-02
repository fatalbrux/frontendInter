import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { BackupService, BackupInfo, ConfiguracionBackup } from '../../core/services/backup';
import { NotificacionesService } from '../../core/services/notificaciones';
import { modalAnimation, tabContent } from '../../core/animations';
interface UsuarioPerfil {
  id: number;
  email: string;
  nombreCompleto?: string;
  rol?: string;
}

interface DatosEmpresa {
  nombre: string;
  direccion: string;
  telefono1: string;
  telefono2: string;
  email: string;
  logoUrl: string | null;
}

const EMPRESA_STORAGE_KEY = 'configuracionEmpresa';

@Component({
  selector: 'app-configuraciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuraciones.html',
  styleUrl: './configuraciones.css',
  animations: [modalAnimation, tabContent],

})
export class Configuraciones implements OnInit {
  usuario = signal<UsuarioPerfil | null>(null);

  // pestaña activa del panel principal
  tabActiva = signal<'perfil' | 'empresa' | 'bancos' | 'backup'>('perfil');

  versionSistema = '1.0.0';

  // ================= DATOS EMPRESA =================
  datosEmpresa = signal<DatosEmpresa>({
    nombre: '',
    direccion: '',
    telefono1: '',
    telefono2: '',
    email: '',
    logoUrl: null,
  });

  guardadoExitoso = signal<boolean>(false);
   backups = signal<BackupInfo[]>([]);
  cargandoBackups = signal<boolean>(false);
  generandoBackup = signal<boolean>(false);
  restaurandoRuta = signal<string | null>(null);
  mensajeBackup = signal<string>('');
  errorBackup = signal<string>('');
  restaurandoArchivo = signal<boolean>(false);
  mostrarConfirmarRestaurarBackup = signal<boolean>(false);
  backupParaRestaurar = signal<BackupInfo | null>(null);
  archivoParaRestaurar = signal<File | null>(null);
  configBackup = signal<ConfiguracionBackup>({ frecuencia: 'diario', activado: true });
  guardandoConfigBackup = signal<boolean>(false);
  private inputArchivoRef: HTMLInputElement | null = null;
  private readonly notificaciones = inject(NotificacionesService);


  

  constructor(
    private readonly authService: AuthService,
    private readonly backupService: BackupService,
  ) {}

  ngOnInit(): void {
    this.usuario.set(this.authService.getUsuario());
    this.cargarDatosEmpresa();
    this.cargarConfigBackup();
  }

cambiarTab(tab: 'perfil' | 'empresa' | 'bancos' | 'backup'): void {
    this.tabActiva.set(tab);
    if (tab === 'backup' && this.backups().length === 0) {
      this.cargarBackups();
    }
  }
 

  // ================= EMPRESA: cargar / guardar en localStorage =================
  private cargarDatosEmpresa(): void {
    const raw = localStorage.getItem(EMPRESA_STORAGE_KEY);
    if (raw) {
      this.datosEmpresa.set(JSON.parse(raw));
    }
  }

  actualizarCampoEmpresa(campo: keyof DatosEmpresa, valor: string): void {
    this.datosEmpresa.update((actual) => ({ ...actual, [campo]: valor }));
  }

  guardarDatosEmpresa(): void {
    localStorage.setItem(EMPRESA_STORAGE_KEY, JSON.stringify(this.datosEmpresa()));
    this.guardadoExitoso.set(true);
    setTimeout(() => this.guardadoExitoso.set(false), 2500);
  }

  onLogoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.datosEmpresa.update((actual) => ({ ...actual, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  quitarLogo(): void {
    this.datosEmpresa.update((actual) => ({ ...actual, logoUrl: null }));
  }

  cargarBackups(): void {
    this.cargandoBackups.set(true);
    this.errorBackup.set('');
    this.backupService.funListar().subscribe({
      next: (data) => {
        this.backups.set(data);
        this.cargandoBackups.set(false);
      },
      error: (err) => {
        this.errorBackup.set('No se pudo cargar la lista de backups.');
        this.cargandoBackups.set(false);
        console.error(err);
      },
    });
  }

  // en ngOnInit(), agregar junto a cargarBackups():


cargarConfigBackup(): void {
  this.backupService.funObtenerConfiguracion().subscribe({ next: (c) => this.configBackup.set(c) });
}

guardarConfigBackup(): void {
  this.guardandoConfigBackup.set(true);
  this.backupService.funGuardarConfiguracion(this.configBackup()).subscribe({
    next: () => { this.notificaciones.exito('Configuración de backup guardada'); this.guardandoConfigBackup.set(false); },
    error: () => { this.notificaciones.error('No se pudo guardar la configuración'); this.guardandoConfigBackup.set(false); },
  });
}

actualizarFrecuenciaBackup(valor: string): void {
  this.configBackup.update((a) => ({ ...a, frecuencia: valor as ConfiguracionBackup['frecuencia'] }));
}

actualizarActivadoBackup(valor: boolean): void {
  this.configBackup.update((a) => ({ ...a, activado: valor }));
}

 
  generarBackup(): void {
    this.generandoBackup.set(true);
    this.mensajeBackup.set('');
    this.errorBackup.set('');
    this.backupService.funGenerar().subscribe({
      next: (res) => {
        this.mensajeBackup.set(res.mensaje);
        this.generandoBackup.set(false);
        this.cargarBackups();
      },
      error: (err) => {
        this.errorBackup.set('Ocurrió un error al generar el backup.');
        this.generandoBackup.set(false);
        console.error(err);
      },
    });
  }
 
 /* restaurarBackup(backup: BackupInfo): void {
    const confirmado = confirm(
      `¿Seguro que quieres restaurar "${backup.nombre}"? Esto reemplaza TODOS los datos actuales de la base.`,
    );
    if (!confirmado) return;
 
    this.restaurandoRuta.set(backup.ruta);
    this.mensajeBackup.set('');
    this.errorBackup.set('');
    this.backupService.funRestaurar(backup.ruta).subscribe({
      next: (res) => {
        this.mensajeBackup.set(res.mensaje);
        this.restaurandoRuta.set(null);
      },
      error: (err) => {
        this.errorBackup.set('Ocurrió un error al restaurar el backup.');
        this.restaurandoRuta.set(null);
        console.error(err);
      },
    });
  }*/


// Reemplaza restaurarBackup(backup) por esto (ya no usa confirm()):
pedirConfirmacionRestaurar(backup: BackupInfo): void {
  this.backupParaRestaurar.set(backup);
  this.archivoParaRestaurar.set(null);
  this.mostrarConfirmarRestaurarBackup.set(true);
}

 
  descargarBackup(backup: BackupInfo): void {
    this.backupService.funDescargar(backup.nombre).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = backup.nombre;
        enlace.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.errorBackup.set('Ocurrió un error al descargar el backup.');
        console.error(err);
      },
    });
  }


 /* onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
 
    const confirmado = confirm(
      `¿Seguro que quieres restaurar el backup "${archivo.name}"? Esto reemplaza TODOS los datos actuales de la base.`,
    );
    if (!confirmado) {
      input.value = '';
      return;
    }
 
    this.restaurandoArchivo.set(true);
    this.mensajeBackup.set('');
    this.errorBackup.set('');
    this.backupService.funRestaurarDesdeArchivo(archivo).subscribe({
      next: (res) => {
        this.mensajeBackup.set(res.mensaje);
        this.restaurandoArchivo.set(false);
        input.value = '';
      },
      error: (err) => {
        this.errorBackup.set('Ocurrió un error al restaurar el archivo. Verifica que sea un backup válido.');
        this.restaurandoArchivo.set(false);
        input.value = '';
        console.error(err);
      },
    });
  }
*/

  // Reemplaza el contenido de onArchivoSeleccionado (ya no usa confirm()):
  onArchivoSeleccionado(event: Event): void {
  const input = event.target as HTMLInputElement;
  this.inputArchivoRef = input;
  const archivo = input.files?.[0];
  if (!archivo) return;
  this.archivoParaRestaurar.set(archivo);
  this.backupParaRestaurar.set(null);
  this.mostrarConfirmarRestaurarBackup.set(true);
}


cancelarRestaurarBackup(): void {
  this.mostrarConfirmarRestaurarBackup.set(false);
  this.backupParaRestaurar.set(null);
  this.archivoParaRestaurar.set(null);
  if (this.inputArchivoRef) this.inputArchivoRef.value = '';
}

confirmarRestaurarBackupReal(): void {
  const backup = this.backupParaRestaurar();
  const archivo = this.archivoParaRestaurar();

  if (backup) {
    this.restaurandoRuta.set(backup.ruta);
    this.backupService.funRestaurar(backup.ruta).subscribe({
      next: (res) => { this.notificaciones.exito(res.mensaje); this.restaurandoRuta.set(null); this.cancelarRestaurarBackup(); },
      error: () => { this.notificaciones.error('Ocurrió un error al restaurar el backup.'); this.restaurandoRuta.set(null); this.cancelarRestaurarBackup(); },
    });
  } else if (archivo) {
    this.restaurandoArchivo.set(true);
    this.backupService.funRestaurarDesdeArchivo(archivo).subscribe({
      next: (res) => { this.notificaciones.exito(res.mensaje); this.restaurandoArchivo.set(false); this.cancelarRestaurarBackup(); },
      error: () => { this.notificaciones.error('Archivo inválido o error al restaurar.'); this.restaurandoArchivo.set(false); this.cancelarRestaurarBackup(); },
    });
  }
}



}