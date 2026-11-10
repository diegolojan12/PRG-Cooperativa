import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';

@Component({ selector: 'suma-landing', imports: [RouterLink, Icon], templateUrl: './landing.html' })
export class Landing {
  menuOpen = signal(false);
}
