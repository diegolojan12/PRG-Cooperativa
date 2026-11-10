import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';

type Asistencia = 'ASISTIO' | 'NO_ASISTIO';
interface Taller {
  id: string;
  titulo: string;
  descripcion: string;
  inicio: string;
  lugar: string;
  cupos: number;
  estado: string;
  inscripcion: string | null;
  asistencia: Asistencia | null;
  disponibles: number;
  puedeAnular: boolean;
}
interface Inscrito {
  id: number;
  nombre: string;
  asistencia: Asistencia | null;
}
const local = (fecha: string) => new Date(Date.parse(fecha) - 5 * 3_600_000).toISOString();

@Component({
  selector: 'app-talleres-page',
  imports: [DatePipe, ReactiveFormsModule, CampoComponent],
  templateUrl: './talleres.page.html',
})
export class TalleresPage implements OnInit {
  private http = inject(HttpClient);
  private avisos = inject(AvisoService);
  protected session = inject(SessionStore);
  private fb = inject(FormBuilder).nonNullable;
  readonly talleres = signal<Taller[]>([]);
  readonly grupos = computed(() => {
    const porMes = new Map<string, Taller[]>();
    for (const t of this.talleres()) {
      const mes = local(t.inicio).slice(0, 7);
      if (!porMes.has(mes)) porMes.set(mes, []);
      porMes.get(mes)?.push(t);
    }
    return [...porMes].map(([mes, items]) => ({ mes, items }));
  });
  readonly error = signal('');
  readonly ocupado = signal(false);
  readonly editando = signal<string | null>(null);
  readonly formulario = signal(false);
  readonly tallerAsistencia = signal<Taller | null>(null);
  readonly inscritos = signal<Inscrito[]>([]);
  readonly puedeGestionar = computed(() => ['GESTOR', 'ADMIN'].includes(this.session.rol() ?? ''));
  readonly form = this.fb.group({
    titulo: [''],
    descripcion: [''],
    inicio: [''],
    lugar: [''],
    cupos: [1],
  });

  ngOnInit(): void {
    void this.cargar().catch((e: unknown) => this.error.set(leerError(e).mensaje));
  }

  private async cargar(): Promise<void> {
    this.talleres.set(await firstValueFrom(this.http.get<Taller[]>('/api/talleres')));
  }

  abrir(t?: Taller): void {
    this.editando.set(t?.id ?? null);
    this.form.reset(
      t
        ? {
            titulo: t.titulo,
            descripcion: t.descripcion,
            inicio: local(t.inicio).slice(0, 16),
            lugar: t.lugar,
            cupos: t.cupos,
          }
        : {},
    );
    this.formulario.set(true);
  }

  guardar(): void {
    const id = this.editando();
    const v = this.form.getRawValue();
    const datos = { ...v, inicio: v.inicio ? v.inicio + ':00-05:00' : '' };
    void this.ejecutar(async () => {
      await firstValueFrom(
        id ? this.http.put('/api/talleres/' + id, datos) : this.http.post('/api/talleres', datos),
      );
      this.formulario.set(false);
    });
  }

  cambiar(t: Taller, accion: 'inscribir' | 'anular' | 'cancelar'): void {
    const url = '/api/talleres/' + t.id;
    void this.ejecutar(() =>
      firstValueFrom(
        accion === 'inscribir'
          ? this.http.post(url + '/inscripcion', {})
          : accion === 'anular'
            ? this.http.delete(url + '/inscripcion')
            : this.http.patch(url + '/cancelar', {}),
      ),
    );
  }

  async verAsistencia(t: Taller): Promise<void> {
    this.tallerAsistencia.set(t);
    this.inscritos.set([]);
    this.error.set('');
    try {
      await this.cargarInscritos(t.id);
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    }
  }

  marcar(taller: Taller, i: Inscrito, asistencia: Asistencia): void {
    void this.ejecutar(async () => {
      await firstValueFrom(
        this.http.patch('/api/talleres/' + taller.id + '/asistencia/' + i.id, { asistencia }),
      );
      await this.cargarInscritos(taller.id);
    });
  }

  private async cargarInscritos(id: string): Promise<void> {
    const filas = await firstValueFrom(
      this.http.get<Inscrito[]>('/api/talleres/' + id + '/asistencia'),
    );
    if (this.tallerAsistencia()?.id === id) this.inscritos.set(filas);
  }

  private async ejecutar(accion: () => Promise<unknown>): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      await accion();
      await this.cargar();
      this.avisos.exito('Guardamos el cambio en el taller.');
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
