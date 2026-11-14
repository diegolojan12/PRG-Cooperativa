import { Directive, ElementRef, effect, inject, input } from '@angular/core';

const FORMATO = new Intl.NumberFormat('es-EC');

/**
 * Anima un número desde 0 hasta su valor ("cuenta hacia arriba").
 * Uso: <strong [appContar]="puntos()"></strong>
 * Si la persona pidió reducir el movimiento, muestra el valor final sin animar.
 */
@Directive({ selector: '[appContar]' })
export class ContarDirective {
  readonly valor = input.required<number>({ alias: 'appContar' });
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private cuadro = 0;

  constructor() {
    effect((alLimpiar) => {
      const destino = this.valor();
      const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducir || destino === 0) {
        this.el.textContent = FORMATO.format(destino);
        return;
      }
      const inicio = performance.now();
      const duracion = 900;
      const paso = (ahora: number) => {
        const t = Math.min(1, (ahora - inicio) / duracion);
        // Desaceleración suave al final (ease-out cúbico).
        this.el.textContent = FORMATO.format(Math.round(destino * (1 - Math.pow(1 - t, 3))));
        if (t < 1) this.cuadro = requestAnimationFrame(paso);
      };
      this.cuadro = requestAnimationFrame(paso);
      alLimpiar(() => cancelAnimationFrame(this.cuadro));
    });
  }
}
