import { Routes } from '@angular/router';
import { Landing } from './landing';
import { Panel } from './panel';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'index.html', redirectTo: '', pathMatch: 'full' },
  { path: 'panel', component: Panel },
  { path: 'panel/:page', component: Panel },
  { path: '**', redirectTo: '' },
];
