import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../services/producto';
import { FotoService } from '../../services/foto.service'; 
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ecommerce',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ecommerce.html',
  styleUrls: ['./ecommerce.css'],
})
export class Ecommerce implements OnInit, AfterViewInit {
  productos: any[] = [];
  cartCount = 3; // temporal; enlazar con carrito real luego
  showLeftArrow = false;
  showRightArrow = false;
  textoBusqueda: string = '';

  @ViewChild('pasillos', { static: true }) pasillosRef!: ElementRef<HTMLElement>;

  constructor(private productoService: ProductoService, private fotoService: FotoService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  ngAfterViewInit(): void {
    // Esperamos un tick para que el DOM esté listo y luego evaluamos si aparecen flechas
    setTimeout(() => this.updatePasillosArrows(), 50);
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.updatePasillosArrows();
  }

  scrollPasillos(direction: number) {
    const el = this.pasillosRef?.nativeElement;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.6);
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
    setTimeout(() => this.updatePasillosArrows(), 420);
  }

  onPasillosScroll() {
    this.updatePasillosArrows();
  }

  updatePasillosArrows() {
    const el = this.pasillosRef?.nativeElement;
    if (!el) {
      this.showLeftArrow = false;
      this.showRightArrow = false;
      return;
    }
    this.showLeftArrow = el.scrollLeft > 8;
    this.showRightArrow = el.scrollLeft + el.clientWidth < el.scrollWidth - 8;
  }

  // --- Carrito y agregados ---
  cartPulse = false;

  addToCart(p: any) {
    p.qty = (p.qty || 0) + 1;
    this.cartCount += 1;
    this.triggerCartPulse();
  }

  changeQty(p: any, delta: number) {
    p.qty = (p.qty || 0) + delta;
    if (p.qty < 0) p.qty = 0;
    // Ajustar contador global: si delta positivo sumamos, si negativo restamos hasta 0
    this.cartCount = Math.max(0, this.cartCount + delta);
    this.triggerCartPulse();
  }

  triggerCartPulse() {
    this.cartPulse = true;
    setTimeout(() => this.cartPulse = false, 700);
  }

  cargarProductos() {
    this.productoService.obtenerProductos().subscribe({
      next: (res: any[]) => {
        this.productos = res || [];

        // Para cada producto, pedimos su imagen de portada
        this.productos.forEach((p: any) => {
          const id = p.id_producto || p.id || p.idProducto || p.idProduct;
          if (id) {
            this.fotoService.obtenerImagenesProducto(id).subscribe({
              next: (imgs: any) => {
                if (Array.isArray(imgs) && imgs.length > 0) {
                  const portada = imgs.find((i: any) => i.es_portada === 1) || imgs[0];
                  p.imagenPortada = portada?.url_imagen;
                }
              },
              error: () => {}
            });
          }
        });
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
      }
    });
  }
  
  get productosFiltrados(): any[] { 
      if (!this.textoBusqueda.trim()) {
        return this.productos;
      }
      const texto = this.textoBusqueda.toLowerCase();
      return this.productos.filter(p => 
        (p.nombre && p.nombre.toLowerCase().includes(texto)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(texto))
      );
    }
  }

