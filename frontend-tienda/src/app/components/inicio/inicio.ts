import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css']
})
export class InicioComponent {
  constructor(private router: Router) {}

  salir() {
    this.router.navigate(['/login']); // Permite al vecino volver al inicio
  }
}