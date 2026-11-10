import { Routes } from '@angular/router';

export const REFERIDOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./referidos.page').then((m) => m.ReferidosPage),
  },
];
