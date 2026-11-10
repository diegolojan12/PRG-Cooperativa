import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { leerError } from '../../core/http/api-error';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';
import { FidelizacionApi, Insignia, InsigniaDatos, Nivel } from './fidelizacion.api';

@Component({
  selector: 'app-gamificacion-page',
  imports: [CampoComponent],
  template: `
    <div class="s-page-heading">
      <div>
        <h1>Niveles e insignias</h1>
        <p>Define las metas de participación.</p>
      </div>
    </div>
    @if (error()) {
      <p role="alert">{{ error() }}</p>
    }
    <div class="s-settings-grid">
      <section class="s-card s-settings">
        <h2>Niveles</h2>
        <p>Configura de dos a diez niveles. El primero empieza en cero.</p>
        @for (n of niveles(); track $index; let i = $index) {
          <fieldset>
            <legend>Nivel {{ i + 1 }}</legend>
            <app-campo [para]="'nivelNombre-' + i" etiqueta="Nombre" ayuda="Ej. Conector.">
              <input
                [id]="'nivelNombre-' + i"
                [value]="n.nombre"
                (input)="editar(i, { nombre: $any($event.target).value })"
              />
            </app-campo>
            <app-campo
              [para]="'nivelUmbral-' + i"
              etiqueta="Umbral"
              ayuda="Puntos históricos necesarios."
            >
              <input
                [id]="'nivelUmbral-' + i"
                type="number"
                [value]="n.umbral"
                [readonly]="i === 0"
                (input)="editar(i, { umbral: $any($event.target).valueAsNumber })"
                min="0"
              />
            </app-campo>
            @if (i > 1) {
              <button type="button" class="s-secondary" (click)="quitar(i)">
                Quitar nivel {{ i + 1 }}
              </button>
            }
          </fieldset>
        }
        <div class="s-heading-actions">
          <button
            type="button"
            class="s-secondary"
            [disabled]="niveles().length < 2 || niveles().length >= 10"
            (click)="agregar()"
          >
            Agregar nivel
          </button>
          <button
            type="button"
            class="s-primary"
            [disabled]="ocupado() || niveles().length < 2"
            (click)="guardarNiveles()"
          >
            Guardar niveles
          </button>
        </div>
      </section>
      <section class="s-card s-settings">
        <h2>Insignias</h2>
        <form
          (submit)="
            crear($event, {
              nombre: nombre.value,
              imagen: imagen.value,
              actividad: actividad.value,
              meta: meta.valueAsNumber,
            })
          "
          novalidate
        >
          <app-campo para="insNombre" etiqueta="Nombre" ayuda="Ej. Primer referido.">
            <input #nombre id="insNombre" maxlength="80" aria-describedby="insNombre-ayuda" />
          </app-campo>
          <app-campo
            para="insImagen"
            etiqueta="Imagen"
            ayuda="URL HTTPS o ruta local de la imagen."
          >
            <input #imagen id="insImagen" maxlength="400" aria-describedby="insImagen-ayuda" />
          </app-campo>
          <app-campo
            para="insActividad"
            etiqueta="Tipo de logro"
            ayuda="Elige la actividad que se contabilizará."
          >
            <select #actividad id="insActividad" aria-describedby="insActividad-ayuda">
              @for (l of logros; track l.id) {
                <option [value]="l.id">{{ l.nombre }}</option>
              }
            </select>
          </app-campo>
          <app-campo para="insMeta" etiqueta="Meta" ayuda="Cantidad entera, como mínimo una.">
            <input
              #meta
              id="insMeta"
              type="number"
              value="1"
              min="1"
              aria-describedby="insMeta-ayuda"
            />
          </app-campo>
          <button type="submit" class="s-primary" [disabled]="ocupado()">Crear insignia</button>
        </form>
        <ul>
          @for (i of insignias(); track i.id) {
            <li>
              {{ i.nombre }} · {{ i.meta }} · {{ i.activa ? 'Activa' : 'Inactiva' }}
              @if (i.activa) {
                <button
                  type="button"
                  class="s-secondary"
                  [disabled]="ocupado()"
                  (click)="inactivar(i.id)"
                >
                  Inactivar {{ i.nombre }}
                </button>
              }
            </li>
          }
        </ul>
      </section>
    </div>
  `,
})
export class GamificacionPage implements OnInit {
  private api = inject(FidelizacionApi);
  private avisos = inject(AvisoService);
  readonly niveles = signal<Nivel[]>([]);
  readonly insignias = signal<Insignia[]>([]);
  readonly ocupado = signal(false);
  readonly error = signal('');
  readonly logros = [
    { id: 'REFERIDO', nombre: 'Referidos aprobados' },
    { id: 'CAPACITACION', nombre: 'Capacitaciones aprobadas' },
    { id: 'RETO', nombre: 'Retos cumplidos' },
    { id: 'TRIVIA', nombre: 'Partidas de trivia' },
    { id: 'TALLER', nombre: 'Talleres asistidos' },
  ];
  ngOnInit(): void {
    void firstValueFrom(this.api.niveles())
      .then((n) => this.niveles.set(n))
      .catch((e: unknown) => this.error.set(leerError(e).mensaje));
    void this.cargarInsignias().catch((e: unknown) => this.error.set(leerError(e).mensaje));
  }
  editar(i: number, cambio: Partial<Nivel>): void {
    this.niveles.update((niveles) => niveles.map((n, j) => (i === j ? { ...n, ...cambio } : n)));
  }
  quitar(i: number): void {
    this.niveles.update((niveles) => niveles.filter((_, j) => i !== j));
  }
  agregar(): void {
    this.niveles.update((niveles) => [
      ...niveles,
      { nombre: '', umbral: (niveles.at(-1)?.umbral ?? 0) + 100 },
    ]);
  }
  guardarNiveles(): void {
    void this.ejecutar(() => firstValueFrom(this.api.guardarNiveles(this.niveles())));
  }
  crear(event: Event, datos: InsigniaDatos): void {
    event.preventDefault();
    void this.ejecutar(async () => {
      await firstValueFrom(this.api.crearInsignia(datos));
      await this.cargarInsignias();
    });
  }
  inactivar(id: string): void {
    void this.ejecutar(async () => {
      await firstValueFrom(this.api.inactivarInsignia(id));
      await this.cargarInsignias();
    });
  }
  private async cargarInsignias(): Promise<void> {
    this.insignias.set(await firstValueFrom(this.api.insignias()));
  }
  private async ejecutar(accion: () => Promise<unknown>): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      await accion();
      this.avisos.exito('Guardamos los cambios.');
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
