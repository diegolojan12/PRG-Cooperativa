import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { ESTADOS, ETIQUETAS_ESTADO, Tablero } from '../../core/models/domain';
import { CampoComponent } from '../../shared/campo/campo.component';
import { AvisoService } from '../../core/ui/aviso.service';
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
  imports: [DatePipe, DecimalPipe, RouterLink, IconComponent, CampoComponent],
  templateUrl: './tablero.page.html',
})
export class TableroPage implements OnInit {
  private http = inject(HttpClient);
  private avisos = inject(AvisoService);
  readonly exportando = signal(false);
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

  async exportarReferidos(event: Event, desde: string, hasta: string): Promise<void> {
    event.preventDefault();
    if (this.exportando()) return;
    if (!desde || !hasta || desde > hasta) {
      this.avisos.error('Elige un rango válido de hasta doce meses.');
      return;
    }
    this.exportando.set(true);
    try {
      const archivo = await firstValueFrom(
        this.http.get('/api/reportes/referidos', {
          params: { desde, hasta },
          responseType: 'blob',
        }),
      );
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = 'SUMA-conversion-referidos.csv';
      enlace.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      this.avisos.exito('Reporte descargado.');
    } catch {
      this.avisos.error('No se pudo exportar. Verifica que el rango sea de hasta doce meses.');
    } finally {
      this.exportando.set(false);
    }
  }

  total(t: Tablero): number {
    return this.estados.reduce((sum, s) => sum + t.estados[s], 0);
  }
}
