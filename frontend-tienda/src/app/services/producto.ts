import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root' // <-- Esto es lo más importante para que el error desaparezca
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  login(credenciales: any) {
    return this.http.post(`${this.apiUrl}/login`, credenciales);
  }

  registrar(datosUsuario: any) {
    // Esto enviará el JSON con nombre, apellido, email, etc.
    return this.http.post(`${this.apiUrl}/registro`, datosUsuario);
  }
}