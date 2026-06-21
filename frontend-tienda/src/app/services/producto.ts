import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://localhost:3000/api/productos';

  constructor(private http: HttpClient) { }

  login(credenciales: any) {
    return this.http.post(`${this.apiUrl}/login`, credenciales);
  }

  registrar(datosUsuario: any) {
    // Esto enviará el JSON con nombre, apellido, email, etc.
    return this.http.post(`${this.apiUrl}/registro`, datosUsuario);
  }

  crearProducto(datosProducto: any): Observable<any> {
    // Realizamos una petición POST enviando todo el objeto (nombre, precio, imágenes, etc.)
    return this.http.post<any>(this.apiUrl, datosProducto);
  }

  obtenerProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  obtenerCategorias(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/categorias');
  }
}