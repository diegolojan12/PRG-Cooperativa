import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';
import { EditorPreguntaComponent, Pregunta, nuevaPregunta } from './editor-pregunta.component';

interface Banco extends Pregunta {
  id: string;
  tema: string;
  dificultad: string;
  activa: number;
}
interface Partida {
  id: string;
  numero: number;
  total: number;
  vence: string;
  estado: 'EN_CURSO' | 'COMPLETADA' | 'VENCIDA';
  pregunta?: Pick<Pregunta, 'enunciado' | 'opciones'>;
  aciertos?: number;
}

@Component({
  selector: 'app-juegos-page',
  imports: [CampoComponent, EditorPreguntaComponent],
  templateUrl: './juegos.page.html',
})
export class JuegosPage implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private avisos = inject(AvisoService);
  protected session = inject(SessionStore);
  readonly gestion = computed(() => ['ADMIN', 'GESTOR'].includes(this.session.rol() ?? ''));
  readonly banco = signal<Banco[]>([]);
  readonly editando = signal<Banco | null>(null);
  readonly editor = signal(false);
  readonly pregunta = signal(nuevaPregunta());
  readonly tema = signal('AHORRO');
  readonly dificultad = signal('BASICO');
  readonly filtro = signal('');
  readonly partida = signal<Partida | null>(null);
  readonly error = signal('');
  readonly ocupado = signal(false);
  readonly segundos = signal(0);
  readonly temas = ['AHORRO', 'CREDITO', 'PRESUPUESTO', 'INVERSION'];
  readonly dificultades = ['BASICO', 'INTERMEDIO', 'AVANZADO'];
  private reloj?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    if (this.gestion()) void this.cargarBanco();
    else this.reloj = setInterval(() => this.actualizarReloj(), 500);
  }
  ngOnDestroy(): void {
    clearInterval(this.reloj);
  }

  abrir(p?: Banco): void {
    this.editando.set(p ?? null);
    this.pregunta.set(
      p ? { enunciado: p.enunciado, opciones: p.opciones, correcta: p.correcta } : nuevaPregunta(),
    );
    this.tema.set(p?.tema ?? 'AHORRO');
    this.dificultad.set(p?.dificultad ?? 'BASICO');
    this.editor.set(true);
  }

  async cargarBanco(filtro = this.filtro()): Promise<void> {
    this.filtro.set(filtro);
    try {
      const preguntas = await firstValueFrom(
        this.http.get<Banco[]>('/api/trivia/preguntas', {
          params: filtro ? { dificultad: filtro } : {},
        }),
      );
      if (this.filtro() === filtro) this.banco.set(preguntas);
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    }
  }

  guardar(): void {
    const p = { ...this.pregunta(), tema: this.tema(), dificultad: this.dificultad() };
    const id = this.editando()?.id;
    void this.ejecutar(async () => {
      await firstValueFrom(
        id
          ? this.http.put('/api/trivia/preguntas/' + id, p)
          : this.http.post('/api/trivia/preguntas', p),
      );
      this.editor.set(false);
      await this.cargarBanco();
      this.avisos.exito('Guardamos la pregunta.');
    });
  }

  inactivar(id: string): void {
    void this.ejecutar(async () => {
      await firstValueFrom(this.http.patch('/api/trivia/preguntas/' + id + '/inactivar', {}));
      await this.cargarBanco();
      this.avisos.exito('La pregunta quedó inactiva.');
    });
  }

  iniciar(): void {
    void this.ejecutar(async () => {
      this.partida.set(await firstValueFrom(this.http.post<Partida>('/api/trivia/partidas', {})));
      this.actualizarReloj();
    });
  }

  responder(opcion: number | null): void {
    const p = this.partida();
    if (p?.estado !== 'EN_CURSO') return;
    void this.ejecutar(async () => {
      const r = await firstValueFrom(
        this.http.post<Partida>('/api/trivia/partidas/' + p.id + '/respuesta', {
          numero: p.numero,
          opcion,
        }),
      );
      this.partida.set(r);
      this.actualizarReloj();
      if (r.estado === 'COMPLETADA') this.avisos.exito('Terminaste la partida.');
    });
  }

  private actualizarReloj(): void {
    const p = this.partida();
    if (p?.estado !== 'EN_CURSO') return;
    const segundos = Math.max(0, Math.ceil((Date.parse(p.vence) - Date.now()) / 1000));
    this.segundos.set(segundos);
    if (!segundos && !this.ocupado()) this.responder(null);
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
