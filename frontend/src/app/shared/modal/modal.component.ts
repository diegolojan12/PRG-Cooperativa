import { Component, HostListener, input, output } from '@angular/core';
import { FocusDialogDirective } from '../focus-dialog/focus-dialog.directive';
import { IconComponent } from '../icon/icon.component';

/**
 * Diálogo modal accesible: el fondo es un botón (operable con teclado), Escape
 * cierra y el foco queda atrapado dentro mientras está abierto.
 */
@Component({
  selector: 'app-modal',
  imports: [FocusDialogDirective, IconComponent],
  template: `
    <div class="s-modal-backdrop">
      <button
        type="button"
        class="s-modal-scrim"
        tabindex="-1"
        aria-label="Cerrar ventana"
        [disabled]="ocupado()"
        (click)="cerrar.emit()"
      ></button>
      <section
        class="s-modal"
        appFocusDialog
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="idTitulo()"
      >
        <button
          type="button"
          class="s-modal-close s-icon-button"
          aria-label="Cerrar ventana"
          [disabled]="ocupado()"
          (click)="cerrar.emit()"
        >
          <app-icon name="close" />
        </button>
        <ng-content />
      </section>
    </div>
  `,
})
export class ModalComponent {
  readonly idTitulo = input('dialogTitle');
  readonly ocupado = input(false);
  readonly cerrar = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.ocupado()) this.cerrar.emit();
  }
}
