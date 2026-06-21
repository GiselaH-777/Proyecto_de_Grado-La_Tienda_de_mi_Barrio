import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../services/producto';
import { FotoService } from '../../services/foto.service';
import { CartService } from '../../services/cart.service';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-ecommerce',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ecommerce.html',
  styleUrls: ['./ecommerce.css'],
})
export class Ecommerce implements OnInit, AfterViewInit, OnDestroy {
  productos: any[] = [];
  showLeftArrow = false;
  showRightArrow = false;
  textoBusqueda: string = '';

  categorias: Array<{ key: string; label: string; id: number; keywords: string[] }> = [
    { key: 'Todos', label: '✨ Todos', id: 0, keywords: [] }
  ];

  activeCategory = 'Todos';

  get cartCount() {
    return this.cartService.totalCount;
  }

  scrollToCategory(categoryKey: string) {
    this.activeCategory = categoryKey;
    const target = document.getElementById(`categoria-${categoryKey}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  productsByCategory(categoryKey: string): any[] {
    if (!categoryKey || categoryKey === 'Todos') {
      return this.productosFiltrados;
    }

    const category = this.categorias.find(c => c.key === categoryKey);
    const categoryId = category?.id;

    return this.productosFiltrados.filter(p => {
      const productCategoryId = p.id_categoria || p.categoria_id || p.categoryId || p.category_id;
      if (productCategoryId && categoryId != null) {
        return Number(productCategoryId) === Number(categoryId);
      }

      const keywords = category?.keywords || [];
      const text = [
        p.categoria,
        p.categoria_producto,
        p.categoriaProducto,
        p.nombre,
        p.producto_nombre,
        p.descripcion,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return keywords.some(keyword => text.includes(keyword));
    });
  }

  trackByCategory(index: number, item: any) {
    return item?.key || index;
  }

  trackByProduct(index: number, item: any) {
    return item?.id_producto || item?.id || item?.idProduct || index;
  }

  uploadFile: File | null = null;
  uploadPreview: string | null = null;
  uploadProductoId: number | null = null;
  uploadPortada: boolean = true;
  uploadStatus: string = '';
  bannerImagePreview: string | null = null;
  bannerUploadStatus: string = '';

  @ViewChild('pasillos', { static: true }) pasillosRef!: ElementRef<HTMLElement>;
  private routerSub: any;

  constructor(
    private productoService: ProductoService,
    private fotoService: FotoService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
    // Si la navegación incluye un fragmento, hacemos scroll a la categoría correspondiente
    this.routerSub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      try {
        const tree = this.router.parseUrl(this.router.url);
        const frag = tree.fragment;
        if (frag && frag.startsWith('categoria-')) {
          const key = frag.replace('categoria-', '');
          this.activeCategory = key;
          setTimeout(() => this.scrollToCategory(key), 80);
        }
      } catch (e) {
        // ignore
      }
    });
  }

  ngOnDestroy(): void {
    try { this.routerSub?.unsubscribe(); } catch (e) {}
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
    this.cartService.addProduct(p);
    this.triggerCartPulse();
  }

  changeQty(p: any, delta: number) {
    const newQty = Math.max(0, (p.qty || 0) + delta);
    p.qty = newQty;
    this.cartService.updateQuantity(p, newQty);
    this.triggerCartPulse();
  }

  goToCart() {
    this.router.navigate(['/pedidos-pendientes']);
  }

  goToOfertas() {
    this.router.navigate(['/ofertas']);
  }

  goToHome() {
    // Navega al inicio del ecommerce
    this.router.navigate(['/ecommerce']);
  }

  triggerCartPulse() {
    this.cartPulse = true;
    setTimeout(() => this.cartPulse = false, 700);
  }

  cargarProductos() {
    this.productoService.obtenerProductos().subscribe({
      next: (res: any[]) => {
        this.productos = res || [];
        this.uploadProductoId = this.determineDefaultUploadProductId();

        // Para cada producto, pedimos su imagen de portada
        this.productos.forEach((p: any) => {
          const id = p.id_producto || p.id || p.idProducto || p.idProduct;
          if (id) {
            this.fotoService.obtenerImagenesProducto(id).subscribe({
              next: (imgs: any) => {
                if (Array.isArray(imgs) && imgs.length > 0) {
                  const portadaUrl = this.getImagenPortada(imgs);
                  p.imagenPortada = portadaUrl;
                }
              },
              error: () => {}
            });
          }
        });

       this.activeCategory = 'Todos';
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
      }
    });
  }

  cargarCategorias() {
    this.productoService.obtenerCategorias().subscribe({
      next: (res: any[]) => {
        const categoriasDb = res || [];
        this.categorias = [
          { key: 'Todos', label: '✨ Todos', id: 0, keywords: [] },
          ...categoriasDb.map((c: any) => ({
            key: `cat-${c.id_categoria}`,
            label: c.nombre_categoria,
            id: c.id_categoria,
            keywords: [c.nombre_categoria?.toLowerCase() || '']
          }))
        ];
      
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
      }
    });
  }
  
  private getImagenPortada(imgs: any[]): string | undefined {
    if (!Array.isArray(imgs) || imgs.length === 0) {
      return undefined;
    }

    const portadas = imgs.filter((i: any) => i.es_portada === 1);
    if (portadas.length > 0) {
      return portadas[portadas.length - 1]?.url_imagen;
    }

    return imgs[1]?.url_imagen || imgs[0]?.url_imagen;
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

  private determineDefaultUploadProductId(): number | null {
    const producto = this.productos[0];
    return producto ? (producto.id_producto || producto.id || producto.idProducto || producto.idProduct) : null;
  }

  onUploadFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    this.uploadFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.uploadPreview = e.target.result;
    };
    reader.readAsDataURL(file);
    this.uploadStatus = '';
  }

  uploadProductImage() {
    if (!this.uploadFile || !this.uploadProductoId) {
      this.uploadStatus = 'Selecciona una imagen y un producto para continuar.';
      return;
    }

    this.uploadStatus = 'Subiendo imagen...';
    this.fotoService.subirImagenProducto(this.uploadProductoId, this.uploadFile, this.uploadPortada).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.uploadStatus = 'Imagen subida correctamente a la base de datos.';
          this.resetUploadCard(true);
        } else {
          this.uploadStatus = 'No se pudo subir la imagen. Intenta de nuevo.';
        }
      },
      error: (err: any) => {
        console.error('Error al subir imagen de producto:', err);
        this.uploadStatus = 'Error al subir la imagen. Revisa la consola del navegador.';
      }
    });
  }

  onBannerImageSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.bannerImagePreview = e.target.result;
      this.bannerUploadStatus = 'Fachada cargada. Ahora se muestra en el banner.';
    };
    reader.readAsDataURL(file);
  }

  get bannerBackgroundStyle() {
    const overlay = 'linear-gradient(135deg, rgba(255,122,0,0.45), rgba(230,92,0,0.35))';
    if (this.bannerImagePreview) {
      return { 'background-image': `${overlay}, url(${this.bannerImagePreview})` };
    }
    return { 'background-image': overlay, 'background-color': '#FF7A00' };
  }

  resetUploadCard(success = false) {
    this.uploadFile = null;
    this.uploadPreview = null;
    if (!success) {
      this.uploadStatus = '';
    }
  }
}

