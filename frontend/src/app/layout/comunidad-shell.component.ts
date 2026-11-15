import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../core/auth/auth.api';
import { InactividadService } from '../core/auth/inactividad.service';
import { SessionStore } from '../core/auth/session.store';
import { leerError } from '../core/http/api-error';
import { AvisoService } from '../core/ui/aviso.service';
import { NotificacionesStore } from '../features/notificaciones/notificaciones.store';
import { IconComponent } from '../shared/icon/icon.component';
import { ModalComponent } from '../shared/modal/modal.component';

/** Módulos que se muestran como pestañas en la barra inferior del móvil, en este orden de preferencia. */
const PESTANAS = ['panel', 'aprende', 'juegos', 'retos'];

/**
 * Experiencia de comunidad (rol con interfaz COMUNIDAD, HU-002): navegación estilo red social.
 * El menú sale de los permisos del rol; aquí no se conoce ningún rol por nombre.
 */
@Component({
  selector: 'app-comunidad-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, ModalComponent],
  templateUrl: './comunidad-shell.component.html',
})
export class ComunidadShellComponent {
  private router = inject(Router);
  private auth = inject(AuthApi);
  private avisos = inject(AvisoService);
  protected session = inject(SessionStore);
  protected notificaciones = inject(NotificacionesStore);

  readonly contenido = viewChild.required<ElementRef<HTMLElement>>('content');
  readonly confirmarSalida = signal(false);
  /** RF-49-4: en pantallas pequeñas el menú completo se despliega desde "Más". */
  readonly masAbierto = signal(false);
  readonly saliendo = signal(false);
  readonly anio = new Date().getFullYear();

  readonly menu = computed(() =>
    this.session.menu().filter((m) => m.id !== 'notificaciones' && m.id !== 'ayuda'),
  );
  readonly utilidades = computed(() =>
    this.session.menu().filter((m) => m.id === 'notificaciones' || m.id === 'ayuda'),
  );
  readonly pestanas = computed(() => {
    const permitidos = this.session.menu().filter((m) => m.disponible || PESTANAS.includes(m.id));
    return PESTANAS.map((id) => permitidos.find((m) => m.id === id))
      .filter((m): m is NonNullable<typeof m> => !!m)
      .slice(0, 4);
  });
  readonly iniciales = computed(
    () =>
      this.session
        .usuario()
        ?.nombre.split(' ')
        .map((x) => x[0])
        .slice(0, 2)
        .join('') ?? '',
  );

  constructor() {
    const inactividad = inject(InactividadService);
    inactividad.iniciar();
    const destruccion = inject(DestroyRef);
    destruccion.onDestroy(() => inactividad.detener());
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.masAbierto.set(false));
    if (this.session.puede('notificaciones')) this.notificaciones.sondear(destruccion);
  }

  ruta(id: string): string {
    return id === 'panel' ? '/panel' : '/panel/' + id;
  }

  saltarAlContenido(event: Event): void {
    event.preventDefault();
    this.contenido().nativeElement.focus();
  }

  async salir(): Promise<void> {
    if (this.saliendo()) return;
    this.saliendo.set(true);
    try {
      await firstValueFrom(this.auth.logout());
      this.session.limpiar();
      this.notificaciones.limpiar();
      await this.router.navigate(['/iniciar-sesion']);
    } catch (error) {
      this.avisos.error(leerError(error).mensaje);
    } finally {
      this.saliendo.set(false);
      this.confirmarSalida.set(false);
    }
  }
}
