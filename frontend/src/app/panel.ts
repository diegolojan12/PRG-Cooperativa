import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api, User } from './api';
import { Icon } from './icon';
import { FocusDialog } from './focus-dialog';

@Component({
  selector: 'suma-panel',
  imports: [CommonModule, FormsModule, RouterLink, Icon, FocusDialog],
  templateUrl: './panel.html',
})
export class Panel implements OnInit {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  user = signal<User | null>(null);
  page = signal('panel');
  loading = signal(true);
  error = signal('');
  busy = signal(false);
  sidebar = signal(false);
  toast = signal('');
  modal = signal('');
  search = signal('');
  state = signal('');
  pageNumber = signal(1);
  overview = signal<any>(null);
  refs = signal<any[]>([]);
  users = signal<User[]>([]);
  roles = signal<any[]>([]);
  activity = signal<any[]>([]);
  notes = signal<any[]>([]);
  settings: any = {};
  form: any = {};
  selected: any = null;
  contact = signal('');
  private toastTimer: any;
  nav = [
    { id: 'panel', label: 'Resumen', group: 'Tu espacio' },
    { id: 'referidos', label: 'Referidos', group: 'Tu espacio' },
    { id: 'usuarios', label: 'Usuarios', group: 'Administración' },
    { id: 'roles', label: 'Roles y permisos', group: 'Administración' },
    { id: 'configuracion', label: 'Configuración', group: 'Administración' },
    { id: 'actividad', label: 'Registro de actividad', group: 'Administración' },
    { id: 'notificaciones', label: 'Notificaciones', group: 'Comunidad' },
    { id: 'ayuda', label: 'Centro de ayuda', group: 'Comunidad' },
  ];
  previewModules: { id: string; label: string; icon: string; roles: User['rol'][] }[] = [
    { id: 'retos', label: 'Retos y recompensas', icon: 'gift', roles: ['ADMIN', 'SOCIO'] },
    {
      id: 'capacitaciones',
      label: 'Capacitaciones y talleres',
      icon: 'book',
      roles: ['ADMIN', 'SOCIO'],
    },
    { id: 'juegos', label: 'Juegos', icon: 'game', roles: ['ADMIN', 'SOCIO'] },
    { id: 'publicaciones', label: 'Publicaciones', icon: 'post', roles: ['ADMIN'] },
    { id: 'reportes', label: 'Reportes', icon: 'report', roles: ['ADMIN'] },
    { id: 'aprende', label: 'Aprende', icon: 'book', roles: ['SOCIO'] },
    { id: 'comunidad', label: 'Comunidad', icon: 'usuarios', roles: ['SOCIO'] },
    { id: 'recompensas', label: 'Recompensas', icon: 'points', roles: ['SOCIO'] },
    { id: 'perfil', label: 'Mi perfil', icon: 'profile', roles: ['SOCIO'] },
  ];
  states = ['PENDIENTE', 'CONTACTADO', 'VALIDADO', 'RECHAZADO'];
  labels: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    CONTACTADO: 'Contactado',
    VALIDADO: 'Validado',
    RECHAZADO: 'Rechazado',
    ADMIN: 'Administrador',
    SOCIO: 'Socio',
  };
  visibleNav = computed(() => this.nav.filter((item) => this.allowed(item.id)));
  visiblePreviews = computed(() => {
    const role = this.user()?.rol;
    return role ? this.previewModules.filter((item) => item.roles.includes(role)) : [];
  });
  preview = computed(() => this.visiblePreviews().find((item) => item.id === this.page()));
  quickLinks = computed(() =>
    this.visibleNav()
      .filter((item) => item.id !== 'panel')
      .slice(0, 3),
  );
  title = computed(
    () =>
      this.preview()?.label ??
      this.nav.find((item) => item.id === this.page())?.label ??
      'Página no disponible',
  );
  initials = computed(
    () =>
      this.user()
        ?.nombre.split(' ')
        .map((x) => x[0])
        .slice(0, 2)
        .join('') || '',
  );
  unread = computed(() => this.notes().filter((x) => !x.leida).length);
  filteredRefs = computed(() =>
    this.refs().filter(
      (x) =>
        (!this.state() || x.estado === this.state()) &&
        this.matches(x.nombre + ' ' + x.correo + ' ' + x.socio),
    ),
  );
  shownRefs = computed(() =>
    this.filteredRefs().slice((this.pageNumber() - 1) * 8, this.pageNumber() * 8),
  );
  filteredUsers = computed(() =>
    this.users().filter((x) => this.matches(x.nombre + ' ' + x.correo + ' ' + this.labels[x.rol])),
  );
  filteredActivity = computed(() =>
    this.activity().filter((x) => this.matches(x.actor + ' ' + x.accion + ' ' + x.detalle)),
  );
  date = new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'full',
    timeZone: 'America/Guayaquil',
  }).format(new Date());
  isAdmin() {
    return this.user()?.rol === 'ADMIN';
  }
  countState(state: string) {
    return this.refs().filter((x) => x.estado === state).length;
  }
  allowed(id: string) {
    return !!this.user()?.modulos.includes(id);
  }
  matches(value: string) {
    return value
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .includes(
        this.search()
          .toLocaleLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''),
      );
  }
  async ngOnInit() {
    try {
      this.user.set(await this.api.call('GET', '/auth/me'));
    } catch (error) {
      this.error.set((error as Error).message);
      this.loading.set(false);
      return;
    }
    this.route.paramMap.subscribe((params) => {
      this.page.set(params.get('page') || 'panel');
      this.search.set('');
      this.state.set('');
      this.pageNumber.set(1);
      this.sidebar.set(false);
      void this.load();
    });
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    if (!this.allowed(this.page())) {
      this.loading.set(false);
      return;
    }
    try {
      const page = this.page();
      if (page === 'panel') {
        const [overview, refs] = await Promise.all([
          this.api.call('GET', '/overview'),
          this.allowed('referidos')
            ? this.api.call<any[]>('GET', '/referidos')
            : Promise.resolve([]),
        ]);
        this.overview.set(overview);
        this.refs.set(refs);
      } else if (page === 'referidos') this.refs.set(await this.api.call('GET', '/referidos'));
      else if (page === 'usuarios') this.users.set(await this.api.call('GET', '/usuarios'));
      else if (page === 'roles') this.roles.set(await this.api.call('GET', '/roles'));
      else if (page === 'configuracion')
        this.settings = await this.api.call('GET', '/configuracion');
      else if (page === 'actividad') this.activity.set(await this.api.call('GET', '/actividad'));
      else if (page === 'ayuda') this.contact.set((await this.api.call('GET', '/ayuda')).contacto);
      if (this.allowed('notificaciones'))
        this.notes.set(await this.api.call('GET', '/notificaciones'));
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.loading.set(false);
    }
  }
  notify(message: string) {
    this.toast.set(message);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 5500);
  }
  openRef(ref?: any) {
    this.selected = ref || null;
    this.form = ref
      ? { ...ref }
      : {
          nombre: '',
          correo: '',
          celular: '',
          notas: '',
          consentimiento: false,
          estado: 'PENDIENTE',
        };
    this.modal.set('ref');
    setTimeout(() => document.querySelector<HTMLInputElement>('#refName')?.focus());
  }
  openUser(user: User) {
    this.selected = user;
    this.form = { rol: user.rol, activo: user.activo };
    this.modal.set('user');
  }
  async saveRef() {
    await this.mutate(async () => {
      await this.api.call(
        this.selected ? 'PATCH' : 'POST',
        '/referidos' + (this.selected ? '/' + this.selected.id : ''),
        this.form,
      );
      this.modal.set('');
      await this.load();
      this.notify(
        this.selected
          ? 'Referido actualizado correctamente.'
          : '¡Una nueva conexión! Tu referido fue registrado.',
      );
    });
  }
  async deleteRef() {
    await this.mutate(async () => {
      await this.api.call('DELETE', '/referidos/' + this.selected.id);
      this.modal.set('');
      this.pageNumber.set(1);
      await this.load();
      this.notify('Referido eliminado.');
    });
  }
  async saveUser() {
    await this.mutate(async () => {
      await this.api.call('PATCH', '/usuarios/' + this.selected.id, this.form);
      this.modal.set('');
      await this.load();
      this.notify('Usuario actualizado. Sus sesiones anteriores se cerraron.');
    });
  }
  async saveSettings() {
    await this.mutate(async () => {
      await this.api.call('PUT', '/configuracion', this.settings);
      this.notify('Configuración guardada correctamente.');
    });
  }
  togglePermission(role: any, module: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    role.modulos = checked
      ? [...role.modulos, module]
      : role.modulos.filter((x: string) => x !== module);
  }
  locked(role: any, module: string) {
    return (
      ['panel', 'ayuda'].includes(module) ||
      (role.rol === 'ADMIN' && ['usuarios', 'roles'].includes(module)) ||
      (role.rol === 'SOCIO' && !['panel', 'referidos', 'notificaciones', 'ayuda'].includes(module))
    );
  }
  async saveRole(role: any) {
    await this.mutate(async () => {
      await this.api.call('PUT', '/roles/' + role.rol, { modulos: role.modulos });
      this.user.set(await this.api.call('GET', '/auth/me'));
      this.notify('Permisos guardados. Se aplican en el siguiente acceso al módulo.');
    });
  }
  async readNotes() {
    await this.mutate(async () => {
      await this.api.call('PATCH', '/notificaciones/leer', {});
      this.notes.update((notes) => notes.map((n) => ({ ...n, leida: true })));
      this.notify('Notificaciones marcadas como leídas.');
    });
  }
  async logout() {
    await this.mutate(async () => {
      await this.api.call('POST', '/auth/logout', {});
      await this.router.navigate(['/iniciar-sesion']);
    });
  }
  async mutate(action: () => Promise<void>) {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await action();
    } catch (error) {
      this.notify((error as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
  setSearch(value: string) {
    this.search.set(value);
    this.pageNumber.set(1);
  }
  changeState(value: string) {
    this.state.set(value);
    this.pageNumber.set(1);
  }
  lastPage() {
    return Math.max(1, Math.ceil(this.filteredRefs().length / 8));
  }
  canEdit(ref: any) {
    return this.isAdmin() || ref.estado === 'PENDIENTE';
  }
  exportCsv() {
    const quote = (value: any) =>
      '"' +
      String(value ?? '')
        .replace(/^[=+@\-\t\r]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    const content = [
      ['Nombre', 'Correo', 'Celular', 'Estado', 'Socio', 'Fecha'],
      ...this.filteredRefs().map((x) => [
        x.nombre,
        x.correo,
        x.celular,
        this.labels[x.estado],
        x.socio,
        x.creadoEn,
      ]),
    ]
      .map((row) => row.map(quote).join(';'))
      .join('\r\n');
    const url = URL.createObjectURL(
      new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SUMA-referidos.csv';
    a.click();
    URL.revokeObjectURL(url);
    this.notify('Listado de referidos exportado.');
  }
}
