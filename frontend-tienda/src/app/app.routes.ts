import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login'; 
import { RegistroComponent } from './components/registro/registro'; 
import { RestablecerPasswordComponent } from './components/restablecer-password/restablecer-password';
import { Perfil } from './components/perfil/perfil'; 

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'restablecer-password', component: RestablecerPasswordComponent },
  { path: 'perfil', component: Perfil },
  {
    path: 'ecommerce',
    loadChildren: () => import('./components/ecommerce/ecommerce-module').then(m => m.EcommerceModule)
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];