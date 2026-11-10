import { Component, input } from '@angular/core';

/**
 * Campo de formulario con ayuda obligatoria (RF-49-1) y error con causa y
 * corrección debajo (RF-49-2, RNF-16). Si falta el texto de ayuda, no compila.
 * El control proyectado debe usar aria-describedby="{para}-ayuda {para}-error".
 */
@Component({
  selector: 'app-campo',
  template: `
    <div class="s-field" [class.s-field-error]="!!error()">
      <label [for]="para()"
        >{{ etiqueta() }}
        @if (requerido()) {
          <span class="s-required" aria-hidden="true">*</span>
        } @else if (opcional()) {
          <span class="s-muted">(opcional)</span>
        }
      </label>
      <ng-content />
      <small class="s-help" [id]="para() + '-ayuda'">{{ ayuda() }}</small>
      @if (error(); as mensaje) {
        <small class="s-error" [id]="para() + '-error'">{{ mensaje }}</small>
      }
    </div>
  `,
})
export class CampoComponent {
  readonly para = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly ayuda = input.required<string>();
  readonly error = input<string | null>(null);
  readonly requerido = input(false);
  readonly opcional = input(false);
}
