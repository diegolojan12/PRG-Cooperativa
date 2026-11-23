import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon/icon.component';

/** La precarga se muestra una sola vez por sesión. */
const CLAVE_PRECARGA = 'suma:precarga-vista';

const quiereMenosMovimiento = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function debeMostrarPrecarga(): boolean {
  if (quiereMenosMovimiento()) return false;
  try {
    return sessionStorage.getItem(CLAVE_PRECARGA) !== '1';
  } catch {
    return false;
  }
}

/**
 * Página de inicio pública. El contenido es visible sin JavaScript;
 * las animaciones (GSAP + Lenis) se cargan aparte, solo aquí y solo si la
 * persona no pidió reducir el movimiento.
 */
@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, IconComponent],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.css',
  // Sin encapsulación: SplitText crea elementos que deben recibir estos estilos.
  // Todas las reglas van bajo la clase raíz .ld para no afectar a otras páginas.
  encapsulation: ViewEncapsulation.None,
})
export class LandingPage implements OnDestroy {
  private raiz = inject<ElementRef<HTMLElement>>(ElementRef);
  private detener?: () => void;

  /** true cuando se van a ejecutar las animaciones (el CSS oculta la portada hasta que entra). */
  readonly conMovimiento = !quiereMenosMovimiento();
  readonly precarga = signal(debeMostrarPrecarga());
  readonly menuOpen = signal(false);
  readonly temaClaro = signal(false);
  readonly headerOculto = signal(false);

  protected readonly secciones = [
    { id: 'como-funciona', texto: 'Cómo funciona' },
    { id: 'recompensas', texto: 'Recompensas' },
    { id: 'comunidad', texto: 'Comunidad' },
    { id: 'aprende', texto: 'Aprende' },
    { id: 'bienestar', texto: 'Bienestar' },
  ];

  /** Demostración interactiva dentro del teléfono. */
  protected readonly vistas = [
    {
      nombre: 'Referir',
      icono: 'lucide-invitar',
      titulo: 'Comparte tu invitación',
      detalle: 'Invita con tu enlace. Cuando se apruebe su registro, sumas puntos.',
    },
    {
      nombre: 'Retos',
      icono: 'lucide-objetivo',
      titulo: 'Ahorra con propósito',
      detalle: 'Ejemplo de reto semanal: completa 3 acciones y gana 120 puntos.',
    },
    {
      nombre: 'Premios',
      icono: 'lucide-regalo',
      titulo: 'Encuentra tu próximo premio',
      detalle: 'Explora las recompensas y mira cuántos puntos necesitas.',
    },
  ];
  protected readonly seleccion = signal(1);
  protected readonly vista = computed(() => this.vistas[this.seleccion()]);

  protected readonly palabrasCinta = ['Refiere', 'aprende', 'Juega', 'participa', 'Gana', 'crece'];

  protected readonly pasos = [
    {
      numero: '01',
      icono: 'lucide-invitar',
      titulo: 'Invita.',
      texto: 'Comparte tu enlace con familiares, amigos o colegas.',
      destacado: false,
    },
    {
      numero: '02',
      icono: 'check',
      titulo: 'Se une.',
      texto: 'La persona invitada se registra en SUMA con tu enlace.',
      destacado: true,
    },
    {
      numero: '03',
      icono: 'lucide-regalo',
      titulo: 'Suman.',
      texto: 'Cuando se aprueba el referido, tu participación se convierte en puntos.',
      destacado: false,
    },
  ];

  protected readonly beneficios = [
    {
      tono: 'amarillo',
      icono: 'lucide-monedas',
      titulo: 'Puntos por cada acción',
      texto: 'Refiere, aprende, participa y completa retos.',
    },
    {
      tono: 'tinta',
      icono: 'report',
      titulo: 'Niveles que reconocen tu avance',
      texto: 'De Explorador a Líder de la comunidad.',
    },
    {
      tono: 'azul',
      icono: 'lucide-medalla',
      titulo: 'Insignias para celebrar logros',
      texto: 'Colecciona hitos y compártelos con orgullo.',
    },
    {
      tono: 'papel',
      icono: 'lucide-regalo',
      titulo: 'Recompensas que sí disfrutas',
      texto: 'Canjea beneficios, experiencias y premios.',
    },
  ];

  protected readonly modulos = [
    {
      id: 'comunidad',
      tono: 'amarillo',
      icono: 'usuarios',
      titulo: 'Comunidad',
      texto: 'Comparte ideas, celebra logros y súmate a actividades entre socios.',
      etiqueta: 'Muro de la comunidad',
      dato: 'Publica, comenta y reacciona',
    },
    {
      id: 'aprende',
      tono: 'azul',
      icono: 'book',
      titulo: 'Aprende',
      texto: 'Cursos y talleres prácticos de educación financiera, a tu ritmo.',
      etiqueta: 'Curso · 25 min',
      dato: 'Haz que tu dinero trabaje para ti',
    },
    {
      id: 'juegos',
      tono: 'papel',
      icono: 'game',
      titulo: 'Juegos',
      texto: 'Trivias y desafíos financieros que suman puntos mientras aprendes.',
      etiqueta: 'Trivia financiera',
      dato: 'Responde y gana puntos extra',
    },
    {
      id: 'bienestar',
      tono: 'tinta',
      icono: 'heart',
      titulo: 'Bienestar',
      texto: 'Actividades, consejos y retos para una vida más equilibrada.',
      etiqueta: 'Racha saludable',
      dato: '7 días activos',
    },
  ];

  protected readonly cifras = [
    { valor: 8500, formato: '8.500', texto: 'socios conectados' },
    { valor: 3200, formato: '3.200', texto: 'referidos registrados' },
    { valor: 12800, formato: '12.800', texto: 'retos completados' },
  ];

  protected readonly historias = [
    {
      iniciales: 'AM',
      autor: 'Andrea M.',
      detalle: 'Socia desde 2019',
      texto:
        'SUMA me motivó a compartir algo en lo que ya confío. Ahora mi hermana también es socia y las dos sumamos beneficios.',
    },
    {
      iniciales: 'DR',
      autor: 'Diego R.',
      detalle: 'Socio emprendedor',
      texto:
        'Los retos hicieron que ahorrar se sienta posible. Voy paso a paso y ver mi progreso me anima a continuar.',
    },
    {
      iniciales: 'CS',
      autor: 'Carolina S.',
      detalle: 'Socia desde 2021',
      texto:
        'Me encanta aprender con juegos y encontrar actividades para hacer con mi familia. Se siente como una comunidad de verdad.',
    },
    {
      iniciales: 'LP',
      autor: 'Luis P.',
      detalle: 'Socio desde 2023',
      texto:
        'Invité a dos compañeros de trabajo y ver cómo avanzaban sus registros fue muy fácil desde mi celular.',
    },
  ];

  constructor() {
    afterNextRender(() => {
      if (!this.conMovimiento) return;
      // El módulo de animación (y GSAP) se descarga en un archivo aparte, solo para esta página.
      import('./landing.motion')
        .then(({ iniciarMovimiento }) => {
          this.detener = iniciarMovimiento(this.raiz.nativeElement, {
            alTerminarPrecarga: () => {
              this.precarga.set(false);
              try {
                sessionStorage.setItem(CLAVE_PRECARGA, '1');
              } catch {
                /* Sin almacenamiento: la precarga se repetirá, sin más efecto. */
              }
            },
            alCambiarTema: (claro) => this.temaClaro.set(claro),
            alOcultarCabecera: (ocultar) => this.headerOculto.set(ocultar),
          });
        })
        .catch(() => {
          // Si la animación no carga, la página se muestra completa y estática.
          this.precarga.set(false);
          this.raiz.nativeElement.querySelector('.ld')?.classList.remove('ld--anim');
        });
    });
  }

  ngOnDestroy(): void {
    this.detener?.();
  }

  @HostListener('document:keydown.escape')
  cerrarMenu(): void {
    this.menuOpen.set(false);
  }
}
