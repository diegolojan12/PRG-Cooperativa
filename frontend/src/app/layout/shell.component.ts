import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, firstValueFrom, map } from 'rxjs';
import { AuthApi } from '../core/auth/auth.api';
import { InactividadService } from '../core/auth/inactividad.service';
import { SessionStore } from '../core/auth/session.store';
import { leerError } from '../core/http/api-error';
import { ETIQUETAS_ROL } from '../core/models/domain';
import { AvisoService } from '../core/ui/aviso.service';
import { NotificacionesStore } from '../features/notificaciones/notificaciones.store';
import { IconComponent } from '../shared/icon/icon.component';
import { ModalComponent } from '../shared/modal/modal.component';
import { FUNCIONES, NAVEGACION } from './navegacion';

const tituloDe = (snapshot: ActivatedRouteSnapshot): string => {
  let route: ActivatedRouteSnapshot | null = snapshot;
  let titulo = 'Mi comunidad';
  while (route) {
    titulo = (route.data['titulo'] as string | undefined) ?? titulo;
    route = route.firstChild;
  }
  return titulo;
};

/** Menú por rol, barra superior y <router-outlet> de las páginas del panel (G19). */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, ModalComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  private router = inject(Router);
  private auth = inject(AuthApi);
  private avisos = inject(AvisoService);
  protected session = inject(SessionStore);
  protected notificaciones = inject(NotificacionesStore);

  readonly contenido = viewChild.required<ElementRef<HTMLElement>>('content');
  readonly menuAbierto = signal(false);
  readonly confirmarSalida = signal(false);
  readonly saliendo = signal(false);
  readonly etiquetasRol = ETIQUETAS_ROL;
  readonly anio = new Date().getFullYear();

  readonly titulo = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => tituloDe(this.router.routerState.snapshot.root)),
    ),
    { initialValue: tituloDe(this.router.routerState.snapshot.root) },
  );
  readonly menu = computed(() => NAVEGACION.filter((item) => this.session.puede(item.id)));
  readonly funciones = computed(() => {
    const rol = this.session.rol();
    return rol
      ? FUNCIONES.filter(
          (m) => m.roles.includes(rol) && (!m.permiso || this.session.puede(m.permiso)),
        )
      : [];
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
      .subscribe(() => this.menuAbierto.set(false));
    if (this.session.puede('notificaciones')) {
      let disponible = true;
      let cargando = false;
      const actualizar = () => {
        if (!disponible || cargando || document.hidden) return;
        cargando = true;
        void this.notificaciones
          .cargar()
          .catch((error: unknown) => {
            if ([401, 403].includes(leerError(error).status)) disponible = false;
          })
          .finally(() => (cargando = false));
      };
      actualizar();
      const refresco = setInterval(actualizar, 3_000);
      document.addEventListener('visibilitychange', actualizar);
      destruccion.onDestroy(() => {
        clearInterval(refresco);
        document.removeEventListener('visibilitychange', actualizar);
        this.notificaciones.limpiar();
      });
    }
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
