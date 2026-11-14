import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../core/auth/auth.api';
import { leerError } from '../../core/http/api-error';
import { emailPattern, passwordRules } from '../../shared/validacion';
import { AuthPreviewComponent } from './auth-preview.component';

@Component({
  selector: 'app-recuperar-page',
  imports: [RouterLink, AuthPreviewComponent],
  templateUrl: './recuperar.page.html',
})
export class RecuperarPage {
  private auth = inject(AuthApi);
  private router = inject(Router);
  private params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });

  readonly token = computed(() => this.params().get('token'));
  readonly devToken = signal<string | null>(null);
  readonly message = signal('');
  readonly failed = signal(false);
  readonly busy = signal(false);
  readonly finished = signal(false);
  /** RF-49-2: errores por campo con causa y corrección. */
  readonly errors = signal<Record<'correo' | 'clave' | 'confirmar', string | null>>({
    correo: null,
    clave: null,
    confirmar: null,
  });
  readonly rules = passwordRules;

  async submit(event: Event, email: string, clave: string, confirmation: string): Promise<void> {
    event.preventDefault();
    if (this.busy() || this.finished()) return;
    this.clearNotice();
    const token = this.token();
    const errors = {
      correo:
        !token && !emailPattern.test(email.trim())
          ? 'El correo está incompleto. Escríbelo completo, por ejemplo nombre@correo.com.'
          : null,
      clave:
        token && !passwordRules.every((rule) => rule.test(clave))
          ? 'Agrega lo que falta: mínimo 8 caracteres, una mayúscula y un número.'
          : null,
      confirmar:
        token && clave !== confirmation
          ? 'No coincide con la nueva contraseña. Escríbela otra vez exactamente igual.'
          : null,
    };
    this.errors.set(errors);
    if (errors.correo || errors.clave || errors.confirmar) return;

    this.busy.set(true);
    try {
      const respuesta = await firstValueFrom(
        token ? this.auth.restablecer(token, clave) : this.auth.olvido(email.trim()),
      );
      this.message.set(respuesta.message);
      const devResetUrl = (respuesta as { devResetUrl?: string }).devResetUrl;
      if (devResetUrl) {
        this.devToken.set(new URL(devResetUrl, window.location.origin).searchParams.get('token'));
      }
      if (token) {
        this.finished.set(true);
        await this.router.navigate(['/recuperar-contrasena'], { replaceUrl: true });
      }
    } catch (error) {
      this.failed.set(true);
      this.message.set(leerError(error).mensaje);
    } finally {
      this.busy.set(false);
    }
  }

  clearNotice(): void {
    this.message.set('');
    this.failed.set(false);
    this.devToken.set(null);
  }
}
