import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service'; // Asegúrate de que la ruta sea correcta

@Component({
  selector: 'app-restablecer-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './restablecer-password.html',
  styleUrls: ['./restablecer-password.css']
})
export class RestablecerPasswordComponent {
  // Variables de estado y formulario
  email: string = '';
  nuevaPassword: string = '';
  confirmarPassword: string = '';
  verPass1 = false;
  verPass2 = false;

  constructor(
    private loginService: LoginService, 
    private router: Router
  ) {}

  // Función principal para integrar la lógica y el servicio
  actualizarPassword() {
    // 1. Validaciones de front-end
    if (this.nuevaPassword !== this.confirmarPassword) {
      alert('Vecino, las contraseñas no coinciden. Por favor, verifica.');
      return;
    }

    if (this.nuevaPassword.length < 6) {
      alert('La seguridad es importante. Usa al menos 6 caracteres.');
      return;
    }

    if (!this.email) {
      alert('Por favor, ingresa tu correo electrónico para confirmar el cambio.');
      return;
    }

    console.log('Enviando actualización para:', this.email);
    console.log('Actualizando clave a:', this.nuevaPassword);

    // 2. Llamada al servicio integrando ambos datos
    // Se asegura que la suscripción esté dentro del método de la clase
    this.loginService.actualizarPassword(this.email, this.nuevaPassword).subscribe({
      next: (res: any) => {
        console.log('Respuesta del servidor:', res); 
        alert('¡Excelente! Tu contraseña ha sido actualizada. Ya puedes entrar.');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        console.error('Error al conectar:', err);
        // Si sale 404 aquí, recuerda reiniciar el backend (node index.js)
        console.log('Respuesta del servidor:', err);
        alert('No pudimos actualizar la clave. Verifica que el servidor esté encendido.');
      }
    });
  } 

  cancelar() {
    this.router.navigate(['/login']);
  }
}