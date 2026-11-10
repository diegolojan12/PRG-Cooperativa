import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { Pagina } from '../../core/models/domain';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { PaginadorComponent } from '../../shared/paginador/paginador.component';

type Tipo = 'PUBLICACION' | 'COMENTARIO';
interface Publicacion {
  id: string;
  texto: string;
  autor: string;
  fecha: string;
  oficial: number;
  fijadaHasta: string | null;
  imagen: number;
  propia: number;
  reacciones: number;
  meGusta: boolean;
}
interface Comentario {
  id: string;
  texto: string;
  autor: string;
  fecha: string;
  propio: number;
}
interface Moderacion {
  id: string;
  tipo: Tipo;
  texto: string;
  estado: string;
  reportes: number;
}

@Component({
  selector: 'app-comunidad-page',
  imports: [DatePipe, CampoComponent, ModalComponent, PaginadorComponent],
  templateUrl: './comunidad.page.html',
})
export class ComunidadPage implements OnInit {
  private http = inject(HttpClient);
  private avisos = inject(AvisoService);
  protected session = inject(SessionStore);
  readonly datos = signal<Pagina<Publicacion> | null>(null);
  readonly moderacion = signal<Pagina<Moderacion> | null>(null);
  readonly abierto = signal<string | null>(null);
  readonly comentarios = signal<Comentario[]>([]);
  readonly error = signal('');
  readonly ocupado = signal(false);
  readonly editando = signal<string | null>(null);
  readonly texto = signal('');
  readonly reportando = signal<{ tipo: Tipo; id: string } | null>(null);
  readonly motivos = [
    { id: 'OFENSIVO', nombre: 'Ofensivo' },
    { id: 'SPAM', nombre: 'Spam' },
    { id: 'FALSO', nombre: 'Falso' },
    { id: 'OTRO', nombre: 'Otro' },
  ];
  private foto?: File;
  readonly ahora = () => new Date().toISOString();

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(pagina = 1): Promise<void> {
    try {
      const d = await firstValueFrom(
        this.http.get<Pagina<Publicacion>>('/api/comunidad', { params: { pagina } }),
      );
      this.datos.set(d);
      if (!d.items.some((p) => p.id === this.abierto())) this.abierto.set(null);
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    }
  }
  editar(p: Publicacion): void {
    this.editando.set(p.id);
    this.texto.set(p.texto);
    this.foto = undefined;
  }
  seleccionar(archivo: File | null): void {
    this.foto = archivo ?? undefined;
  }
  limpiar(): void {
    this.editando.set(null);
    this.texto.set('');
    this.foto = undefined;
  }
  guardar(event: Event, inputFoto: HTMLInputElement): void {
    event.preventDefault();
    const id = this.editando(),
      foto = this.foto;
    if (foto && (foto.size > 2 * 1024 * 1024 || !['image/png', 'image/jpeg'].includes(foto.type))) {
      this.error.set('La imagen debe ser JPG o PNG y pesar hasta 2 MB.');
      return;
    }
    void this.ejecutar(async () => {
      const datos = { texto: this.texto() };
      const destino =
        id ?? (await firstValueFrom(this.http.post<{ id: string }>('/api/comunidad', datos))).id;
      if (id) await firstValueFrom(this.http.patch('/api/comunidad/' + id, datos));
      if (foto) {
        this.editando.set(destino);
        await firstValueFrom(
          this.http.post('/api/comunidad/' + destino + '/imagen', foto, {
            headers: new HttpHeaders({ 'Content-Type': 'application/octet-stream' }),
          }),
        );
      }
      inputFoto.value = '';
      this.limpiar();
    });
  }
  reaccion(p: Publicacion): void {
    void this.ejecutar(() =>
      firstValueFrom(this.http.put('/api/comunidad/' + p.id + '/reaccion', { activa: !p.meGusta })),
    );
  }
  async abrirComentarios(id: string): Promise<void> {
    if (this.abierto() === id) {
      this.abierto.set(null);
      return;
    }
    this.comentarios.set([]);
    this.abierto.set(id);
    try {
      await this.cargarComentarios(id);
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    }
  }
  comentar(event: Event, id: string, entrada: HTMLInputElement): void {
    event.preventDefault();
    void this.ejecutar(async () => {
      await firstValueFrom(
        this.http.post('/api/comunidad/' + id + '/comentarios', { texto: entrada.value }),
      );
      entrada.value = '';
    });
  }
  borrar(tipo: Tipo, id: string): void {
    const url = tipo === 'PUBLICACION' ? '/api/comunidad/' : '/api/comunidad/comentarios/';
    void this.ejecutar(() => firstValueFrom(this.http.delete(url + id)));
  }
  fijar(id: string, dias: number | null): void {
    void this.ejecutar(() =>
      firstValueFrom(this.http.patch('/api/comunidad/' + id + '/fijar', { dias })),
    );
  }
  reportar(motivo: string): void {
    const reporte = this.reportando();
    if (!reporte) return;
    void this.ejecutar(async () => {
      await firstValueFrom(this.http.post('/api/comunidad/reportes', { ...reporte, motivo }));
      this.reportando.set(null);
    });
  }
  async cargarModeracion(pagina = 1): Promise<void> {
    try {
      this.moderacion.set(
        await firstValueFrom(
          this.http.get<Pagina<Moderacion>>('/api/comunidad/moderacion', { params: { pagina } }),
        ),
      );
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    }
  }
  moderar(c: Moderacion, accion: 'ocultar' | 'restaurar' | 'eliminar'): void {
    void this.ejecutar(async () => {
      await firstValueFrom(
        this.http.patch('/api/comunidad/moderacion/' + c.tipo + '/' + c.id, { accion }),
      );
      await this.cargarModeracion(this.moderacion()?.pagina ?? 1);
    });
  }
  private async cargarComentarios(id: string): Promise<void> {
    const filas = await firstValueFrom(
      this.http.get<Comentario[]>('/api/comunidad/' + id + '/comentarios'),
    );
    if (this.abierto() === id) this.comentarios.set(filas);
  }
  private async ejecutar(accion: () => Promise<unknown>): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      await accion();
      await this.cargar(this.datos()?.pagina ?? 1);
      const id = this.abierto();
      if (id) await this.cargarComentarios(id);
      this.avisos.exito('Guardamos los cambios en la comunidad.');
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
