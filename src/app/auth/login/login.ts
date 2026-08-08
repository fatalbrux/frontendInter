import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
})
export class Login {
  usuario = '';
  password = '';

  mostrarPassword = signal(false);
  cargando = signal(false);
  errorMsg = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  togglePassword(): void {
    this.mostrarPassword.set(!this.mostrarPassword());
  }

  onSubmit(): void {
    this.errorMsg.set('');

    if (!this.usuario || !this.password) {
      this.errorMsg.set('Por favor completa todos los campos');
      return;
    }

    this.cargando.set(true);

    this.authService.login(this.usuario, this.password).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.cargando.set(false);

        if (err.status === 404 || err.status === 401) {
          this.errorMsg.set('Usuario o contraseña incorrectos');
        } else if (err.status === 0) {
          this.errorMsg.set('No se pudo conectar con el servidor');
        } else {
          this.errorMsg.set(err.error?.message || 'Ocurrió un error al iniciar sesión');
        }
      },
    });
  }
}