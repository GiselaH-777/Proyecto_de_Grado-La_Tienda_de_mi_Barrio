import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductoService } from '../../services/producto';
import { FotoService } from '../../services/foto.service';

@Component({
  selector: 'app-ofertas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ofertas.html',
  styleUrls: ['./ofertas.css']
})

export class Ofertas implements OnInit {
  ofertas = [
    { title: 'Ahorra en Despensa', subtitle: 'Combo arroz + aceite', image: 'https://via.placeholder.com/400x200?text=Oferta+1', categoryKey: 'cat-1' },
    { title: 'Frutas y Verduras', subtitle: 'Frescas y al mejor precio', image: 'https://via.placeholder.com/400x200?text=Oferta+2', categoryKey: 'cat-2' },
    { title: 'Promoción Lácteos', subtitle: 'Leche, queso y más', image: 'https://via.placeholder.com/400x200?text=Oferta+3', categoryKey: 'cat-3' }
  ];

  productos: any[] = [];
  promocionProductos: any[] = [];
  bundleAdded = false;

  constructor(
    public cartService: CartService,
    private router: Router,
    private productoService: ProductoService,
    private fotoService: FotoService
  ) {}

  ngOnInit(): void {
    this.loadProductos();
  }

  private loadProductos() {
    this.productoService.obtenerProductos().subscribe({
      next: (res: any[]) => {
        this.productos = res || [];
        this.promocionProductos = this.productos.filter(p => {
          return p.en_oferta === 1 || p.promocion === 1 || p.descuento || p.porcentaje_descuento;
        });

        // cargar imagenes de portada para los productos en oferta
        this.promocionProductos.forEach((p: any) => {
          const id = p.id_producto || p.id || p.idProducto || p.idProduct;
          if (id) {
            this.fotoService.obtenerImagenesProducto(id).subscribe({
              next: (imgs: any) => {
                if (Array.isArray(imgs) && imgs.length > 0) {
                  p.imagenPortada = imgs.find((i: any) => i.es_portada === 1)?.url_imagen || imgs[0]?.url_imagen;
                }
              },
              error: () => {}
            });
          }
        });
      },
      error: (err) => {
        console.error('Error cargando productos en Ofertas:', err);
      }
    });
  }

  getProductsForOferta(oferta: any, limit = 4): any[] {
    const key = oferta?.categoryKey;
    let candidates: any[] = [];
    if (key && key.startsWith('cat-')) {
      const catId = key.replace('cat-', '');
      candidates = this.productos.filter(p => {
        const pid = p.id_categoria || p.categoria_id || p.categoryId || p.category_id;
        return pid && String(pid) === String(catId);
      });
    }

    if (!candidates || candidates.length === 0) {
      candidates = this.promocionProductos.slice();
    }

    const selected = candidates.slice(0, limit);
    selected.forEach((p: any) => {
      if (!p.imagenPortada) {
        const id = p.id_producto || p.id || p.idProduct || p.idProducto;
        if (id) {
          this.fotoService.obtenerImagenesProducto(id).subscribe({
            next: (imgs: any) => {
              if (Array.isArray(imgs) && imgs.length) {
                p.imagenPortada = imgs.find((i: any) => i.es_portada === 1)?.url_imagen || imgs[0]?.url_imagen;
              }
            }, error: () => {}
          });
        }
      }
    });

    return selected;
  }

  addCombo3x2() {
    const combo = this.promocionProductos.slice(0, 3);
    combo.forEach(p => {
      p.qty = (p.qty || 0) + 1;
      this.cartService.addProduct(p);
    });
    this.bundleAdded = true;
    setTimeout(() => { this.bundleAdded = false; }, 3500);
  }

  showOfferProducts(categoryKey: string) {
    // filtrar productos que coincidan con categoryKey o keywords de la oferta
    const keyId = categoryKey.replace(/^cat-/, '');
    this.promocionProductos = this.productos.filter(p => {
      const productCategoryId = p.id_categoria || p.categoria_id || p.categoryId || p.category_id;
      if (productCategoryId && keyId) {
        return String(productCategoryId) === String(keyId);
      }
      // fallback: buscar por nombre
      const text = [p.nombre, p.descripcion].filter(Boolean).join(' ').toLowerCase();
      return text.includes((categoryKey || '').toLowerCase()) || p.descuento || p.porcentaje_descuento;
    });
  }

  addToCart(p: any) {
    p.qty = (p.qty || 0) + 1;
    this.cartService.addProduct(p);
  }

  changeQty(p: any, delta: number) {
    const newQty = Math.max(0, (p.qty || 0) + delta);
    p.qty = newQty;
    this.cartService.updateQuantity(p, newQty);
  }

  goToCart() {
    this.router.navigate(['/pedidos-pendientes']);
  }

  goToPendingOrders() {
    this.router.navigate(['/pedidos-pendientes']);
  }

  get summaryLabel(): string {
    const count = this.cartService.totalCount;
    return count === 1 ? 'producto en la canasta' : 'productos en la canasta';
  }

  formatMoney(amount: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount);
  }
}
