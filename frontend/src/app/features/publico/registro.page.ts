import { ViewportScroller } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../core/auth/auth.api';
import { leerError } from '../../core/http/api-error';
import { AvisoService } from '../../core/ui/aviso.service';
import { celularPattern, emailPattern, passwordRules, toggle } from '../../shared/validacion';
import { AuthPreviewComponent } from './auth-preview.component';

/** Campos del formulario que el servidor puede marcar con error. */
const CAMPO_SERVIDOR: Record<string, string> = {
  nombre: 'nombre',
  correo: 'correo',
  celular: 'celular',
  cuenta: 'numCuenta',
  clave: 'clave',
};
const PASO_DE: Record<string, number> = {
  nombre: 1,
  correo: 1,
  celular: 1,
  numCuenta: 2,
  clave: 3,
};

@Component({
  selector: 'app-registro-page',
  imports: [RouterLink, AuthPreviewComponent],
  templateUrl: './registro.page.html',
})
export class RegistroPage {
  private auth = inject(AuthApi);
  private router = inject(Router);
  private viewport = inject(ViewportScroller);
  private avisos = inject(AvisoService);
  private identity = { nombre: '', correo: '', celular: '' };
  private cuenta = '';

  readonly steps = ['Tus datos', 'Tu cuenta', 'Crea tu acceso'];
  readonly step = signal(1);
  readonly progress = computed(() => Math.round((this.step() / this.steps.length) * 100));
  readonly linked = signal<boolean | null>(null);
  readonly errors = signal<string[]>([]);
  readonly busy = signal(false);
  readonly password = signal('');
  readonly showPassword = signal(false);
  readonly rules = passwordRules;
  readonly strength = computed(
    () => this.rules.filter((rule) => rule.test(this.password())).length,
  );
  readonly toggle = toggle;

  goTo(step: number): void {
    this.errors.set([]);
    this.step.set(step);
    this.viewport.scrollToPosition([0, 0]);
  }

  continueIdentity(name: string, email: string, phone: string): void {
    const nombre = name.trim();
    const correo = email.trim();
    const celular = phone.trim();
    const errors: string[] = [];
    if (nombre.length < 5 || nombre.split(/\s+/).length < 2) errors.push('nombre');
    if (!emailPattern.test(correo)) errors.push('correo');
    if (!celularPattern.test(celular)) errors.push('celular');
    if (errors.length) return this.showErrors(errors);
    this.identity = { nombre, correo, celular };
    this.goTo(2);
  }

  chooseAccount(linked: boolean): void {
    this.linked.set(linked);
    this.errors.set([]);
  }

  /** La Visión v1.1.0 no pide cédula; la cuenta vinculada tiene 10 dígitos (HU-015). */
  continueAccount(account: string): void {
    if (this.linked() === null) return this.showErrors(['account']);
    if (this.linked()) {
      const cuenta = account.trim();
      if (!/^\d{10}$/.test(cuenta)) return this.showErrors(['numCuenta']);
      this.cuenta = cuenta;
    }
    this.goTo(3);
  }

  async submit(
    clave: string,
    confirmation: string,
    accepted: boolean,
    tipoCuenta: string,
  ): Promise<void> {
    if (this.busy()) return;
    const errors: string[] = [];
    if (!this.rules.every((rule) => rule.test(clave))) errors.push('clave');
    if (!confirmation || confirmation !== clave) errors.push('clave2');
    if (!accepted) errors.push('terms');
    if (errors.length) return this.showErrors(errors);

    this.errors.set([]);
    this.busy.set(true);
    try {
      const cuenta = this.linked()
        ? { cuenta: this.cuenta, tipoCuenta: tipoCuenta as 'ahorros' | 'corriente' }
        : {};
      await firstValueFrom(this.auth.registrar({ ...this.identity, ...cuenta, clave }));
      await this.router.navigate(['/iniciar-sesion'], { queryParams: { registered: '1' } });
    } catch (error) {
      const e = leerError(error);
      const campos = Object.keys(e.campos)
        .map((c) => CAMPO_SERVIDOR[c])
        .filter(Boolean);
      if (campos.length) {
        this.step.set(Math.min(...campos.map((c) => PASO_DE[c])));
        this.errors.set(campos);
      }
      this.avisos.error(e.mensaje);
    } finally {
      this.busy.set(false);
    }
  }

  private showErrors(errors: string[]): void {
    this.errors.set(errors);
    this.avisos.error('Revisa los campos marcados: debajo de cada uno se indica cómo corregirlo.');
  }
}
