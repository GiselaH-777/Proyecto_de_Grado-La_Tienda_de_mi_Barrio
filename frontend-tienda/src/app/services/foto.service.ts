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

  // --- Imágenes de producto ---
  subirImagenProducto(productId: number, file: File, esPortada: boolean = false) {
    const form = new FormData();
    form.append('imagen', file);
    form.append('es_portada', esPortada ? '1' : '0');
    return this.http.post(`${this.API_URL}/productos/${productId}/imagenes`, form);
  }

  obtenerImagenesProducto(productId: number) {
    return this.http.get(`${this.API_URL}/productos/${productId}/imagenes`);
  }

  marcarPortada(idImagen: number) {
    return this.http.put(`${this.API_URL}/productos/imagenes/${idImagen}/portada`, {});
  }

  eliminarImagen(idImagen: number) {
    return this.http.delete(`${this.API_URL}/productos/imagenes/${idImagen}`);
  }
}