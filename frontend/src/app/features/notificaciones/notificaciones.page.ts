import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { leerError } from '../../core/http/api-error';
import { AvisoService } from '../../core/ui/aviso.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { NotificacionesStore } from './notificaciones.store';

@Component({
  selector: 'app-notificaciones-page',
  imports: [DatePipe, IconComponent],
  template: `
    <div class="s-page-heading">
      <div>
        <span class="s-eyebrow muted">TU ESPACIO SUMA</span>
        <h1>Notificaciones</h1>
        <p>Todo lo que necesitas saber, en un solo lugar.</p>
      </div>
    </div>
    <div class="s-notes-top">
      <span>{{ store.sinLeer() }} sin leer</span
      ><button
        type="button"
        class="s-secondary"
        (click)="leerTodas()"
        [disabled]="ocupado() || !store.sinLeer()"
      >
        <app-icon name="check" />Marcar todas como leídas
      </button>
    </div>
    <section class="s-card s-notes">
      @for (note of store.lista(); track note.id) {
        <article class="s-notification" [class.unread]="!note.leida">
          <span class="s-feature-icon"><app-icon name="notificaciones" /></span>
          <div>
            <div class="s-note-title">
              <h3>{{ note.titulo }}</h3>
              @if (!note.leida) {
                <span class="s-new">Nueva</span>
              }
            </div>
            <p>{{ note.mensaje }}</p>
            <small>{{ note.fecha | date: 'dd/MM/yyyy · HH:mm' : '-0500' }}</small>
          </div>
        </article>
      } @empty {
        <div class="s-empty">
          <app-icon name="notificaciones" />
          <h3>Estás al día</h3>
          <p>Aquí recibirás los avisos de tu comunidad.</p>
        </div>
      }
    </section>
  `,
})
export class NotificacionesPage implements OnInit {
  protected store = inject(NotificacionesStore);
  private avisos = inject(AvisoService);
  readonly ocupado = signal(false);

  ngOnInit(): void {
    void this.store.cargar().catch((error: unknown) => this.avisos.error(leerError(error).mensaje));
  }

  async leerTodas(): Promise<void> {
    this.ocupado.set(true);
    try {
      await this.store.marcarLeidas();
      this.avisos.exito('Notificaciones marcadas como leídas.');
    } catch (error) {
      this.avisos.error(leerError(error).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
