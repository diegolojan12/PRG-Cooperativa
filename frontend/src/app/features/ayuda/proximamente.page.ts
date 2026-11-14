import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { IconComponent } from '../../shared/icon/icon.component';

/** Módulos del catálogo cuya pantalla llega en un sprint posterior; cualquier otra ruta muestra "Página no disponible". */
@Component({
  selector: 'app-proximamente-page',
  imports: [RouterLink, IconComponent],
  template: `
    @if (info(); as m) {
      <section class="s-card s-empty s-preview">
        <span class="s-feature-icon yellow"><app-icon [name]="m.icono" /></span>
        <p class="s-eyebrow muted">PRÓXIMAMENTE</p>
        <h1>{{ m.etiqueta }}</h1>
        <p>Este módulo estará disponible en un próximo sprint.</p>
        <a class="s-primary" routerLink="/panel">Volver al resumen <app-icon name="arrow" /></a>
      </section>
    } @else {
      <div class="s-empty s-card">
        <app-icon name="ayuda" />
        <h1>Página no disponible</h1>
        <p>La dirección que abriste no existe o cambió.</p>
        <a class="s-primary" routerLink="/panel">Volver al resumen</a>
      </div>
    }
  `,
})
export class ProximamentePage {
  private session = inject(SessionStore);
  /** Parámetro de ruta (withComponentInputBinding). */
  readonly modulo = input<string>('');
  readonly info = computed(() =>
    this.session.menu().find((m) => m.id === this.modulo() && !m.disponible),
  );
}
