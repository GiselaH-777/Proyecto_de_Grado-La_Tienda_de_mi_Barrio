import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login'; 
import { RegistroComponent } from './components/registro/registro'; 
import { InicioComponent } from './components/inicio/inicio';
import { RestablecerPasswordComponent } from './components/restablecer-password/restablecer-password';
import { Perfil } from './components/perfil/perfil'; 

export const routes: Routes = [
  { path: 'inicio', component: InicioComponent },
  { path: 'perfil', component: Perfil},
  { path: 'login', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'inicio', component: InicioComponent },
  { path: 'restablecer-password', component: RestablecerPasswordComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];