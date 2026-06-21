import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Ecommerce } from './ecommerce';
const routes: Routes = [
  { path: '', component: Ecommerce },
  { path: 'carrito', redirectTo: '/pedidos-pendientes', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EcommerceRoutingModule { }