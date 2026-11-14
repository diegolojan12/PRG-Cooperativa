import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon/icon.component';

/** RF-08-4: mensaje de acceso denegado para módulos no autorizados. */
@Component({
  selector: 'app-acceso-denegado-page',
  imports: [RouterLink, IconComponent],
  template: `
    <div class="s-empty s-card" role="alert">
      <app-icon name="roles" />
      <h1>Acceso denegado</h1>
      <p>Tu cuenta no tiene acceso a este módulo. Puedes continuar desde tu resumen.</p>
      <a class="s-primary" routerLink="/panel">Volver al resumen</a>
    </div>
  `,
})
export class AccesoDenegadoPage {}
