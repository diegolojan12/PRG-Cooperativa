import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-ayuda-page',
  imports: [IconComponent],
  templateUrl: './ayuda.page.html',
})
export class AyudaPage implements OnInit {
  private http = inject(HttpClient);
  readonly contacto = signal('');

  ngOnInit(): void {
    void firstValueFrom(this.http.get<{ contacto: string }>('/api/ayuda'))
      .then((r) => this.contacto.set(r.contacto))
      .catch(() => null);
  }
}
