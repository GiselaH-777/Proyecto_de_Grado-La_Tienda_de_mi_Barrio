import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login'; 
import { RegistroComponent } from './components/registro/registro'; 
import { RestablecerPasswordComponent } from './components/restablecer-password/restablecer-password';
import { Perfil } from './components/perfil/perfil'; 
import { MisFacturasComponent } from './components/mis-facturas/mis-facturas';
// MiPedido removed — unified into PedidosPendientes
import { Ofertas } from './components/ofertas/ofertas';
import { PedidosPendientes } from './components/pedidos-pendientes/pedidos-pendientes';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'restablecer-password', component: RestablecerPasswordComponent },
  { path: 'perfil', component: Perfil },
  // legacy 'mi-pedido' route removed; use 'pedidos-pendientes'
  { path: 'ofertas', component: Ofertas },
  { path: 'pedidos-pendientes', component: PedidosPendientes },
  { path: 'facturas', component: MisFacturasComponent },
  {
    path: 'ecommerce',
    loadChildren: () => import('./components/ecommerce/ecommerce-module').then(m => m.EcommerceModule)
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];