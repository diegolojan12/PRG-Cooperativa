import { Component, inject } from '@angular/core';
import { AvisoService } from '../../core/ui/aviso.service';
import { IconComponent } from '../icon/icon.component';

/** Reemplaza AuthNotice y el toast del panel: éxito y error se distinguen por color, icono y rol ARIA. */
@Component({
  selector: 'app-aviso',
  imports: [IconComponent],
  template: `
    @if (avisos.actual(); as aviso) {
      <div
        class="s-toast"
        [class.exito]="aviso.tipo === 'exito'"
        [class.error]="aviso.tipo === 'error'"
        [attr.role]="aviso.tipo === 'error' ? 'alert' : 'status'"
      >
        <span class="s-toast-icon"
          ><app-icon [name]="aviso.tipo === 'error' ? 'alert' : 'check'"
        /></span>
        <p>
          <strong>{{ aviso.tipo === 'error' ? 'No se pudo completar' : 'Listo' }}</strong
          >{{ aviso.texto }}
        </p>
        <button
          type="button"
          class="s-icon-button"
          aria-label="Cerrar mensaje"
          (click)="avisos.cerrar()"
        >
          <app-icon name="close" />
        </button>
      </div>
    }
  `,
})
export class AvisoComponent {
  protected readonly avisos = inject(AvisoService);
}
