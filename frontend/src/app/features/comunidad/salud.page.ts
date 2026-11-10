import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';

interface Contenido {
  id: string;
  tipo: string;
  categoria: string | null;
  titulo: string;
  descripcion: string;
  fecha: string;
  estado: string;
}
interface Catalogo {
  categorias: string[];
  articulos: Contenido[];
  servicios: Contenido[];
}

@Component({
  selector: 'app-salud-page',
  imports: [CampoComponent, DatePipe, ReactiveFormsModule],
  template: `
    <div class="s-page-heading">
      <div>
        <h1>Salud y bienestar</h1>
        <p>Consulta artículos y servicios de la Cooperativa.</p>
      </div>
      @if (gestion()) {
        <button type="button" class="s-primary" (click)="abrir()">Nuevo contenido</button>
      }
    </div>
    @if (error()) {
      <p role="alert">{{ error() }}</p>
    }
    @if (formulario()) {
      <form class="s-card s-settings" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
        <h2>{{ editando() ? 'Editar contenido' : 'Nuevo contenido' }}</h2>
        <app-campo para="saludTipo" etiqueta="Tipo" ayuda="Elige artículo o servicio.">
          <select id="saludTipo" formControlName="tipo">
            <option value="ARTICULO">Artículo</option>
            <option value="SERVICIO">Servicio</option>
          </select>
        </app-campo>
        @if (form.controls.tipo.value === 'ARTICULO') {
          <app-campo
            para="saludCategoria"
            etiqueta="Categoría"
            ayuda="Elige una categoría para el artículo."
          >
            <select id="saludCategoria" formControlName="categoria">
              @for (c of catalogo()?.categorias ?? []; track c) {
                <option [value]="c">{{ etiqueta(c) }}</option>
              }
            </select>
          </app-campo>
        }
        <app-campo para="saludTitulo" etiqueta="Título" ayuda="Hasta 100 caracteres."
          ><input id="saludTitulo" formControlName="titulo" maxlength="100"
        /></app-campo>
        <app-campo para="saludDescripcion" etiqueta="Contenido" ayuda="Hasta 2000 caracteres.">
          <textarea id="saludDescripcion" formControlName="descripcion" maxlength="2000"></textarea>
        </app-campo>
        <button type="submit" class="s-primary" [disabled]="ocupado()">Guardar contenido</button>
        <button type="button" class="s-secondary" (click)="formulario.set(false)">Cancelar</button>
      </form>
    }
    @if (catalogo(); as d) {
      @for (seccion of [d.articulos, d.servicios]; track $index; let i = $index) {
        <section>
          <h2>{{ i === 0 ? 'Artículos' : 'Servicios' }}</h2>
          <div class="s-quick-grid">
            @for (c of seccion; track c.id) {
              <article class="s-card s-settings">
                <h3>{{ c.titulo }}</h3>
                <p>
                  {{ etiqueta(c.categoria ?? 'SERVICIO') }} ·
                  {{ c.fecha | date: 'dd/MM/yyyy' : '-0500' }}
                </p>
                <p style="white-space: pre-wrap">{{ c.descripcion }}</p>
                @if (gestion()) {
                  <p>{{ c.estado }}</p>
                  <button type="button" class="s-secondary" (click)="abrir(c)">Editar</button>
                  <button
                    type="button"
                    class="s-primary"
                    [disabled]="ocupado()"
                    (click)="cambiar(c)"
                  >
                    {{ c.estado === 'BORRADOR' ? 'Publicar' : 'Pasar a borrador' }}
                  </button>
                }
              </article>
            } @empty {
              <p>No hay contenido en esta sección.</p>
            }
          </div>
        </section>
      }
    }
  `,
})
export class SaludPage implements OnInit {
  private http = inject(HttpClient);
  private avisos = inject(AvisoService);
  private sesion = inject(SessionStore);
  private fb = inject(FormBuilder).nonNullable;
  readonly gestion = computed(() => ['ADMIN', 'GESTOR'].includes(this.sesion.rol() ?? ''));
  readonly catalogo = signal<Catalogo | null>(null);
  readonly ocupado = signal(false);
  readonly error = signal('');
  readonly editando = signal<string | null>(null);
  readonly formulario = signal(false);
  readonly form = this.fb.group({
    tipo: ['ARTICULO'],
    categoria: ['NUTRICION'],
    titulo: [''],
    descripcion: [''],
  });
  ngOnInit(): void {
    void this.cargar();
  }
  etiqueta(categoria: string): string {
    const etiquetas: Record<string, string> = {
      NUTRICION: 'Nutrición',
      ACTIVIDAD_FISICA: 'Actividad física',
      SALUD_MENTAL: 'Salud mental',
      PREVENCION: 'Prevención',
      SERVICIO: 'Servicio',
    };
    return etiquetas[categoria] ?? categoria;
  }
  abrir(c?: Contenido): void {
    this.editando.set(c?.id ?? null);
    this.form.reset(c ? { ...c, categoria: c.categoria ?? 'NUTRICION' } : {});
    this.formulario.set(true);
  }
  guardar(): void {
    const id = this.editando(),
      datos = this.form.getRawValue();
    void this.ejecutar(async () => {
      await firstValueFrom(
        id ? this.http.put('/api/salud/' + id, datos) : this.http.post('/api/salud', datos),
      );
      this.formulario.set(false);
    });
  }
  cambiar(c: Contenido): void {
    const estado = c.estado === 'BORRADOR' ? 'PUBLICADO' : 'BORRADOR';
    void this.ejecutar(() =>
      firstValueFrom(this.http.patch('/api/salud/' + c.id + '/estado', { estado })),
    );
  }
  private async cargar(): Promise<void> {
    try {
      this.catalogo.set(await firstValueFrom(this.http.get<Catalogo>('/api/salud')));
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    }
  }
  private async ejecutar(accion: () => Promise<unknown>): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      await accion();
      await this.cargar();
      this.avisos.exito('Guardamos el contenido.');
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
