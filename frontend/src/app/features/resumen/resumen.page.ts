import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { ESTADOS, ETIQUETAS_ESTADO, Referido, Resumen } from '../../core/models/domain';
import { IconComponent } from '../../shared/icon/icon.component';
import { InvitacionComponent } from '../referidos/invitacion.component';
import { ReferidosApi } from '../referidos/referidos.api';

/** Resumen del socio y del gestor de contenidos (el administrador usa TableroPage). */
@Component({
  selector: 'app-resumen-page',
  imports: [DecimalPipe, RouterLink, IconComponent, InvitacionComponent],
  templateUrl: './resumen.page.html',
})
export class ResumenPage implements OnInit {
  private http = inject(HttpClient);
  private referidosApi = inject(ReferidosApi);
  protected session = inject(SessionStore);

  readonly cargando = signal(true);
  readonly error = signal('');
  readonly resumen = signal<Resumen | null>(null);
  readonly recientes = signal<Referido[]>([]);
  readonly estados = ESTADOS;
  readonly etiquetas = ETIQUETAS_ESTADO;
  readonly fecha = new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'full',
    timeZone: 'America/Guayaquil',
  }).format(new Date());
  readonly nombre = computed(() => this.session.usuario()?.nombre.split(' ')[0] ?? '');
  readonly accesos = [
    { id: 'referidos', label: 'Referidos', icon: 'referidos' },
    { id: 'retos', label: 'Retos', icon: 'gift' },
    { id: 'juegos', label: 'Juegos', icon: 'game' },
    { id: 'talleres', label: 'Talleres', icon: 'book' },
    { id: 'capacitaciones', label: 'Capacitaciones', icon: 'book' },
    { id: 'puntos', label: 'Mis puntos', icon: 'points' },
  ];

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const [resumen, refs] = await Promise.all([
        firstValueFrom(this.http.get<Resumen>('/api/overview')),
        this.session.puede('referidos')
          ? firstValueFrom(this.referidosApi.listar({ pagina: 1 }))
          : Promise.resolve(null),
      ]);
      this.resumen.set(resumen);
      this.recientes.set(refs?.items.slice(0, 4) ?? []);
    } catch (error) {
      this.error.set(leerError(error).mensaje);
    } finally {
      this.cargando.set(false);
    }
  }
}
