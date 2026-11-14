import { Injectable, signal } from '@angular/core';

export type TipoAviso = 'exito' | 'error';
export interface Aviso {
  tipo: TipoAviso;
  texto: string;
}

/** RF-49 / RF-49-3: un único sistema de avisos de éxito y error, visibles 4 s como mínimo. */
@Injectable({ providedIn: 'root' })
export class AvisoService {
  static readonly MINIMO_MS = 4000;
  readonly actual = signal<Aviso | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  exito(texto: string): void {
    this.mostrar('exito', texto, 5000);
  }
  error(texto: string): void {
    this.mostrar('error', texto, 8000);
  }
  cerrar(): void {
    clearTimeout(this.timer);
    this.actual.set(null);
  }

  private mostrar(tipo: TipoAviso, texto: string, ms: number): void {
    clearTimeout(this.timer);
    this.actual.set({ tipo, texto });
    this.timer = setTimeout(() => this.actual.set(null), Math.max(ms, AvisoService.MINIMO_MS));
  }
}
