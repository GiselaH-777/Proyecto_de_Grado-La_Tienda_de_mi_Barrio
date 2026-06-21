import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order.html',
  styleUrls: ['./order.css']
})
export class OrderComponent {
  constructor(public cartService: CartService, private router: Router) {}

  get cartItems() {
    return this.cartService.items;
  }

  removeItem(item: any) {
    this.cartService.removeProduct(item.producto);
  }

  changeQty(item: any, delta: number) {
    const newQty = Math.max(0, item.qty + delta);
    this.cartService.updateQuantity(item.producto, newQty);
  }

  formatMoney(amount: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount);
  }

  payWith(method: string) {
    if (this.cartService.totalCount === 0) {
      alert('No hay productos en el carrito para pagar.');
      return;
    }

    alert(`Simulación: vamos al pago con ${method}. Aquí integraremos PSE y Wompi pronto.`);
  }

  continueShopping() {
    this.router.navigate(['/ecommerce']);
  }
}
