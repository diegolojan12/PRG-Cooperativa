import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-pagina-no-disponible',
  imports: [RouterLink, IconComponent],
  template: `
    <div class="s-empty s-card">
      <app-icon name="ayuda" />
      <h1>Página no disponible</h1>
      <p>La dirección que abriste no existe o cambió.</p>
      <a class="s-primary" routerLink="/panel">Volver al resumen</a>
    </div>
  `,
})
export class PaginaNoDisponible {}
