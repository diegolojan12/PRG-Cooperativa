import { ViewportScroller } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Api } from './api';
import { AuthNotice, AuthPreview, emailPattern, passwordRules, toggle } from './auth-ui';

@Component({
  selector: 'suma-register',
  imports: [RouterLink, AuthNotice, AuthPreview],
  templateUrl: '../internas/registro.html',
})
export class Register {
  private api = inject(Api);
  private router = inject(Router);
  private viewport = inject(ViewportScroller);
  private identity = { nombre: '', correo: '', celular: '' };
  private account = { cuenta: '', cedula: '' };

  steps = ['Tus datos', 'Tu cuenta', 'Crea tu acceso'];
  step = signal(1);
  progress = computed(() => Math.round((this.step() / this.steps.length) * 100));
  linked = signal<boolean | null>(null);
  errors = signal<string[]>([]);
  message = signal('');
  busy = signal(false);
  password = signal('');
  showPassword = signal(false);
  rules = passwordRules;
  strength = computed(() => this.rules.filter((rule) => rule.test(this.password())).length);
  toggle = toggle;

  goTo(step: number) {
    this.errors.set([]);
    this.message.set('');
    this.step.set(step);
    this.viewport.scrollToPosition([0, 0]);
  }

  continueIdentity(name: string, email: string, phone: string) {
    const nombre = name.trim();
    const correo = email.trim();
    const celular = phone.trim();
    const errors: string[] = [];
    if (nombre.length < 5 || nombre.split(/\s+/).length < 2) errors.push('nombre');
    if (!emailPattern.test(correo)) errors.push('correo');
    if (!/^09\d{8}$/.test(celular)) errors.push('celular');
    if (errors.length) return this.showErrors(errors);

    this.identity = { nombre, correo, celular };
    this.goTo(2);
  }

  chooseAccount(linked: boolean) {
    this.linked.set(linked);
    this.errors.set([]);
    this.message.set('');
  }

  continueAccount(account: string, id: string) {
    if (this.linked() === null) {
      return this.showErrors(['account'], 'Selecciona una opción para continuar.');
    }

    if (this.linked()) {
      const cuenta = account.trim();
      const cedula = id.trim();
      const errors: string[] = [];
      if (!/^\d{8,12}$/.test(cuenta)) errors.push('numCuenta');
      if (!/^\d{10}$/.test(cedula)) errors.push('codigo');
      if (errors.length) return this.showErrors(errors);
      this.account = { cuenta, cedula };
    }
    this.goTo(3);
  }

  async submit(clave: string, confirmation: string, accepted: boolean, tipoCuenta: string) {
    if (this.busy()) return;
    const errors: string[] = [];
    if (!this.rules.every((rule) => rule.test(clave))) errors.push('clave');
    if (!confirmation || confirmation !== clave) errors.push('clave2');
    if (!accepted) errors.push('terms');
    if (errors.length) return this.showErrors(errors);

    this.errors.set([]);
    this.message.set('');
    this.busy.set(true);
    try {
      const account = this.linked() ? { ...this.account, tipoCuenta } : {};
      await this.api.call('POST', '/auth/register', { ...this.identity, ...account, clave });
      await this.router.navigate(['/iniciar-sesion'], { queryParams: { registered: '1' } });
    } catch (error) {
      this.message.set((error as Error).message);
    } finally {
      this.busy.set(false);
    }
  }

  private showErrors(errors: string[], message = 'Revisa los campos marcados antes de continuar.') {
    this.errors.set(errors);
    this.message.set(message);
  }
}
