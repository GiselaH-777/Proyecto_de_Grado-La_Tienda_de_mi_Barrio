import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  // Asegúrate de que esta URL coincida con donde corre tu backend
  private apiUrl = 'http://localhost:3000/api/perfil';

  constructor(private http: HttpClient) { }

  // Función para obtener los datos exclusivos de un usuario por su documento
  getPerfil(documento: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${documento}`);
  }

  // Función opcional para cuando quieras actualizar los datos después
  updatePerfil(documento: string, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${documento}`, datos);
  }
}