import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../core/auth/auth.api';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { Desafio2fa, Usuario, requiere2fa } from '../../core/models/domain';
import { AvisoService } from '../../core/ui/aviso.service';
import { emailPattern, toggle } from '../../shared/validacion';
import { AuthPreviewComponent } from './auth-preview.component';

@Component({
  selector: 'app-login-page',
  imports: [DatePipe, RouterLink, AuthPreviewComponent],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private auth = inject(AuthApi);
  private session = inject(SessionStore);
  private router = inject(Router);
  private avisos = inject(AvisoService);
  private params = inject(ActivatedRoute).snapshot.queryParamMap;

  /** Solo se informa "inactividad" cuando realmente había una sesión (A3). */
  readonly inactividad = signal(this.params.get('motivo') === 'inactividad');
  readonly bloqueadoHasta = signal<string | null>(null);
  readonly desafio = signal<Desafio2fa | null>(null);
  readonly showPassword = signal(false);
  readonly invalidEmail = signal(false);
  readonly invalidPassword = signal(false);
  readonly invalidCode = signal<string | null>(null);
  readonly busy = signal(false);
  readonly toggle = toggle;

  constructor() {
    if (this.params.has('registered'))
      this.avisos.exito('¡Cuenta creada! Ya puedes iniciar sesión.');
  }

  async submit(event: Event, email: string, clave: string): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    const correo = email.trim();
    this.invalidEmail.set(!emailPattern.test(correo));
    this.invalidPassword.set(clave.length < 8);
    if (this.invalidEmail() || this.invalidPassword()) return;

    this.busy.set(true);
    this.bloqueadoHasta.set(null);
    try {
      const respuesta = await firstValueFrom(this.auth.login(correo, clave));
      if ('requiereConfirmacion' in respuesta) {
        await this.router.navigate(['/confirmar-correo'], { state: { confirmacion: respuesta } });
        return;
      }
      if (requiere2fa(respuesta)) {
        this.desafio.set(respuesta);
        return;
      }
      await this.entrar(respuesta);
    } catch (error) {
      const e = leerError(error);
      if (e.status === 423) this.bloqueadoHasta.set(e.bloqueadoHasta ?? new Date().toISOString());
      else this.avisos.error(e.mensaje);
    } finally {
      this.busy.set(false);
    }
  }

  async verificar(event: Event, codigo: string): Promise<void> {
    event.preventDefault();
    const desafio = this.desafio();
    if (this.busy() || !desafio) return;
    const limpio = codigo.replace(/\s/g, '');
    if (!/^\d{6}$/.test(limpio)) {
      this.invalidCode.set('Escribe los 6 dígitos que enviamos a tu correo, por ejemplo 482913.');
      return;
    }
    this.invalidCode.set(null);
    this.busy.set(true);
    try {
      await this.entrar(await firstValueFrom(this.auth.verificar2fa(desafio.desafioId, limpio)));
    } catch (error) {
      const e = leerError(error);
      this.invalidCode.set(e.campos['codigo'] ?? e.mensaje);
    } finally {
      this.busy.set(false);
    }
  }

  volver(): void {
    this.desafio.set(null);
    this.invalidCode.set(null);
  }

  private async entrar(usuario: Usuario): Promise<void> {
    this.session.usuario.set(usuario);
    await this.router.navigate(['/panel']);
  }
}
