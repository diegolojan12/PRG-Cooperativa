import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../core/auth/auth.api';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { ETIQUETAS_ESTADO, EstadoReferido } from '../../core/models/domain';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';

@Component({
  selector: 'app-mi-cuenta-page',
  imports: [ReactiveFormsModule, CampoComponent],
  template: `
    <div class="s-page-heading"><h1>Mi cuenta de la Cooperativa</h1></div>
    <section class="s-card s-settings">
      @if (error()) {
        <p role="alert">{{ error() }}</p>
      }
      @if (cargando()) {
        <p role="status">Consultando tu cuenta…</p>
      } @else {
        @if (cuenta(); as c) {
          <p>{{ c.tipo === 'ahorros' ? 'Ahorros' : 'Corriente' }} · {{ estados[c.estado] }}</p>
          <p>
            Número de cuenta <strong>{{ c.numero }}</strong>
          </p>
          <div class="s-heading-actions">
            <button
              type="button"
              class="s-secondary"
              (click)="cargar(!visible())"
              [disabled]="ocupado()"
            >
              {{ visible() ? 'Ocultar número' : 'Mostrar número' }}
            </button>
            <button type="button" class="s-secondary" (click)="cargar()" [disabled]="ocupado()">
              Actualizar estado
            </button>
          </div>
        }
        @if (cargada() && (!cuenta() || cuenta()?.estado === 'RECHAZADO')) {
          <form [formGroup]="form" (ngSubmit)="vincular()" novalidate>
            <h2>Vincular mi cuenta</h2>
            <app-campo
              para="tipoCuentaVinculada"
              etiqueta="Tipo de cuenta"
              ayuda="Elige Ahorros o Corriente."
            >
              <select
                id="tipoCuentaVinculada"
                formControlName="tipoCuenta"
                aria-describedby="tipoCuentaVinculada-ayuda"
              >
                <option value="ahorros">Ahorros</option>
                <option value="corriente">Corriente</option>
              </select>
            </app-campo>
            <app-campo
              para="numeroCuentaVinculada"
              etiqueta="Número de cuenta"
              ayuda="Ingresa exactamente 10 dígitos. Ej. 2100123456."
              [requerido]="true"
              [error]="errorNumero() || null"
            >
              <input
                id="numeroCuentaVinculada"
                formControlName="cuenta"
                inputmode="numeric"
                maxlength="10"
                aria-describedby="numeroCuentaVinculada-ayuda numeroCuentaVinculada-error"
                [attr.aria-invalid]="!!errorNumero()"
              />
            </app-campo>
            <button type="submit" class="s-primary" [disabled]="ocupado()">
              Solicitar vinculación
            </button>
          </form>
        } @else if (!cargada()) {
          <button type="button" class="s-secondary" (click)="cargar()">Volver a intentar</button>
        }
      }
    </section>
  `,
})
export class MiCuentaPage implements OnInit {
  private auth = inject(AuthApi);
  private avisos = inject(AvisoService);
  private sesion = inject(SessionStore);
  private fb = inject(FormBuilder).nonNullable;

  readonly estados = ETIQUETAS_ESTADO;
  readonly cuenta = signal<{ numero: string; tipo: string; estado: EstadoReferido } | null>(null);
  readonly cargada = signal(false);
  readonly cargando = signal(false);
  readonly visible = signal(false);
  readonly ocupado = signal(false);
  readonly error = signal('');
  readonly errorNumero = signal('');
  readonly form = this.fb.group({
    tipoCuenta: ['ahorros'],
    cuenta: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(mostrar = false): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const cuenta = await firstValueFrom(this.auth.cuentaVinculada(mostrar));
      this.cuenta.set(cuenta);
      this.visible.set(mostrar);
      this.cargada.set(true);
      this.sesion.usuario.update(
        (u) =>
          u && {
            ...u,
            cuentaEstado: cuenta?.estado ?? null,
            cuentaVerificada: cuenta?.estado === 'APROBADO',
          },
      );
    } catch (error) {
      this.error.set(leerError(error).mensaje);
    } finally {
      this.cargando.set(false);
    }
  }

  async vincular(): Promise<void> {
    if (this.ocupado()) return;
    this.error.set('');
    this.errorNumero.set(this.form.invalid ? 'Ingresa exactamente 10 dígitos.' : '');
    if (this.form.invalid) return;
    this.ocupado.set(true);
    try {
      await firstValueFrom(this.auth.vincularCuenta(this.form.getRawValue()));
      this.form.reset();
      this.avisos.exito('Tu cuenta quedó pendiente de verificación.');
      await this.cargar();
    } catch (error) {
      const e = leerError(error);
      this.errorNumero.set(e.campos['cuenta'] ?? '');
      this.error.set(e.mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
