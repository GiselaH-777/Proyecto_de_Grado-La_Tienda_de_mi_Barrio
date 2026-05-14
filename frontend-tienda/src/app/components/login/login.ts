import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
import { AuthService } from '../../services/producto'; 
import { LoginService } from '../../services/login.service'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html', 
  styleUrls: ['./login.css']    
})
export class LoginComponent {
  // --- Datos de los Formularios ---
  credenciales = { email: '', password: '' };
  emailRecuperacion: string = '';

  // --- Control de Interfaz ---
  verPassword = false;
  mostrarRecuperar: boolean = false;

  // Inyectamos ambos en el constructor
  constructor(
    private auth: AuthService, 
    private loginService: LoginService, // Agregado para el correo
    private router: Router
  ) {}  

  // --- Lógica de Inicio de Sesión (Usa AuthService) ---

  onLogin() {
    // PUNTO 1: Validación visual (No hace petición si está vacío)
    if (!this.credenciales.email || !this.credenciales.password) {
      alert('Por favor, llena todos los campos.');
      return; // Aquí se detiene si no hay datos
    }

    // PUNTO 2: Intento de conexión
    this.auth.login(this.credenciales).subscribe({
      next: (res: any) => {
        console.log("¿Qué recibimos del servidor?", res.user); 
         // 1. GUARDAMOS LA SESIÓN
        localStorage.setItem('usuario', JSON.stringify(res.user));

        // 3. Alerta de depuración: Nos dirá si el documento existe o no
        if (res.user.documento) {
          console.log("FK Documento guardada:", res.user.documento);
        } else {
          console.warn("⚠️ ¡Cuidado! El documento no viene en la respuesta. El Perfil fallará.");
          console.log("Campos actuales en la sesión:", Object.keys(res.user));
        }

        console.log('Entrando a la vecindad...');
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        console.error('❌ Error de conexión:', err.message);
        alert('Credenciales inválidas. Verifica tu correo y contraseña.');
      }
    });
  } 


  irARegistro() {
    this.router.navigate(['/registro']);
  }

  // --- Lógica de Recuperación de Contraseña (Usa LoginService) ---
  toggleRecuperar() {
    this.mostrarRecuperar = !this.mostrarRecuperar;
  }

  enviarSolicitud() {
    if (!this.emailRecuperacion) {
      alert('Por favor, escribe tu correo primero.');
      return;
    }

    console.log('Iniciando envío para:', this.emailRecuperacion);
    
    // Usamos loginService que es donde definiste enviarCorreoRecuperacion
    this.loginService.enviarCorreoRecuperacion(this.emailRecuperacion).subscribe({
      next: (res: any) => { // Agregamos :any para evitar errores de tipo
        console.log('Servidor confirma envío:', res); 
        alert('¡Listo! Revisa tu correo, te hemos enviado un enlace de recuperación.');
        this.limpiarFormularioRecuperar();
      },
      error: (err) => {
        console.error('Error en el envío:', err);
        alert('No pudimos conectar con el servidor. Verifica que el backend esté encendido.');
      }
    });
  }
  
  cancelar() {
    this.limpiarFormularioRecuperar();
  }

  private limpiarFormularioRecuperar() {
    this.mostrarRecuperar = false;
    this.emailRecuperacion = '';
  }
}