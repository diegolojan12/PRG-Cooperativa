import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AvisoComponent } from './shared/aviso/aviso.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AvisoComponent],
  template: '<router-outlet /><app-aviso />',
})
export class App {}
