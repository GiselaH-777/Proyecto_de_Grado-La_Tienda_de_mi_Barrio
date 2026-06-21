import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-pedidos-pendientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos-pendientes.html',
  styleUrls: ['./pedidos-pendientes.css'],
})
export class PedidosPendientes implements OnInit {
  readonly shippingCost = 5000;
  paymentMethods = ['Efectivo al recibir', 'Nequi / Daviplata', 'Tarjeta débito/crédito'];
  selectedPaymentMethod = this.paymentMethods[0];
  amountForChange = 0;
  cardNumber = '';
  cardExpiry = '';
  cardCvc = '';
  paymentProofLabel = '';
  deliveryAddress = '';
  contactPhone = '';
  notes = '';
  orderMessage = '';
  submitting = false;

  setAmountShortcut(value: number) {
    this.amountForChange = value;
  }

  payWithWompi() {
    const amount = this.totalAmount || 0;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Wompi - Simulación</title></head><body style="font-family:Inter,Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fff"><div style="max-width:520px;padding:24px;border-radius:12px;border:1px solid #eee;text-align:center"><h2 style="color:#102030;margin-bottom:8px">Simulación Wompi</h2><p style="color:#555;margin-bottom:18px">Monto a pagar: <strong>${this.formatMoney(amount)}</strong></p><p style="margin-bottom:18px;color:#6b6b6b">Este es un paseo de prueba. En producción se abriría el checkout de Wompi.</p><button id="ok" style="background:#ff7a00;color:#fff;border:none;padding:12px 18px;border-radius:10px;font-weight:800;cursor:pointer">Simular pago exitoso</button></div><script>document.getElementById('ok').addEventListener('click',function(){window.opener && window.opener.postMessage({wompi:'success'}, '*');window.close();});</script></body></html>`;

    const win = window.open('about:blank', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    } else {
      alert('Se bloqueó la apertura de la ventana de pago. Permite popups para continuar.');
    }
  }

  user = {
    nombre: '',
    apellido: '',
    email: '',
    documento: '',
    telefono: '',
    direccion: ''
  };

  constructor(public cartService: CartService, private router: Router) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const raw = localStorage.getItem('usuario');
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      this.user.nombre = parsed.nombre ?? '';
      this.user.apellido = parsed.apellido ?? '';
      this.user.email = parsed.email ?? parsed.correo ?? '';
      this.user.documento = parsed.documento ?? '';
      this.user.telefono = parsed.telefono ?? '';
      this.user.direccion = parsed.direccion ?? '';

      if (this.user.direccion) {
        this.deliveryAddress = this.user.direccion;
      }
      if (this.user.telefono) {
        this.contactPhone = this.user.telefono;
      }
    } catch (error) {
      console.error('Error leyendo datos de usuario:', error);
    }
  }

  get cartItems() {
    return this.cartService.items;
  }

  get cartEmpty() {
    return this.cartItems.length === 0;
  }

  get subtotal() {
    return this.cartService.totalAmount;
  }

  get totalAmount() {
    return this.cartEmpty ? 0 : this.subtotal + this.shippingCost;
  }

  get userName() {
    return `${this.user.nombre || 'Vecino'} ${this.user.apellido || ''}`.trim();
  }

  get summaryLabel() {
    const count = this.cartService.totalCount;
    return count === 1 ? 'producto en la canasta' : 'productos en la canasta';
  }

  selectPayment(method: string) {
    this.selectedPaymentMethod = method;
  }

  formatMoney(amount: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount);
  }

  getProductPrice(producto: any) {
    return Number(producto?.precio ?? producto?.price ?? 0) || 0;
  }

  async confirmOrder() {
    if (this.cartEmpty) {
      alert('¡Tu canasta está vacía! Agrega unos productos primero.');
      this.router.navigate(['/ecommerce']);
      return;
    }

    if (!this.deliveryAddress.trim() || !this.contactPhone.trim()) {
      alert('Por favor completa la dirección y el teléfono de contacto.');
      return;
    }

    if (this.selectedPaymentMethod === 'Tarjeta débito/crédito' && (!this.cardNumber.trim() || !this.cardExpiry.trim() || !this.cardCvc.trim())) {
      alert('Por favor completa los datos de tu tarjeta para continuar.');
      return;
    }

    const orderPayload = {
      cliente: {
        nombre: this.user.nombre,
        apellido: this.user.apellido,
        email: this.user.email,
        documento: this.user.documento,
      },
      direccion: this.deliveryAddress.trim(),
      telefono: this.contactPhone.trim(),
      notas: this.notes.trim(),
      metodoPago: this.selectedPaymentMethod,
      montoParaCambio: this.selectedPaymentMethod === 'Efectivo al recibir' ? Number(this.amountForChange) : null,
      comprobantePago: this.paymentProofLabel ? { archivo: this.paymentProofLabel } : null,
      tarjeta: this.selectedPaymentMethod === 'Tarjeta débito/crédito' ? {
        tipo: 'débito/crédito',
        ultima4: this.cardNumber.replace(/\D/g, '').slice(-4)
      } : null,
      items: this.cartItems.map(item => ({
        id_producto: item.producto.id_producto ?? item.producto.id ?? item.producto.idProducto,
        nombre: item.producto.nombre ?? item.producto.producto_nombre,
        cantidad: item.qty,
        precio: this.getProductPrice(item.producto)
      })),
      subtotal: this.subtotal,
      envio: this.shippingCost,
      total: this.totalAmount,
      estado: 'pendiente',
      creadoEn: new Date().toISOString()
    };

    this.submitting = true;
    this.orderMessage = '';

    try {
      const response = await fetch('http://localhost:3000/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      if (response.ok) {
        this.cartService.clearCart();
        this.orderMessage = '¡Pedido enviado! Preparamos tu mercado y te avisamos cuando esté en camino.';
      } else {
        const errorData = await response.json().catch(() => null);
        this.orderMessage = `No se pudo enviar el pedido: ${errorData?.message || response.statusText}`;
      }
    } catch (error) {
      console.error('Error al enviar el pedido:', error);
      this.orderMessage = 'No fue posible conectar con el servidor. Revisa la conexión o intenta de nuevo más tarde.';
    } finally {
      this.submitting = false;
    }
  }

  continueShopping() {
    this.router.navigate(['/ecommerce']);
  }

  goToOfertas() {
    this.router.navigate(['/ofertas']);
  }

  goToCart() {
    this.router.navigate(['/pedidos-pendientes']);
  }

  onProofSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.paymentProofLabel = file.name;
    }
  }
}
