import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Ecommerce } from './ecommerce';

const routes: Routes = [
  // Cuando la ruta interna esté vacía, procesa el componente principal
  { path: '', component: Ecommerce }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EcommerceRoutingModule { }