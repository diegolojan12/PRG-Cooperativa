import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionStore } from './session.store';

/**
 * RF-04-3: el servidor invalida la sesión tras 15 min sin acciones; el cliente
 * redirige a tiempo. El temporizador se comparte entre pestañas para que una
 * pestaña inactiva no cierre la sesión de otra activa.
 */
@Injectable({ providedIn: 'root' })
export class InactividadService {
  static readonly LIMITE_MS = 15 * 60_000;
  private readonly eventos = ['pointerdown', 'keydown', 'scroll'] as const;
  private canal: BroadcastChannel | null = null;
  private timer?: ReturnType<typeof setTimeout>;
  private router = inject(Router);
  private session = inject(SessionStore);

  private readonly programar = () => {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.expirar(), InactividadService.LIMITE_MS);
  };
  private readonly actividad = () => {
    this.canal?.postMessage('actividad');
    this.programar();
  };

  iniciar(): void {
    this.detener();
    if (typeof BroadcastChannel !== 'undefined') {
      this.canal = new BroadcastChannel('cpjl-actividad');
      this.canal.onmessage = this.programar;
    }
    this.eventos.forEach((e) =>
      document.addEventListener(e, this.actividad, { passive: true, capture: true }),
    );
    this.programar();
  }

  detener(): void {
    clearTimeout(this.timer);
    this.eventos.forEach((e) => document.removeEventListener(e, this.actividad, true));
    this.canal?.close();
    this.canal = null;
  }

  private async expirar(): Promise<void> {
    this.detener();
    this.session.limpiar();
    await this.router.navigate(['/iniciar-sesion'], { queryParams: { motivo: 'inactividad' } });
  }
}
