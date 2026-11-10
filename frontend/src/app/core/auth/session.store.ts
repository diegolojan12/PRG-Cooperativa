import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Modulo, Rol, Usuario } from '../models/domain';

/** Punto único del usuario autenticado (A4): menú, guards, 2FA e inactividad leen de aquí. */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private http = inject(HttpClient);
  private pendiente: Promise<Usuario | null> | null = null;

  readonly usuario = signal<Usuario | null>(null);
  readonly autenticado = computed(() => this.usuario() !== null);
  readonly rol = computed<Rol | null>(() => this.usuario()?.rol ?? null);
  readonly esAdmin = computed(() => this.rol() === 'ADMIN');

  puede(modulo: Modulo): boolean {
    return this.usuario()?.modulos.includes(modulo) ?? false;
  }

  /** Carga el usuario una sola vez aunque varios guards lo pidan a la vez. */
  async cargar(): Promise<Usuario | null> {
    if (this.usuario()) return this.usuario();
    this.pendiente ??= firstValueFrom(this.http.get<Usuario>('/api/auth/me'))
      .then((usuario) => {
        this.usuario.set(usuario);
        return usuario;
      })
      .catch(() => {
        this.usuario.set(null);
        return null;
      })
      .finally(() => (this.pendiente = null));
    return this.pendiente;
  }

  /** Vuelve a leer permisos tras cambiarlos en Roles. */
  async refrescar(): Promise<Usuario | null> {
    try {
      this.usuario.set(await firstValueFrom(this.http.get<Usuario>('/api/auth/me')));
    } catch {
      this.usuario.set(null);
    }
    return this.usuario();
  }

  limpiar(): void {
    this.usuario.set(null);
  }
}
