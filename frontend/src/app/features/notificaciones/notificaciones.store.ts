import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { EstadoReferido, Notificacion, Pagina } from '../../core/models/domain';

type Bandeja = Pagina<Notificacion> & {
  sinLeer: number;
  cuentaEstado?: EstadoReferido | null;
  cuentaVerificada?: boolean;
};
const VACIA: Bandeja = { items: [], total: 0, pagina: 1, porPagina: 20, sinLeer: 0 };

@Injectable({ providedIn: 'root' })
export class NotificacionesStore {
  private http = inject(HttpClient);
  private sesion = inject(SessionStore);
  private consulta = 0;
  readonly bandeja = signal(VACIA);
  readonly lista = computed(() => this.bandeja().items);
  readonly sinLeer = computed(() => this.bandeja().sinLeer);

  async cargar(pagina = this.bandeja().pagina): Promise<void> {
    const consulta = ++this.consulta;
    const bandeja = await firstValueFrom(
      this.http.get<Bandeja>('/api/notificaciones/bandeja', { params: { pagina } }),
    );
    if (consulta !== this.consulta) return;
    this.bandeja.set(bandeja);
    if (bandeja.cuentaEstado !== undefined) {
      this.sesion.usuario.update((u) =>
        u && u.cuentaEstado !== bandeja.cuentaEstado
          ? { ...u, cuentaEstado: bandeja.cuentaEstado, cuentaVerificada: bandeja.cuentaVerificada }
          : u,
      );
    }
  }
  async marcarLeida(id: number): Promise<void> {
    await firstValueFrom(this.http.patch('/api/notificaciones/' + id + '/leer', {}));
    await this.cargar();
  }
  async marcarLeidas(): Promise<void> {
    await firstValueFrom(this.http.patch('/api/notificaciones/leer', {}));
    await this.cargar();
  }
  /**
   * HU-020 / RF-39: consulta la bandeja cada 3 s mientras la pestaña está visible, para que el
   * cambio de estado de un referido o de la cuenta vinculada llegue en máximo 5 s.
   * La consulta no renueva la sesión (el servidor la atiende sin extender la inactividad).
   */
  sondear(destruccion: DestroyRef, cadaMs = 3_000): void {
    let disponible = true;
    let cargando = false;
    const actualizar = () => {
      if (!disponible || cargando || document.hidden) return;
      cargando = true;
      void this.cargar()
        .catch((error: unknown) => {
          if ([401, 403].includes(leerError(error).status)) disponible = false;
        })
        .finally(() => (cargando = false));
    };
    actualizar();
    const refresco = setInterval(actualizar, cadaMs);
    document.addEventListener('visibilitychange', actualizar);
    destruccion.onDestroy(() => {
      clearInterval(refresco);
      document.removeEventListener('visibilitychange', actualizar);
      this.limpiar();
    });
  }
  limpiar(): void {
    this.consulta++;
    this.bandeja.set(VACIA);
  }
}
