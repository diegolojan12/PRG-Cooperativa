import { Component, effect, input, output } from '@angular/core';

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const passwordRules = [
  { label: 'Mínimo 8 caracteres', test: (value: string) => value.length >= 8 },
  { label: 'Una mayúscula', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Un número', test: (value: string) => /\d/.test(value) },
];
export const toggle = (value: boolean) => !value;

@Component({
  selector: 'suma-auth-notice',
  templateUrl: '../internas/aviso.html',
})
export class AuthNotice {
  message = input('');
  success = input(false);
  dismiss = output<void>();

  constructor() {
    effect((cleanup) => {
      if (!this.message()) return;
      const timer = setTimeout(() => this.dismiss.emit(), 5000);
      cleanup(() => clearTimeout(timer));
    });
  }
}

@Component({
  selector: 'suma-auth-preview',
  templateUrl: '../internas/vista-previa.html',
})
export class AuthPreview {
  pointsLabel = input('Puntos ganados');
  pointsValue = input('+250 SUMA');
  badgeLabel = input('Nueva insignia');
  badgeValue = input('Conector estrella');
}
