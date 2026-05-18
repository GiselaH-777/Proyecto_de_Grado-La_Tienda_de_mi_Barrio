import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  // Esta es la dirección de tu servidor Node.js
  private API_URL = 'http://localhost:3000/api'; 

  constructor(private http: HttpClient) { }

  // Función para pedirle al backend que mande el correo
  enviarCorreoRecuperacion(email: string) {
    return this.http.post(`${this.API_URL}/enviar-recuperacion`, { email });
  }

  login(credenciales: any) {
    return this.http.post(`${this.API_URL}/login`, credenciales);
  }

  // Método para actualizar la contraseña (organizado aquí)
  actualizarPassword(identificador: string, nuevaPassword: string, passwordActual?: string) {
    return this.http.put(`${this.API_URL}/actualizar-password`, { 
      identificador,    // Puede ser el email o el documento (FK)
      nuevaPassword, 
      passwordActual 
    });
  }

  // En src/app/services/login.service.ts
  actualizarPerfilCompleto(datos: any) {
    // Asegúrate de que el nombre sea igualito: actualizarPerfilCompleto
    return this.http.put(`${this.API_URL}/actualizar-perfil-completo`, datos);
  }
}


