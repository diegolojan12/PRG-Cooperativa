import { Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-preview',
  templateUrl: './auth-preview.component.html',
})
export class AuthPreviewComponent {
  readonly pointsLabel = input('Puntos ganados');
  readonly pointsValue = input('+250 SUMA');
  readonly badgeLabel = input('Nueva insignia');
  readonly badgeValue = input('Conector estrella');
}
