import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { ESTADOS, ETIQUETAS_ESTADO, Tablero } from '../../core/models/domain';
import { IconComponent } from '../../shared/icon/icon.component';

const ICONOS: Record<string, string> = {
  referidos: 'referidos',
  aprobados: 'check',
  activos: 'usuarios',
  otorgados: 'points',
  canjeados: 'gift',
  talleres: 'book',
};

/** HU-005 / RF-45-1: tablero exclusivo de administración con los 6 indicadores. */
@Component({
  selector: 'app-tablero-page',
  imports: [DatePipe, DecimalPipe, RouterLink, IconComponent],
  templateUrl: './tablero.page.html',
})
export class TableroPage implements OnInit {
  private http = inject(HttpClient);
  protected session = inject(SessionStore);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly tablero = signal<Tablero | null>(null);
  readonly estados = ESTADOS;
  readonly etiquetas = ETIQUETAS_ESTADO;
  readonly iconos = ICONOS;

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      this.tablero.set(await firstValueFrom(this.http.get<Tablero>('/api/indicadores')));
    } catch (error) {
      this.error.set(leerError(error).mensaje);
    } finally {
      this.cargando.set(false);
    }
  }

  total(t: Tablero): number {
    return this.estados.reduce((sum, s) => sum + t.estados[s], 0);
  }
}
