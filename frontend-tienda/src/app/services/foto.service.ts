import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FotoService {
  private API_URL = 'http://localhost:3000/api'; 

  constructor(private http: HttpClient) { }

  subirFotoAlServidor(formData: FormData) {
    return this.http.post('http://localhost:3000/api/perfil/foto', formData);
 }

 actualizarPerfilCompleto(datos: any) {
  return this.http.put(`${this.API_URL}/actualizar-perfil-completo`, datos);
}
}