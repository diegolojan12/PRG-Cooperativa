import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Notificacion } from '../../core/models/domain';

/** Las notificaciones se cargan una vez por sesión, no en cada navegación (A7). */
@Injectable({ providedIn: 'root' })
export class NotificacionesStore {
  private http = inject(HttpClient);
  readonly lista = signal<Notificacion[]>([]);
  readonly sinLeer = computed(() => this.lista().filter((n) => !n.leida).length);

  async cargar(): Promise<void> {
    this.lista.set(await firstValueFrom(this.http.get<Notificacion[]>('/api/notificaciones')));
  }
  async marcarLeidas(): Promise<void> {
    await firstValueFrom(this.http.patch('/api/notificaciones/leer', {}));
    this.lista.update((notas) => notas.map((n) => ({ ...n, leida: true })));
  }
  limpiar(): void {
    this.lista.set([]);
  }
}
