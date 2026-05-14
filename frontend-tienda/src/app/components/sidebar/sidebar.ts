import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // CORREGIDO: Se agregó RouterModule

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule], // CORREGIDO: Necesario para que funcione el clic
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar implements OnInit {
  // Variables de conexión con el HTML
  usuario: any = {
    nombre: '',
    fotoUrl: '',
    documento: '',
    correo: ''
  };

  isCollapsed: boolean = false; // CORREGIDO: Se agregó el ;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.cargarDatos();

    // Escuchar cambios en localStorage (cuando perfil sube foto)
  window.addEventListener('storage', () => {
    this.cargarDatos();
  });
}

  cargarDatos() {
    const datosGuardados = localStorage.getItem('usuario');
    
    if (datosGuardados) {
      try {
        const datosParseados = JSON.parse(datosGuardados);
        
        // Mapeo correcto de datos
        this.usuario.nombre = datosParseados.nombre || '';
        this.usuario.correo = datosParseados.email || datosParseados.correo || '';
        this.usuario.fotoUrl = datosParseados.fotoUrl || '';
      
        console.log('📷 Sidebar cargó foto:', this.usuario.fotoUrl);
        
      } catch (e) {
        console.error("Error al cargar datos", e);
      }
    }
  }

  // FUNCIÓN DE SEGURIDAD: Esta es la que debes usar en el HTML para la inicial
  get inicial(): string {
    if (this.usuario && this.usuario.nombre && this.usuario.nombre.length > 0) {
      return this.usuario.nombre.charAt(0).toUpperCase();
    }
    return 'V'; // Si no hay nombre, pone la V de Vecino por defecto
  }
  
  irAModulo(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }

  cerrarSesion() {
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}