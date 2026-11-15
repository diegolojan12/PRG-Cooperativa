import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { Resumen } from '../../core/models/domain';
import { AvisoService } from '../../core/ui/aviso.service';
import { ContarDirective } from '../../shared/contador/contar.directive';
import { IconComponent } from '../../shared/icon/icon.component';
import {
  EVENTOS,
  PUBLICACIONES_EJEMPLO,
  PublicacionEjemplo,
  TipoPublicacion,
} from './contenido-ejemplo';
import { InvitacionComponent } from '../referidos/invitacion.component';

interface Publicacion extends PublicacionEjemplo {
  meGusta: boolean;
  guardada: boolean;
  abierta: boolean;
}

/**
 * Inicio de la comunidad (rol con experiencia COMUNIDAD): historias de programas,
 * publicaciones con reacciones y comentarios, y un resumen real del socio.
 * Las publicaciones son de ejemplo hasta el módulo Comunidad (ver contenido-ejemplo.ts).
 */
@Component({
  selector: 'app-feed-page',
  imports: [RouterLink, IconComponent, DecimalPipe, ContarDirective, InvitacionComponent],
  templateUrl: './feed.page.html',
})
export class FeedPage implements OnInit {
  private http = inject(HttpClient);
  private avisos = inject(AvisoService);
  protected session = inject(SessionStore);

  readonly nombre = computed(() => this.session.usuario()?.nombre.split(' ')[0] ?? '');
  readonly iniciales = computed(
    () =>
      this.session
        .usuario()
        ?.nombre.split(' ')
        .map((x) => x[0])
        .slice(0, 2)
        .join('') ?? '',
  );
  readonly resumen = signal<Resumen | null>(null);
  readonly filtro = signal<'todo' | TipoPublicacion>('todo');
  readonly publicaciones = signal<Publicacion[]>(
    PUBLICACIONES_EJEMPLO.map((p) => ({
      ...p,
      comentarios: [...p.comentarios],
      meGusta: false,
      guardada: false,
      abierta: false,
    })),
  );
  readonly visibles = computed(() =>
    this.publicaciones().filter((p) => this.filtro() === 'todo' || p.tipo === this.filtro()),
  );
  readonly eventos = EVENTOS;
  readonly filtros = [
    { id: 'todo', etiqueta: 'Para ti' },
    { id: 'anuncio', etiqueta: 'Anuncios' },
    { id: 'programa', etiqueta: 'Programas' },
    { id: 'reto', etiqueta: 'Retos' },
  ] as const;
  /** Porcentaje de referidos aprobados sobre el total (dato real del socio). */
  readonly avance = computed(() => {
    const r = this.resumen();
    return r && r.referidos ? Math.round((r.estados.APROBADO / r.referidos) * 100) : 0;
  });

  /** HU-047: el socio escribe y comparte publicaciones. Por ahora solo en esta vista previa (no se guarda). */
  readonly borrador = signal('');
  readonly redactando = signal(false);
  readonly maximo = 500;
  publicar(): void {
    const texto = this.borrador().trim().slice(0, this.maximo);
    if (!texto) return;
    const usuario = this.session.usuario();
    this.publicaciones.update((lista) => [
      {
        id: Date.now(),
        autor: usuario?.nombre ?? 'Tú',
        rol: usuario?.rolNombre ?? 'Socio',
        tipo: 'comunidad',
        etiqueta: 'Comunidad',
        tiempo: 'Ahora',
        titulo: '',
        texto,
        likes: 0,
        comentarios: [],
        meGusta: false,
        guardada: false,
        abierta: false,
      },
      ...lista,
    ]);
    this.borrador.set('');
    this.redactando.set(false);
    this.avisos.exito('Publicación compartida en la vista previa de la comunidad.');
  }

  private cuadro = 0;
  /** Parallax suave del encabezado: guarda la posición del puntero como variables CSS (solo transform). */
  moverHeroe(evento: PointerEvent, el: HTMLElement): void {
    if (evento.pointerType !== 'mouse') return;
    cancelAnimationFrame(this.cuadro);
    this.cuadro = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', String(((evento.clientX - r.left) / r.width - 0.5) * 2));
      el.style.setProperty('--my', String(((evento.clientY - r.top) / r.height - 0.5) * 2));
    });
  }
  soltarHeroe(el: HTMLElement): void {
    el.style.setProperty('--mx', '0');
    el.style.setProperty('--my', '0');
  }

  ngOnInit(): void {
    firstValueFrom(this.http.get<Resumen>('/api/overview'))
      .then((r) => this.resumen.set(r))
      .catch(() => null);
  }

  private cambiar(id: number, cambio: (p: Publicacion) => Publicacion): void {
    this.publicaciones.update((lista) => lista.map((p) => (p.id === id ? cambio(p) : p)));
  }
  alternarLike(id: number): void {
    this.cambiar(id, (p) => ({
      ...p,
      meGusta: !p.meGusta,
      likes: p.likes + (p.meGusta ? -1 : 1),
    }));
  }
  alternarComentarios(id: number): void {
    this.cambiar(id, (p) => ({ ...p, abierta: !p.abierta }));
  }
  guardar(id: number): void {
    this.cambiar(id, (p) => ({ ...p, guardada: !p.guardada }));
  }
  comentar(id: number, campo: HTMLInputElement): void {
    const texto = campo.value.trim().slice(0, 280);
    if (!texto) return;
    const autor = this.session.usuario()?.nombre.split(' ')[0] ?? 'Tú';
    this.cambiar(id, (p) => ({ ...p, comentarios: [...p.comentarios, { autor, texto }] }));
    campo.value = '';
  }
  async compartir(titulo: string): Promise<void> {
    try {
      await navigator.clipboard?.writeText(`${titulo} · ${location.origin}`);
      this.avisos.exito('Enlace copiado. ¡Compártelo con quien quieras!');
    } catch {
      this.avisos.error('No pudimos copiar el enlace en este navegador.');
    }
  }
}
