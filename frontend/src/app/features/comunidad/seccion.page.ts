import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { IconComponent } from '../../shared/icon/icon.component';
import { SECCIONES } from './contenido-ejemplo';

/** Vista previa de un módulo de la comunidad cuya pantalla llega en un sprint posterior. */
@Component({
  selector: 'app-seccion-page',
  imports: [RouterLink, IconComponent],
  template: `
    @if (seccion(); as s) {
      <section class="cm-section">
        <header class="cm-section-head">
          <span class="cm-ico"><app-icon [name]="s.icono" /></span>
          <div>
            <h1>{{ s.titulo }}</h1>
            <p>{{ s.descripcion }}</p>
          </div>
        </header>
        <div class="cm-grid">
          @for (t of s.tarjetas; track t.titulo) {
            <article class="cm-card cm-tile">
              <span class="cm-ico"><app-icon [name]="t.icono" /></span>
              <h2>{{ t.titulo }}</h2>
              <p>{{ t.texto }}</p>
              <span class="cm-pill">{{ t.etiqueta }}</span>
            </article>
          }
        </div>
        <p class="cm-foot" style="margin-top: 18px">
          Vista previa: este módulo estará disponible en un próximo sprint.
        </p>
      </section>
    } @else {
      <div class="cm-card cm-empty">
        <app-icon name="ayuda" />
        <h1>Página no disponible</h1>
        <p>La dirección que abriste no existe o cambió.</p>
        <a class="s-primary" routerLink="/panel">Volver al inicio</a>
      </div>
    }
  `,
})
export class SeccionPage {
  private session = inject(SessionStore);
  /** Parámetro de ruta (withComponentInputBinding). */
  readonly modulo = input<string>('');
  readonly seccion = computed(() => {
    const id = this.modulo();
    return this.session.puede(id) ? SECCIONES[id] : undefined;
  });
}
