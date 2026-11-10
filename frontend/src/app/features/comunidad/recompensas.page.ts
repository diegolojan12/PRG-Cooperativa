import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { Pagina } from '../../core/models/domain';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { PaginadorComponent } from '../../shared/paginador/paginador.component';

interface Premio {
  id: string;
  nombre: string;
  descripcion: string;
  costo: number;
  stock: number;
  activo: number;
  foto: number;
}
interface Catalogo {
  items: Premio[];
  saldo: number;
  cuentaVerificada: boolean;
}
type Estado = 'PENDIENTE' | 'LISTO' | 'ENTREGADO';
interface Canje {
  id: string;
  premio: string;
  costo: number;
  fecha: string;
  estado: Estado;
  socio?: string;
}

@Component({
  selector: 'app-recompensas-page',
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    CampoComponent,
    ModalComponent,
    PaginadorComponent,
  ],
  templateUrl: './recompensas.page.html',
})
export class RecompensasPage implements OnInit {
  private http = inject(HttpClient);
  private avisos = inject(AvisoService);
  private fb = inject(FormBuilder).nonNullable;
  protected session = inject(SessionStore);
  readonly catalogo = signal<Catalogo | null>(null);
  readonly canjes = signal<Pagina<Canje> | null>(null);
  readonly formulario = signal(false);
  readonly editando = signal<Premio | null>(null);
  readonly ocupado = signal(false);
  readonly error = signal('');
  readonly confirmacion = signal<{ premio: Premio; solicitud: string } | null>(null);
  readonly comprobante = signal<Canje | null>(null);
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly estados = { PENDIENTE: 'Pendiente', LISTO: 'Listo para retiro', ENTREGADO: 'Entregado' };
  readonly form = this.fb.group({ nombre: [''], descripcion: [''], costo: [1], stock: [1] });
  private foto?: File;

  ngOnInit(): void {
    void this.cargar();
  }
  async cargar(pagina = 1): Promise<void> {
    try {
      const params = {
        pagina,
        ...(this.desde() ? { desde: this.desde() } : {}),
        ...(this.hasta() ? { hasta: this.hasta() } : {}),
      };
      const [catalogo, canjes] = await Promise.all([
        firstValueFrom(this.http.get<Catalogo>('/api/premios')),
        firstValueFrom(this.http.get<Pagina<Canje>>('/api/canjes', { params })),
      ]);
      this.catalogo.set(catalogo);
      this.canjes.set(canjes);
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    }
  }
  abrir(p?: Premio): void {
    this.error.set('');
    this.foto = undefined;
    this.editando.set(p ?? null);
    this.form.reset(p ?? {});
    this.formulario.set(true);
  }
  seleccionarFoto(archivo: File | null): void {
    this.foto = archivo ?? undefined;
  }
  guardar(): void {
    const anterior = this.editando();
    const foto = this.foto;
    if ((!anterior?.foto && !foto) || (foto && foto.size > 2 * 1024 * 1024)) {
      this.error.set('Selecciona una imagen JPG o PNG de hasta 2 MB.');
      return;
    }
    void this.ejecutar(async () => {
      const datos = this.form.getRawValue();
      const r = await firstValueFrom(
        anterior
          ? this.http.put<{ id: string }>('/api/premios/' + anterior.id, datos)
          : this.http.post<{ id: string }>('/api/premios', datos),
      );
      this.editando.set({ ...datos, id: r.id, activo: 1, foto: anterior?.foto ?? 0 });
      if (foto)
        await firstValueFrom(
          this.http.post('/api/premios/' + r.id + '/foto', foto, {
            headers: new HttpHeaders({ 'Content-Type': 'application/octet-stream' }),
          }),
        );
      this.formulario.set(false);
    });
  }
  inactivar(id: string): void {
    void this.ejecutar(() =>
      firstValueFrom(this.http.patch('/api/premios/' + id + '/inactivar', {})),
    );
  }
  elegir(premio: Premio): void {
    this.error.set('');
    this.comprobante.set(null);
    this.confirmacion.set({ premio, solicitud: crypto.randomUUID() });
  }
  canjear(): void {
    const c = this.confirmacion();
    if (!c) return;
    void this.ejecutar(async () => {
      this.comprobante.set(
        await firstValueFrom(
          this.http.post<Canje>('/api/canjes', { premioId: c.premio.id, solicitud: c.solicitud }),
        ),
      );
      this.confirmacion.set(null);
    });
  }
  entregar(c: Canje): void {
    const estado = c.estado === 'PENDIENTE' ? 'LISTO' : 'ENTREGADO';
    void this.ejecutar(() =>
      firstValueFrom(this.http.patch('/api/canjes/' + c.id + '/entrega', { estado })),
    );
  }
  private async ejecutar(accion: () => Promise<unknown>): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      await accion();
      await this.cargar();
      this.avisos.exito('Guardamos los cambios.');
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
