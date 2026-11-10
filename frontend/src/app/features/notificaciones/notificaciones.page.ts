import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { leerError } from '../../core/http/api-error';
import { AvisoService } from '../../core/ui/aviso.service';
import { PaginadorComponent } from '../../shared/paginador/paginador.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { NotificacionesStore } from './notificaciones.store';

@Component({
  selector: 'app-notificaciones-page',
  imports: [DatePipe, IconComponent, PaginadorComponent],
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
                <button
                  type="button"
                  class="s-secondary"
                  (click)="leer(note.id)"
                  [disabled]="ocupado()"
                >
                  Marcar como leída
                </button>
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
    @let d = store.bandeja();
    <app-paginador
      [pagina]="d.pagina"
      [total]="d.total"
      [porPagina]="d.porPagina"
      (cambiar)="cargar($event)"
    />
  `,
})
export class NotificacionesPage implements OnInit {
  protected store = inject(NotificacionesStore);
  private avisos = inject(AvisoService);
  readonly ocupado = signal(false);

  ngOnInit(): void {
    this.cargar(1);
  }
  cargar(pagina: number): void {
    void this.store
      .cargar(pagina)
      .catch((error: unknown) => this.avisos.error(leerError(error).mensaje));
  }
  async leer(id: number): Promise<void> {
    this.ocupado.set(true);
    try {
      await this.store.marcarLeida(id);
      this.avisos.exito('Notificación marcada como leída.');
    } catch (error) {
      this.avisos.error(leerError(error).mensaje);
    } finally {
      this.ocupado.set(false);
    }
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
