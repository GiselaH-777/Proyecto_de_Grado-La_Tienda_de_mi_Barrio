import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Sidebar } from './components/sidebar/sidebar'; 
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, Sidebar],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent { 
  title = 'frontend-tienda';
  mostrarMenu: boolean = false;
  isLoggedIn: boolean = false; 
  isCollapsed: boolean = false;
  usuarioCompartido: any = null;

  constructor(public router: Router) {}

shouldShowNavbar(): boolean {
    const publicRoutes = ['/login', '/registro', '/restablecer-password'];
    return !publicRoutes.includes(this.router.url);
  }

ngOnInit() {
  this.router.events.pipe(
    filter(event => event instanceof NavigationEnd)
  ).subscribe((event: any) => {
    
    // 1. Definimos las rutas que NO deben tener menú (Login y Registro)
    const rutasSinMenu = ['/login', '/registro', '/restablecer-password'];
    
    // 2. Verificamos si la ruta actual está en esa lista negra
    const esRutaLimpia = rutasSinMenu.includes(event.urlAfterRedirects);
    
    // 3. Verificamos la sesión (Esto es CLAVE)
    const tieneSesion = !!localStorage.getItem('usuario');

    // 4. EL INTERRUPTOR:
    // Queremos menú si NO es una ruta limpia (es decir, es /inicio) Y hay sesión.
    this.isLoggedIn = !esRutaLimpia && tieneSesion;
    this.mostrarMenu = this.isLoggedIn;

    // Consola para que tú mismo veas qué está pasando:
    console.log('Ruta:', event.urlAfterRedirects, '¿Tiene Menú?:', this.mostrarMenu);
  });
 }
 // --- MÉTODOS FUERA DE NGONINIT (Así se quitan los errores) ---

  recuperarSesionCompartida() {
    const sesion = localStorage.getItem('usuario');
    if (sesion) {
      this.usuarioCompartido = JSON.parse(sesion);
    }
  }

  onFotoActualizada(nuevaSesion: any) {
    this.usuarioCompartido = nuevaSesion;
    // Guardamos para que sea permanente
    localStorage.setItem('usuario', JSON.stringify(nuevaSesion));
    console.log("Padre: Sesión centralizada actualizada con nueva foto.");
  }
}
