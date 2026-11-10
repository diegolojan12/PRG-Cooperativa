import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { leerError } from '../../core/http/api-error';
import { AvisoService } from '../../core/ui/aviso.service';
import { ReferidosApi } from './referidos.api';

@Component({
  selector: 'app-invitacion',
  template: `
    @if (invitacion(); as i) {
      <div class="s-heading-actions" aria-label="Compartir mi invitación">
        <button type="button" class="s-primary" (click)="copiar()">Copiar enlace</button>
        <a class="s-secondary" [href]="whatsapp()" target="_blank" rel="noopener noreferrer"
          >WhatsApp</a
        >
        <a class="s-secondary" [href]="facebook()" target="_blank" rel="noopener noreferrer"
          >Facebook</a
        >
        <button type="button" class="s-secondary" (click)="compartir()">Compartir</button>
        <a class="s-secondary" [href]="i.qr" download="SUMA-invitacion.png">Descargar QR</a>
      </div>
      <label for="enlace-oficial">Enlace oficial</label>
      <input id="enlace-oficial" readonly [value]="i.enlace" />
    } @else if (error()) {
      <p role="alert">{{ error() }}</p>
      <button type="button" class="s-secondary" (click)="cargar()">Volver a intentar</button>
    } @else {
      <p role="status">Cargando tu invitación…</p>
    }
  `,
})
export class InvitacionComponent implements OnInit {
  private api = inject(ReferidosApi);
  private avisos = inject(AvisoService);
  readonly invitacion = signal<{ codigo: string; enlace: string; qr: string } | null>(null);
  readonly error = signal('');
  readonly whatsapp = computed(() => 'https://wa.me/?text=' + encodeURIComponent(this.mensaje()));
  readonly facebook = computed(
    () =>
      'https://www.facebook.com/sharer/sharer.php?u=' +
      encodeURIComponent(this.invitacion()?.enlace ?? ''),
  );

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.error.set('');
    try {
      this.invitacion.set(await firstValueFrom(this.api.miCodigo()));
    } catch (error) {
      this.error.set(leerError(error).mensaje);
    }
  }

  private mensaje(): string {
    const enlace = this.invitacion()?.enlace ?? '';
    const invitacion = 'Te invito a sumarte a la comunidad SUMA. ';
    return invitacion.slice(0, Math.max(0, 300 - enlace.length)) + enlace;
  }

  async copiar(): Promise<void> {
    const enlace = this.invitacion()?.enlace;
    if (!enlace) return;
    try {
      await navigator.clipboard.writeText(enlace);
      this.avisos.exito('Enlace copiado.');
    } catch {
      this.avisos.error('Selecciona el enlace oficial y cópialo desde el campo.');
    }
  }

  async compartir(): Promise<void> {
    const enlace = this.invitacion()?.enlace;
    if (!enlace) return;
    if (!navigator.share) return this.copiar();
    try {
      await navigator.share({
        title: 'Invitación a SUMA',
        text: 'Te invito a la comunidad SUMA.',
        url: enlace,
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        this.avisos.error('No se pudo abrir el menú. Puedes copiar el enlace.');
    }
  }
}
