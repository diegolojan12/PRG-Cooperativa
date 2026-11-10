import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { Pagina } from '../../core/models/domain';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';
import { PaginadorComponent } from '../../shared/paginador/paginador.component';

type Estado = 'ABIERTA' | 'EN_ATENCION' | 'CERRADA';
interface Solicitud {
  codigo: string;
  descripcion: string;
  fecha: string;
  estado: Estado;
  respuesta: string | null;
  titular?: string;
}

@Component({
  selector: 'app-soporte-page',
  imports: [CampoComponent, DatePipe, PaginadorComponent],
  template: `
    <div class="s-page-heading">
      <div>
        <h1>Solicitudes de soporte</h1>
        <p>Consulta el estado y la respuesta desde tu bandeja.</p>
      </div>
    </div>
    @if (error()) {
      <p role="alert">{{ error() }}</p>
    }
    <form class="s-card s-settings" (submit)="crear($event, descripcion)" novalidate>
      <h2>Nueva solicitud</h2>
      <app-campo
        para="soporteDescripcion"
        etiqueta="Cuéntanos qué necesitas"
        ayuda="Hasta 1000 caracteres. Evita incluir contraseñas o números de cuenta."
      >
        <textarea
          #descripcion
          id="soporteDescripcion"
          maxlength="1000"
          aria-describedby="soporteDescripcion-ayuda"
        ></textarea>
      </app-campo>
      <button type="submit" class="s-primary" [disabled]="ocupado()">Enviar solicitud</button>
    </form>
    @if (datos(); as d) {
      <div class="s-quick-grid">
        @for (s of d.items; track s.codigo) {
          <article class="s-card s-settings">
            <h2>{{ s.codigo }} · {{ estados[s.estado] }}</h2>
            <p>
              {{ s.fecha | date: 'dd/MM/yyyy HH:mm' : '-0500' }}
              @if (s.titular) {
                · {{ s.titular }}
              }
            </p>
            <p>{{ s.descripcion }}</p>
            @if (s.respuesta) {
              <h3>Respuesta</h3>
              <p>{{ s.respuesta }}</p>
            }
            @if (session.esAdmin() && s.estado === 'ABIERTA') {
              <button
                type="button"
                class="s-secondary"
                [disabled]="ocupado()"
                (click)="cambiar(s.codigo, 'EN_ATENCION')"
              >
                Poner en atención
              </button>
            } @else if (session.esAdmin() && s.estado === 'EN_ATENCION') {
              <app-campo
                [para]="'respuesta-' + s.codigo"
                etiqueta="Respuesta de cierre"
                ayuda="Escribe la única respuesta, de hasta 1000 caracteres."
              >
                <textarea #respuesta [id]="'respuesta-' + s.codigo" maxlength="1000"></textarea>
              </app-campo>
              <button
                type="button"
                class="s-primary"
                [disabled]="ocupado()"
                (click)="cambiar(s.codigo, 'CERRADA', respuesta.value)"
              >
                Responder y cerrar
              </button>
            }
          </article>
        } @empty {
          <p>Todavía no hay solicitudes.</p>
        }
      </div>
      <app-paginador
        [pagina]="d.pagina"
        [porPagina]="d.porPagina"
        [total]="d.total"
        (cambiar)="cargar($event)"
      />
    }
  `,
})
export class SoportePage implements OnInit {
  private http = inject(HttpClient);
  private avisos = inject(AvisoService);
  protected session = inject(SessionStore);
  readonly datos = signal<Pagina<Solicitud> | null>(null);
  readonly ocupado = signal(false);
  readonly error = signal('');
  readonly estados = { ABIERTA: 'Abierta', EN_ATENCION: 'En atención', CERRADA: 'Cerrada' };
  ngOnInit(): void {
    void this.cargar();
  }
  async cargar(pagina = 1): Promise<void> {
    try {
      this.datos.set(
        await firstValueFrom(
          this.http.get<Pagina<Solicitud>>('/api/soporte', { params: { pagina } }),
        ),
      );
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    }
  }
  crear(event: Event, texto: HTMLTextAreaElement): void {
    event.preventDefault();
    void this.ejecutar(async () => {
      const r = await firstValueFrom(
        this.http.post<{ codigo: string }>('/api/soporte', { descripcion: texto.value }),
      );
      texto.value = '';
      this.avisos.exito('Solicitud registrada · ' + r.codigo);
    });
  }
  cambiar(codigo: string, estado: Estado, respuesta = ''): void {
    void this.ejecutar(async () => {
      await firstValueFrom(this.http.patch('/api/soporte/' + codigo, { estado, respuesta }));
      this.avisos.exito('Actualizamos la solicitud.');
    });
  }
  private async ejecutar(accion: () => Promise<void>): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      await accion();
      await this.cargar();
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
