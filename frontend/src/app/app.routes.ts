import { inject } from '@angular/core';
import { RedirectFunction, Router, Routes } from '@angular/router';
import { Landing } from './landing';
import { Login } from './login';
import { Panel } from './panel';
import { Recovery } from './recovery';
import { Register } from './register';

const legacyAuth =
  (path: string): RedirectFunction =>
  ({ queryParams }) =>
    inject(Router).createUrlTree([path], { queryParams });

export const routes: Routes = [
  { path: '', component: Landing, title: 'SUMA · Tu comunidad' },
  { path: 'index.html', redirectTo: '', pathMatch: 'full' },
  { path: 'iniciar-sesion', component: Login, title: 'Iniciar sesión · SUMA' },
  { path: 'registro', component: Register, title: 'Crear cuenta · SUMA' },
  { path: 'recuperar-contrasena', component: Recovery, title: 'Recuperar acceso · SUMA' },
  {
    path: 'internas/iniciar-sesion.html',
    redirectTo: legacyAuth('/iniciar-sesion'),
    pathMatch: 'full',
  },
  { path: 'internas/registro.html', redirectTo: legacyAuth('/registro'), pathMatch: 'full' },
  {
    path: 'internas/recuperar.html',
    redirectTo: legacyAuth('/recuperar-contrasena'),
    pathMatch: 'full',
  },
  { path: 'panel', component: Panel, title: 'Mi comunidad · SUMA' },
  { path: 'panel/:page', component: Panel, title: 'Mi comunidad · SUMA' },
  { path: '**', redirectTo: '' },
];
