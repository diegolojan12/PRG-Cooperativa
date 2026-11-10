import { Component, input, model } from '@angular/core';
import { CampoComponent } from '../../shared/campo/campo.component';

export interface Pregunta {
  enunciado: string;
  opciones: string[];
  correcta: number;
}

export const nuevaPregunta = (): Pregunta => ({ enunciado: '', opciones: ['', ''], correcta: 0 });

@Component({
  selector: 'app-editor-pregunta',
  imports: [CampoComponent],
  template: `
    <fieldset>
      <legend>Pregunta</legend>
      <app-campo
        [para]="prefijo() + '-enunciado'"
        etiqueta="Enunciado"
        ayuda="Escribe una pregunta clara de hasta 300 caracteres."
      >
        <input
          [id]="prefijo() + '-enunciado'"
          maxlength="300"
          [value]="datos().enunciado"
          (input)="cambiar({ enunciado: $any($event.target).value })"
        />
      </app-campo>
      @for (opcion of datos().opciones; track $index; let i = $index) {
        <app-campo
          [para]="prefijo() + '-opcion-' + i"
          [etiqueta]="'Opción ' + (i + 1)"
          ayuda="Hasta 160 caracteres. Cada opción debe ser distinta."
        >
          <input
            [id]="prefijo() + '-opcion-' + i"
            maxlength="160"
            [value]="opcion"
            (input)="editarOpcion(i, $any($event.target).value)"
          />
        </app-campo>
        <label class="s-consent">
          <input
            type="radio"
            [name]="prefijo() + '-correcta'"
            [checked]="datos().correcta === i"
            (change)="cambiar({ correcta: i })"
          />
          Marcar opción {{ i + 1 }} como correcta
        </label>
      }
      <div class="s-heading-actions">
        <button
          type="button"
          class="s-secondary"
          [disabled]="datos().opciones.length >= 4"
          (click)="agregar()"
        >
          Agregar opción
        </button>
        <button
          type="button"
          class="s-secondary"
          [disabled]="datos().opciones.length <= 2"
          (click)="quitar()"
        >
          Quitar última opción
        </button>
      </div>
    </fieldset>
  `,
})
export class EditorPreguntaComponent {
  readonly datos = model.required<Pregunta>();
  readonly prefijo = input.required<string>();
  cambiar(cambio: Partial<Pregunta>): void {
    this.datos.update((d) => ({ ...d, ...cambio }));
  }
  editarOpcion(indice: number, valor: string): void {
    this.cambiar({
      opciones: this.datos().opciones.map((opcion, i) => (i === indice ? valor : opcion)),
    });
  }
  agregar(): void {
    this.cambiar({ opciones: [...this.datos().opciones, ''] });
  }
  quitar(): void {
    const opciones = this.datos().opciones.slice(0, -1);
    this.cambiar({ opciones, correcta: Math.min(this.datos().correcta, opciones.length - 1) });
  }
}
