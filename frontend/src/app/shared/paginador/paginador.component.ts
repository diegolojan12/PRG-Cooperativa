import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-paginador',
  template: `
    <nav class="s-pagination" aria-label="Paginación">
      <span
        >{{ total() }} {{ total() === 1 ? 'resultado' : 'resultados' }} · Página {{ pagina() }} de
        {{ ultima() }} · {{ porPagina() }} por página</span
      >
      <div>
        <button
          type="button"
          class="s-secondary"
          [disabled]="pagina() <= 1"
          (click)="cambiar.emit(pagina() - 1)"
        >
          Anterior</button
        ><button
          type="button"
          class="s-secondary"
          [disabled]="pagina() >= ultima()"
          (click)="cambiar.emit(pagina() + 1)"
        >
          Siguiente
        </button>
      </div>
    </nav>
  `,
})
export class PaginadorComponent {
  readonly pagina = input.required<number>();
  readonly total = input.required<number>();
  readonly porPagina = input.required<number>();
  readonly cambiar = output<number>();
  readonly ultima = computed(() => Math.max(1, Math.ceil(this.total() / this.porPagina())));
}
