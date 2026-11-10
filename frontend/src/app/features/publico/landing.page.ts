import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, IconComponent],
  templateUrl: './landing.page.html',
})
export class LandingPage {
  readonly menuOpen = signal(false);

  @HostListener('document:keydown.escape')
  cerrarMenu(): void {
    this.menuOpen.set(false);
  }
}
