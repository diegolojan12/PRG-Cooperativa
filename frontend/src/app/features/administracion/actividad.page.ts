import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { leerError } from '../../core/http/api-error';
import { Actividad, OpcionesActividad, Pagina } from '../../core/models/domain';
import { CampoComponent } from '../../shared/campo/campo.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { PaginadorComponent } from '../../shared/paginador/paginador.component';
import { AdministracionApi, FiltroActividad } from './administracion.api';

/** RF-42-2: filtros por rango de fechas, usuario y tipo de acción; 50 registros por página. */
@Component({
  selector: 'app-actividad-page',
  imports: [DatePipe, CampoComponent, IconComponent, PaginadorComponent],
  templateUrl: './actividad.page.html',
})
export class ActividadPage implements OnInit {
  private api = inject(AdministracionApi);
  readonly filtros = signal<FiltroActividad>({
    pagina: 1,
    desde: '',
    hasta: '',
    usuarioId: '',
    accion: '',
  });
  readonly datos = signal<Pagina<Actividad> | null>(null);
  readonly opciones = signal<OpcionesActividad>({ usuarios: [], acciones: [] });
  readonly cargando = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    void this.cargar();
    void firstValueFrom(this.api.opcionesActividad())
      .then((o) => this.opciones.set(o))
      .catch(() => null);
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      this.datos.set(await firstValueFrom(this.api.actividad(this.filtros())));
    } catch (error) {
      this.error.set(leerError(error).mensaje);
    } finally {
      this.cargando.set(false);
    }
  }
  filtrar(cambio: Partial<FiltroActividad>): void {
    this.filtros.update((f) => ({ ...f, ...cambio, pagina: cambio.pagina ?? 1 }));
    void this.cargar();
  }
  limpiar(): void {
    this.filtrar({ desde: '', hasta: '', usuarioId: '', accion: '' });
  }

  /** Muestra cambios estructurados (valor anterior → nuevo, rol nuevo, motivo). */
  cambio(a: Actividad): string {
    const d = a.datos ?? {};
    if ('anterior' in d && 'nuevo' in d && !Array.isArray(d['nuevo']))
      return `${String(d['anterior'] ?? '—')} → ${String(d['nuevo'])}`;
    if ('rolNuevo' in d)
      return `Rol nuevo: ${String(d['rolNuevo'])}${'rolAnterior' in d ? ` (antes ${String(d['rolAnterior'])})` : ''}`;
    if ('motivo' in d) return `Motivo: ${String(d['motivo'])}`;
    return '';
  }
}
