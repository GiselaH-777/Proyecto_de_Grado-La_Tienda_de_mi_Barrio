import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  producto: any;
  qty: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  get items(): CartItem[] {
    return this.itemsSubject.value;
  }

  addProduct(producto: any) {
    if (!producto) {
      return;
    }

    const id = this.getProductId(producto);
    if (!id) {
      return;
    }

    const items = [...this.items];
    const existing = items.find(i => this.getProductId(i.producto) === id);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ producto, qty: 1 });
    }

    this.itemsSubject.next(items);
  }

  updateQuantity(producto: any, qty: number) {
    const id = this.getProductId(producto);
    if (!id) {
      return;
    }

    const items = [...this.items];
    const existing = items.find(i => this.getProductId(i.producto) === id);
    if (!existing) {
      return;
    }

    existing.qty = Math.max(0, qty);
    const filtered = existing.qty > 0 ? items : items.filter(i => this.getProductId(i.producto) !== id);
    this.itemsSubject.next(filtered);
  }

  removeProduct(producto: any) {
    const id = this.getProductId(producto);
    if (!id) {
      return;
    }

    const items = this.items.filter(i => this.getProductId(i.producto) !== id);
    this.itemsSubject.next(items);
  }

  clearCart() {
    this.itemsSubject.next([]);
  }

  get totalCount(): number {
    return this.items.reduce((sum, item) => sum + item.qty, 0);
  }

  get totalAmount(): number {
    return this.items.reduce((sum, item) => sum + this.getPrice(item.producto) * item.qty, 0);
  }

  private getProductId(producto: any): number | string | null {
    if (!producto) {
      return null;
    }
    return producto.id_producto ?? producto.id ?? producto.idProducto ?? producto.idProduct ?? null;
  }

  private getPrice(producto: any): number {
    const price = producto?.precio ?? producto?.price ?? 0;
    return Number(price) || 0;
  }
}
