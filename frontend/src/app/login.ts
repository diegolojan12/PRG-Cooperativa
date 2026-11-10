import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api } from './api';
import { AuthNotice, AuthPreview, emailPattern, toggle } from './auth-ui';

@Component({
  selector: 'suma-login',
  imports: [RouterLink, AuthNotice, AuthPreview],
  templateUrl: '../internas/iniciar-sesion.html',
})
export class Login {
  private api = inject(Api);
  private router = inject(Router);
  private params = inject(ActivatedRoute).snapshot.queryParamMap;

  expired = signal(this.params.has('expired'));
  message = signal(
    this.params.has('registered') ? '¡Cuenta creada! Ya puedes iniciar sesión.' : '',
  );
  success = signal(this.params.has('registered'));
  showPassword = signal(false);
  invalidEmail = signal(false);
  invalidPassword = signal(false);
  busy = signal(false);
  toggle = toggle;

  async submit(event: Event, email: string, clave: string) {
    event.preventDefault();
    if (this.busy()) return;

    const correo = email.trim();
    this.success.set(false);
    this.invalidEmail.set(!emailPattern.test(correo));
    this.invalidPassword.set(clave.length < 8);
    if (this.invalidEmail() || this.invalidPassword()) {
      this.message.set('Revisa los campos marcados antes de continuar.');
      return;
    }

    this.busy.set(true);
    this.message.set('');
    try {
      await this.api.call('POST', '/auth/login', { correo, clave });
      await this.router.navigate(['/panel']);
    } catch (error) {
      this.message.set((error as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
