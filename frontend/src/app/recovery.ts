import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api } from './api';
import { AuthPreview, passwordRules } from './auth-ui';

@Component({
  selector: 'suma-recovery',
  imports: [RouterLink, AuthPreview],
  templateUrl: '../internas/recuperar.html',
})
export class Recovery {
  private api = inject(Api);
  private router = inject(Router);
  private params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });

  token = computed(() => this.params().get('token'));
  devToken = signal<string | null>(null);
  message = signal('');
  busy = signal(false);
  finished = signal(false);

  async submit(event: Event, email: string, clave: string, confirmation: string) {
    event.preventDefault();
    if (this.busy() || this.finished()) return;

    this.clearNotice();
    const token = this.token();
    if (token && (clave !== confirmation || !passwordRules.every((rule) => rule.test(clave)))) {
      this.message.set(
        'Usa al menos 8 caracteres, una mayúscula y un número. Las contraseñas deben coincidir.',
      );
      return;
    }

    this.busy.set(true);
    try {
      const { message, devResetUrl } = await this.api.call<{
        message: string;
        devResetUrl?: string;
      }>(
        'POST',
        token ? '/auth/reset' : '/auth/forgot',
        token ? { token, clave } : { correo: email.trim() },
      );
      this.message.set(message);
      if (devResetUrl) {
        this.devToken.set(new URL(devResetUrl, window.location.origin).searchParams.get('token'));
      }
      if (token) {
        this.finished.set(true);
        await this.router.navigate(['/recuperar-contrasena'], { replaceUrl: true });
      }
    } catch (error) {
      this.message.set((error as Error).message);
    } finally {
      this.busy.set(false);
    }
  }

  clearNotice() {
    this.message.set('');
    this.devToken.set(null);
  }
}
