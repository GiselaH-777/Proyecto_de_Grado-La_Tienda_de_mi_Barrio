import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router'; // Para navegar

@Component({
  selector: 'app-registro',
  standalone: true, 
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './registro.html',
  styleUrls: ['./registro.css']
})

export class RegistroComponent {
  // --- Datos del Nuevo Vecino ---
  nuevoUsuario = {
    tipo_documento: '',
    documento: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    direccion: '',
    numero_cuenta: '',
    banco: '',
    tipo_cuenta: ''
  };

  verPassword = false;

  // Definimos la API_URL que usa tu función de actualizar
  private API_URL = 'http://localhost:3000/api';

  // LLAVE MAESTRA: Inyectamos todo lo necesario en el constructor
  constructor(
    private http: HttpClient, 
    private router: Router
  ) {}

  // --- Lógica de Registro con CANDADO DE SEGURIDAD ---
  registrar() {
    // BLOQUEO: No permitimos registros vacíos para evitar el error de "Duplicate entry"
    if (!this.nuevoUsuario.nombre.trim() || !this.nuevoUsuario.email.trim() || !this.nuevoUsuario.password.trim()) {
      alert('¡Oye vecina! Por favor, completa nombre, correo y contraseña.');
      return; 
    }

    console.log('Enviando datos al backend...', this.nuevoUsuario);

    this.http.post('http://localhost:3000/api/registro', this.nuevoUsuario) 
      .subscribe({
        next: (respuesta: any) => {
          console.log('¡Éxito! El servidor respondió:', respuesta);
          alert(`¡Bienvenida a la vecindad, ${this.nuevoUsuario.nombre}! Registro completado.`);
          // Después de registrarse, la enviamos al login para que estrene su cuenta
          this.router.navigate(['/login']); 
        },
        error: (fallo) => {
          console.error('Hubo un problema al registrar:', fallo);
          alert('Parece que el puente está caído o el correo ya existe. Revisa la terminal.');
        }
      });
  }

  
    // --- Navegación ---
  irALogin() {
    this.router.navigate(['/login']);
  }

  validarSoloNumeros(event: any) {
    event.target.value = event.target.value.replace(/[^0-9]/g, '');
    this.nuevoUsuario.documento = event.target.value;
  }
}
