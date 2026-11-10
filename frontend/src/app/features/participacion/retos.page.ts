import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';

interface Reto {
  id: string;
  titulo: string;
  descripcion: string;
  actividad: string;
  meta: number;
  premio: number;
  inicio: string;
  fin: string;
  activo: number;
  porcentaje: number;
  inscrito: boolean;
}

@Component({
  selector: 'app-retos-page',
  imports: [CampoComponent],
  template: `
    <div class="s-page-heading">
      <div>
        <h1>Retos</h1>
        <p>Completa actividades y gana puntos.</p>
      </div>
    </div>
    @if (error()) {
      <p role="alert">{{ error() }}</p>
    }
    @if (session.esAdmin()) {
      <form
        class="s-card s-settings"
        (submit)="
          crear($event, {
            titulo: titulo.value,
            descripcion: descripcion.value,
            actividad: actividad.value,
            meta: meta.valueAsNumber,
            premio: premio.valueAsNumber,
            inicio: inicio.value,
            fin: fin.value,
          })
        "
        novalidate
      >
        <h2>Crear reto</h2>
        <app-campo para="retoTitulo" etiqueta="Título" ayuda="Hasta 100 caracteres."
          ><input #titulo id="retoTitulo" maxlength="100"
        /></app-campo>
        <app-campo
          para="retoDescripcion"
          etiqueta="Descripción"
          ayuda="Explica cómo se cumple el reto."
        >
          <textarea #descripcion id="retoDescripcion" maxlength="500"></textarea>
        </app-campo>
        <app-campo
          para="retoActividad"
          etiqueta="Actividad"
          ayuda="Se cuentan las actividades completadas después de unirse."
        >
          <select #actividad id="retoActividad">
            <option value="REFERIDO">Referidos aprobados</option>
            <option value="TRIVIA">Partidas de trivia</option>
            <option value="CAPACITACION">Capacitaciones aprobadas</option>
            <option value="TALLER">Asistencias a talleres</option>
          </select>
        </app-campo>
        <app-campo para="retoMeta" etiqueta="Meta" ayuda="Número entero de 1 a 1000."
          ><input #meta id="retoMeta" type="number" value="1" min="1" max="1000"
        /></app-campo>
        <app-campo para="retoPremio" etiqueta="Puntos de premio" ayuda="Número entero de 0 a 10000."
          ><input #premio id="retoPremio" type="number" value="100" min="0" max="10000"
        /></app-campo>
        <app-campo
          para="retoInicio"
          etiqueta="Fecha de inicio"
          ayuda="Primer día del reto en Ecuador."
          ><input #inicio id="retoInicio" type="date"
        /></app-campo>
        <app-campo para="retoFin" etiqueta="Fecha de fin" ayuda="Debe ser posterior al inicio."
          ><input #fin id="retoFin" type="date"
        /></app-campo>
        <button type="submit" class="s-primary" [disabled]="ocupado()">Guardar reto</button>
      </form>
    }
    <div class="s-quick-grid">
      @for (r of retos(); track r.id) {
        <article class="s-card s-settings">
          <h2>{{ r.titulo }}</h2>
          <p>{{ r.descripcion }}</p>
          <p>Meta {{ r.meta }} · Premio {{ r.premio }} puntos · Termina {{ r.fin }}</p>
          @if (session.esAdmin()) {
            @if (r.activo) {
              <button
                type="button"
                class="s-secondary"
                [disabled]="ocupado()"
                (click)="finalizar(r.id)"
              >
                Finalizar reto
              </button>
            } @else {
              <p>Finalizado</p>
            }
          } @else if (session.rol() === 'SOCIO') {
            @if (r.inscrito) {
              <progress
                [value]="r.porcentaje"
                max="100"
                [attr.aria-label]="'Avance de ' + r.titulo"
              ></progress>
              <p>{{ r.porcentaje }} %</p>
            } @else {
              <button
                type="button"
                class="s-primary"
                [disabled]="ocupado()"
                (click)="participar(r.id)"
              >
                Participar
              </button>
            }
          }
        </article>
      } @empty {
        <p>No hay retos disponibles.</p>
      }
    </div>
  `,
})
export class RetosPage implements OnInit {
  private http = inject(HttpClient);
  private avisos = inject(AvisoService);
  protected session = inject(SessionStore);
  readonly retos = signal<Reto[]>([]);
  readonly error = signal('');
  readonly ocupado = signal(false);
  ngOnInit(): void {
    void this.cargar().catch((e: unknown) => this.error.set(leerError(e).mensaje));
  }
  private async cargar(): Promise<void> {
    this.retos.set(await firstValueFrom(this.http.get<Reto[]>('/api/retos')));
  }
  crear(event: Event, datos: Omit<Reto, 'id' | 'activo' | 'inscrito' | 'porcentaje'>): void {
    event.preventDefault();
    void this.ejecutar(() => firstValueFrom(this.http.post('/api/retos', datos)));
  }
  finalizar(id: string): void {
    void this.ejecutar(() =>
      firstValueFrom(this.http.patch('/api/retos/' + id + '/finalizar', {})),
    );
  }
  participar(id: string): void {
    void this.ejecutar(() =>
      firstValueFrom(this.http.post('/api/retos/' + id + '/participar', {})),
    );
  }
  private async ejecutar(accion: () => Promise<unknown>): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      await accion();
      await this.cargar();
      this.avisos.exito('Guardamos el cambio en el reto.');
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
