import { Component, Input } from '@angular/core';
@Component({
  selector: 's-icon',
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="paths[name] || paths[\'panel\']" /></svg>',
  styles:
    ':host{display:inline-flex;width:21px;height:21px;flex-shrink:0}svg{width:100%;height:100%}',
})
export class Icon {
  @Input() name = 'panel';
  paths: Record<string, string> = {
    panel: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    referidos:
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M19 8v6 M16 11h6',
    usuarios:
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87',
    roles: 'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6z M8 12l3 3 5-6',
    configuracion:
      'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3l1-1h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1z',
    actividad: 'M3 12h4l3-8 4 16 3-8h4',
    notificaciones: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
    ayuda: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3 M12 17h.01',
    search: 'M21 21l-5-5 M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15',
    menu: 'M4 6h16 M4 12h16 M4 18h16',
    logout: 'M9 4H4v16h5 M13 8l4 4-4 4 M8 12h13',
    plus: 'M12 5v14 M5 12h14',
    arrow: 'M5 12h14 M14 7l5 5-5 5',
    points:
      'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10 M12 10v4 M10 12h4',
    check: 'M5 12l4 4L19 6',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2',
    edit: 'M16 3l5 5-12 12H4v-5z M13 6l5 5',
    trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
    close: 'M6 6l12 12 M18 6 6 18',
    download: 'M12 3v12 M7 10l5 5 5-5 M4 17v4h16v-4',
    chevron: 'M8 10l4 4 4-4',
    mail: 'M3 5h18v14H3z M3 5l9 7 9-7',
    book: 'M12 6C8 3 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-6-1-10 2v15',
    game: 'M7 7h10a4 4 0 0 1 4 3l1 5a3 3 0 0 1-5 3l-2-2H9l-2 2a3 3 0 0 1-5-3l1-5a4 4 0 0 1 4-3z M7 10v4 M5 12h4 M16 11h.01 M19 13h.01',
    post: 'M5 3h14v18H5z M8 7h8 M8 11h8 M8 15h5',
    report: 'M4 3v17h17 M8 16v-4 M13 16V8 M18 16V5',
    profile: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2',
    gift: 'M3 8h18v4H3z M5 12v9h14v-9 M12 8v13 M12 8C1 8 5-4 12 8 19-4 23 8 12 8',
  };
}
