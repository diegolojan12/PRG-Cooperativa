import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { leerError } from '../../core/http/api-error';
import { PaginadorComponent } from '../../shared/paginador/paginador.component';
import { FidelizacionApi, PerfilPublico, Ranking, Saldo } from './fidelizacion.api';

@Component({
  selector: 'app-puntos-page',
  imports: [DatePipe, PaginadorComponent],
  template: `
    <div class="s-page-heading">
      <div>
        <h1>Mis puntos</h1>
        <p>Consulta tu saldo, nivel y movimientos.</p>
      </div>
    </div>
    @if (error()) {
      <p role="alert">{{ error() }}</p>
    }
    @if (saldo(); as s) {
      <section class="s-card s-settings">
        <h2>{{ s.saldo }} puntos disponibles</h2>
        <p>{{ s.acumulados }} puntos acumulados · Nivel {{ s.nivel.nombre }}</p>
        @if (s.nivel.siguiente) {
          <p>Te faltan {{ s.nivel.faltan }} puntos para {{ s.nivel.siguiente }}.</p>
        }
      </section>
      <section class="s-card s-table-card">
        <h2>Historial</h2>
        <div class="s-table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Actividad</th>
                <th scope="col">Puntos</th>
                <th scope="col">Fecha</th>
              </tr>
            </thead>
            <tbody>
              @for (m of s.items; track m.clave) {
                <tr>
                  <td>{{ m.actividad }}</td>
                  <td>{{ m.tipo === 'CREDITO' ? '+' : '−' }}{{ m.cantidad }}</td>
                  <td>{{ m.fecha | date: 'dd/MM/yyyy HH:mm' : '-0500' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3">Todavía no tienes movimientos.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-paginador
          [pagina]="s.pagina"
          [porPagina]="s.porPagina"
          [total]="s.total"
          (cambiar)="cargar($event)"
        />
      </section>
    }
    <section class="s-card s-settings">
      <h2>Ranking</h2>
      <ol>
        @for (r of ranking(); track r.id) {
          <li>
            <button type="button" class="s-secondary" (click)="abrir(r.id)">{{ r.nombre }}</button>
            {{ r.nivel }} · {{ r.puntos }} puntos
          </li>
        } @empty {
          <li>Todavía no hay perfiles públicos en la clasificación.</li>
        }
      </ol>
      @if (publico(); as p) {
        <h3>{{ p.nombre }} · {{ p.nivel }}</h3>
        @for (i of p.insignias; track i.id) {
          <p>
            <img [src]="i.imagen" alt="" width="36" height="36" referrerpolicy="no-referrer" />
            {{ i.nombre }}
          </p>
        }
        <button type="button" class="s-secondary" (click)="publico.set(null)">Cerrar perfil</button>
      }
    </section>
  `,
})
export class PuntosPage implements OnInit {
  private api = inject(FidelizacionApi);
  readonly error = signal('');
  readonly saldo = signal<Saldo | null>(null);
  readonly ranking = signal<Ranking[]>([]);
  readonly publico = signal<PerfilPublico | null>(null);
  private consulta = 0;

  ngOnInit(): void {
    void this.cargar(1);
    void firstValueFrom(this.api.ranking())
      .then((r) => this.ranking.set(r))
      .catch((e: unknown) => this.error.set(leerError(e).mensaje));
  }
  async cargar(pagina: number): Promise<void> {
    try {
      this.saldo.set(await firstValueFrom(this.api.puntos(pagina)));
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    }
  }
  async abrir(id: number): Promise<void> {
    const consulta = ++this.consulta;
    this.publico.set(null);
    try {
      const p = await firstValueFrom(this.api.publico(id));
      if (consulta === this.consulta) this.publico.set(p);
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    }
  }
}
