import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { Pagina } from '../../core/models/domain';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';
import { PaginadorComponent } from '../../shared/paginador/paginador.component';
import { EditorPreguntaComponent, Pregunta, nuevaPregunta } from './editor-pregunta.component';

interface Curso {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  material: boolean;
  aprobada: boolean;
}
interface Evaluacion {
  id: string;
  titulo: string;
  version: string;
  preguntas: Pick<Pregunta, 'enunciado' | 'opciones'>[];
}
interface Resultado {
  aciertos: number;
  total: number;
  certificado: string | null;
}

@Component({
  selector: 'app-capacitaciones-page',
  imports: [CampoComponent, EditorPreguntaComponent, PaginadorComponent],
  templateUrl: './capacitaciones.page.html',
})
export class CapacitacionesPage implements OnInit {
  private http = inject(HttpClient);
  private avisos = inject(AvisoService);
  protected session = inject(SessionStore);
  readonly gestion = computed(() => ['ADMIN', 'GESTOR'].includes(this.session.rol() ?? ''));
  readonly datos = signal<Pagina<Curso> | null>(null);
  readonly error = signal('');
  readonly ocupado = signal(false);
  readonly formulario = signal(false);
  readonly editando = signal<string | null>(null);
  readonly titulo = signal('');
  readonly descripcion = signal('');
  readonly preguntas = signal<Pregunta[]>([]);
  readonly evaluacion = signal<Evaluacion | null>(null);
  readonly respuestas = signal<number[]>([]);
  readonly resultado = signal<Resultado | null>(null);

  ngOnInit(): void {
    void this.cargar(1);
  }

  async cargar(pagina = this.datos()?.pagina ?? 1): Promise<void> {
    try {
      this.datos.set(
        await firstValueFrom(
          this.http.get<Pagina<Curso>>('/api/capacitaciones', { params: { pagina } }),
        ),
      );
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    }
  }
  async abrir(c?: Curso): Promise<void> {
    try {
      const detalle = c
        ? await firstValueFrom(
            this.http.get<Evaluacion & { preguntas: Pregunta[] }>('/api/capacitaciones/' + c.id),
          )
        : null;
      this.editando.set(c?.id ?? null);
      this.titulo.set(c?.titulo ?? '');
      this.descripcion.set(c?.descripcion ?? '');
      this.preguntas.set(detalle?.preguntas ?? []);
      this.formulario.set(true);
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    }
  }
  agregar(): void {
    this.preguntas.update((p) => [...p, nuevaPregunta()]);
  }
  quitar(indice: number): void {
    this.preguntas.update((p) => p.filter((_, i) => i !== indice));
  }
  editar(indice: number, pregunta: Pregunta): void {
    this.preguntas.update((p) => p.map((x, i) => (i === indice ? pregunta : x)));
  }

  guardar(event: Event): void {
    event.preventDefault();
    const id = this.editando();
    const cuerpo = {
      titulo: this.titulo(),
      descripcion: this.descripcion(),
      preguntas: this.preguntas(),
    };
    void this.ejecutar(async () => {
      await firstValueFrom(
        id
          ? this.http.put('/api/capacitaciones/' + id, cuerpo)
          : this.http.post('/api/capacitaciones', cuerpo),
      );
      this.formulario.set(false);
      await this.cargar();
      this.avisos.exito('Guardamos la capacitación.');
    });
  }
  subir(id: string, archivo: File | null): void {
    if (!archivo || archivo.size > 50 * 1024 * 1024) {
      this.error.set('Selecciona un PDF o MP4 de hasta 50 MB.');
      return;
    }
    void this.ejecutar(async () => {
      await firstValueFrom(
        this.http.post('/api/capacitaciones/' + id + '/material', archivo, {
          headers: new HttpHeaders({ 'Content-Type': 'application/octet-stream' }),
        }),
      );
      await this.cargar();
      this.avisos.exito('Subimos el material.');
    });
  }
  cambiar(id: string, estado: 'ACTIVA' | 'INACTIVA'): void {
    void this.ejecutar(async () => {
      await firstValueFrom(this.http.patch('/api/capacitaciones/' + id + '/estado', { estado }));
      await this.cargar();
      this.avisos.exito('Actualizamos el estado.');
    });
  }
  rendir(id: string): void {
    void this.ejecutar(async () => {
      const e = await firstValueFrom(this.http.get<Evaluacion>('/api/capacitaciones/' + id));
      this.evaluacion.set(e);
      this.respuestas.set(e.preguntas.map(() => -1));
      this.resultado.set(null);
    });
  }
  marcar(i: number, opcion: number): void {
    this.respuestas.update((r) => r.map((x, j) => (j === i ? opcion : x)));
  }
  calificar(): void {
    const e = this.evaluacion();
    if (!e || this.respuestas().some((r) => r < 0)) {
      this.error.set('Responde todas las preguntas.');
      return;
    }
    void this.ejecutar(async () => {
      this.resultado.set(
        await firstValueFrom(
          this.http.post<Resultado>('/api/capacitaciones/' + e.id + '/evaluar', {
            version: e.version,
            respuestas: this.respuestas(),
          }),
        ),
      );
      await this.cargar();
    });
  }
  private async ejecutar(accion: () => Promise<void>): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      await accion();
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
