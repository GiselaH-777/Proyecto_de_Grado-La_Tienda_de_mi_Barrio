import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-mis-facturas',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './mis-facturas.html',
  styleUrls: ['./mis-facturas.css'],
})
export class MisFacturasComponent implements OnInit {
  @Input() idUsuario: number = 16;

  facturas: any[] = [];
  cargando: boolean = true;
  error: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.obtenerFacturas();
  }

  obtenerFacturas(): void {
    const url = `http://localhost:3000/api/facturas/usuario/${this.idUsuario}`;
    this.http.get<any[]>(url).subscribe({
      next: (datos) => {
        this.facturas = datos || [];
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al traer los tiquetes POS desde el backend:', error);
        this.error = 'No pudimos cargar tus facturas. Intenta de nuevo.';
        this.cargando = false;
      }
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Fecha no registrada';
    const date = new Date(fecha);
    const opciones: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return date.toLocaleDateString('es-CO', opciones);
  }

  formatearDinero(cantidad: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cantidad || 0);
  }

  getEstadoBadge(estado: string): { clase: string; texto: string; emoji: string } {
    const estadoLower = (estado || 'Pendiente').toLowerCase();
    if (estadoLower.includes('pagada') || estadoLower.includes('cancelado')) {
      return { clase: 'pagada', texto: '¡Cancelado!', emoji: '👌' };
    } else if (estadoLower.includes('pendiente')) {
      return { clase: 'pendiente', texto: 'Pendiente', emoji: '⏳' };
    }
    return { clase: 'otro', texto: estado || 'Sin estado', emoji: '📄' };
  }

  abrirDetalle(factura: any): void {
    console.log('Ver detalle de factura:', factura);
    // TODO: Implementar modal o navegación a detalle
  }

  descargarRecibo(factura: any): void {
    console.log('Descargar recibo de factura:', factura);
    // TODO: Implementar descarga de PDF
  }
}
