import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../core/auth/auth.api';
import { leerError } from '../../core/http/api-error';
import { DesafioConfirmacion } from '../../core/models/domain';
import { AvisoService } from '../../core/ui/aviso.service';
import { AuthPreviewComponent } from './auth-preview.component';

@Component({
  selector: 'app-confirmar-correo-page',
  imports: [RouterLink, AuthPreviewComponent],
  template: `
    <div class="authLayout">
      <section class="authLado">
        <div class="authCard">
          <h1>Confirma tu correo</h1>
          @if (desafio) {
            <p>Ingresa el código enviado a {{ desafio.destino }}. Vence en 10 minutos.</p>
            @if (devCodigo(); as demo) {
              <p class="nota">
                Código de prueba <strong data-testid="codigo-confirmacion">{{ demo }}</strong>
              </p>
            }
            <form (submit)="confirmar($event, codigo.value)" novalidate>
              <div class="campo" [class.error]="!!error()">
                <label for="confirmacionCodigo">Código de confirmación</label>
                <input
                  #codigo
                  id="confirmacionCodigo"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  maxlength="6"
                  aria-describedby="ayudaConfirmacion errorConfirmacion"
                  [attr.aria-invalid]="!!error()"
                />
                <span id="ayudaConfirmacion" class="ayuda"
                  >Escribe los seis dígitos del correo.</span
                >
                <span id="errorConfirmacion" class="msgError" role="alert">{{ error() }}</span>
              </div>
              <div class="accionesPaso">
                <button
                  type="button"
                  class="btnOutline"
                  (click)="reenviar()"
                  [disabled]="ocupado()"
                >
                  Reenviar código
                </button>
                <button type="submit" class="btnPrimario btnBtn" [disabled]="ocupado()">
                  Confirmar correo
                </button>
              </div>
            </form>
          } @else {
            <p>Inicia sesión con tu correo y contraseña para retomar la confirmación.</p>
          }
          <a routerLink="/iniciar-sesion">Volver a iniciar sesión</a>
        </div>
      </section>
      <app-auth-preview />
    </div>
  `,
})
export class ConfirmarCorreoPage {
  private auth = inject(AuthApi);
  private router = inject(Router);
  private avisos = inject(AvisoService);
  readonly desafio = (inject(Location).getState() as { confirmacion?: DesafioConfirmacion } | null)
    ?.confirmacion;
  readonly devCodigo = signal(this.desafio?.devCodigo);
  readonly ocupado = signal(false);
  readonly error = signal('');

  async confirmar(event: Event, codigo: string): Promise<void> {
    event.preventDefault();
    if (this.ocupado() || !this.desafio) return;
    if (!/^\d{6}$/.test(codigo.trim())) {
      this.error.set('Escribe exactamente seis dígitos.');
      return;
    }
    this.ocupado.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.auth.confirmarCorreo(this.desafio.token, codigo.trim()));
      await this.router.navigate(['/iniciar-sesion'], {
        replaceUrl: true,
        queryParams: { registered: '1' },
      });
    } catch (error) {
      this.error.set(leerError(error).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }

  async reenviar(): Promise<void> {
    if (this.ocupado() || !this.desafio) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      const respuesta = await firstValueFrom(this.auth.reenviarConfirmacion(this.desafio.token));
      this.devCodigo.set(respuesta.devCodigo);
      this.avisos.exito('Enviamos un nuevo código de confirmación.');
    } catch (error) {
      this.error.set(leerError(error).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
