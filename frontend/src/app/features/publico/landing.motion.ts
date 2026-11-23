/**
 * Animaciones de la página de inicio (GSAP + ScrollTrigger + SplitText + Lenis).
 * Se carga con import() solo en esta página y solo si la persona no pidió reducir
 * el movimiento. Todo anima transform/opacity/clip-path para no forzar reflujos.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

export interface AvisosMovimiento {
  alTerminarPrecarga(): void;
  alCambiarTema(claro: boolean): void;
  alOcultarCabecera(ocultar: boolean): void;
}

const ESCRITORIO = '(min-width: 900px) and (min-height: 600px)';
const PUNTERO_FINO = '(hover: hover) and (pointer: fine) and (min-width: 900px)';
const formato = new Intl.NumberFormat('es-EC');

export function iniciarMovimiento(host: HTMLElement, avisos: AvisosMovimiento): () => void {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const raiz = host.querySelector<HTMLElement>('.ld') ?? host;
  const uno = <T extends Element = HTMLElement>(s: string) => raiz.querySelector<T>(s);
  const todos = <T extends Element = HTMLElement>(s: string) => Array.from(raiz.querySelectorAll<T>(s));

  // Scroll suave sincronizado con el reloj de GSAP (un solo requestAnimationFrame).
  const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -80 } });
  lenis.on('scroll', ScrollTrigger.update);
  const latido = (tiempo: number) => lenis.raf(tiempo * 1000);
  gsap.ticker.add(latido);
  gsap.ticker.lagSmoothing(0);

  const limpiezas: (() => void)[] = [];
  const escuchar = <K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    tipo: K,
    fn: (e: HTMLElementEventMap[K]) => void,
  ) => {
    el.addEventListener(tipo, fn as EventListener, { passive: true });
    limpiezas.push(() => el.removeEventListener(tipo, fn as EventListener));
  };

  const ctx = gsap.context(() => undefined, raiz);
  const mm = gsap.matchMedia(raiz);
  let cancelado = false;
  /** Letras de la marca gigante del pie (se llenan al construir). */
  let letrasPie: HTMLElement[] = [];

  // SplitText mide líneas: espera a que las tipografías estén listas.
  void document.fonts.ready.then(() => {
    if (cancelado) return;
    ctx.add(construir);
    // Ordena los disparadores (el anclaje de los pasos primero) y recalcula posiciones.
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  });
  const alCargar = () => ScrollTrigger.refresh();
  window.addEventListener('load', alCargar);
  limpiezas.push(() => window.removeEventListener('load', alCargar));

  /**
   * Muestra los elementos al entrar en pantalla y los oculta al salir, siempre en la
   * dirección del scroll: bajando entran desde abajo y salen por arriba; subiendo, al revés.
   */
  function entrarYSalir(
    objetivos: Element[],
    disparador: Element,
    abajo: gsap.TweenVars,
    visible: gsap.TweenVars,
    arriba: gsap.TweenVars,
    escalonado = 0.06,
  ): ScrollTrigger {
    gsap.set(objetivos, abajo);
    const entrar = (desde: gsap.TweenVars) =>
      gsap.fromTo(objetivos, desde, {
        ...visible,
        duration: 1.1,
        ease: 'expo.out',
        stagger: escalonado,
        overwrite: true,
      });
    const salir = (hacia: gsap.TweenVars) =>
      gsap.to(objetivos, { ...hacia, duration: 0.6, ease: 'power3.in', stagger: escalonado / 2, overwrite: true });
    return ScrollTrigger.create({
      trigger: disparador,
      start: 'top 88%',
      end: 'bottom 8%',
      onEnter: () => entrar(abajo),
      onLeave: () => salir(arriba),
      onEnterBack: () => entrar(arriba),
      onLeaveBack: () => salir(abajo),
    });
  }

  /**
   * Zona que decide cuándo un elemento entra o sale. Dentro de un bloque fijo (sticky)
   * se usa la sección entera: el elemento sigue a la vista mientras la sección pasa.
   */
  const zonaDe = (el: Element): Element => (el.closest('[data-fijo]') && el.closest('section')) || el;

  function construir(): void {
    /* ---------- 1. Portada: entrada de letras, textos y teléfono ---------- */
    // Perspectiva propia del teléfono: gira en 3D sin compartir plano con el círculo.
    gsap.set('[data-phone]', { transformPerspective: 1200 });
    const titulo = SplitText.create(todos('[data-hero-linea]'), {
      type: 'words,chars',
      mask: 'chars',
    });
    const intro = gsap
      .timeline({ paused: true, defaults: { ease: 'expo.out' } })
      .from(titulo.chars, { yPercent: 118, rotate: 9, duration: 1.15, stagger: 0.024 })
      .from('[data-intro]', { y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.09 }, '-=0.85')
      .from(
        '[data-phone]',
        { y: 180, rotationX: 30, rotationZ: -10, autoAlpha: 0, duration: 1.5 },
        '-=1.15',
      )
      .from('.ld-sol', { scale: 0.3, autoAlpha: 0, duration: 1.5 }, '<')
      .from(
        '[data-flota]',
        { scale: 0.5, autoAlpha: 0, duration: 0.9, stagger: 0.12, ease: 'back.out(1.8)' },
        '-=0.9',
      )
      .from('.ld-header', { autoAlpha: 0, y: -24, duration: 0.8, clearProps: 'all' }, '-=1.3')
      .from('.ld-hero__bajar', { autoAlpha: 0, y: 14, duration: 0.6 }, '-=0.5');
    // Los estados iniciales ya están aplicados en línea: se puede quitar el ocultado por CSS.
    raiz.classList.remove('ld--anim');

    const loader = uno('[data-loader]');
    if (loader) {
      lenis.stop();
      const cuenta = uno('[data-cuenta]');
      const progreso = { v: 0 };
      gsap
        .timeline()
        .from('.ld-loader__barras i', {
          scaleY: 0,
          transformOrigin: '50% 100%',
          stagger: 0.1,
          duration: 0.7,
          ease: 'expo.out',
        })
        .from('.ld-loader__marca', { yPercent: 110, duration: 0.7, ease: 'expo.out' }, '<0.15')
        .to(
          progreso,
          {
            v: 100,
            duration: 1.2,
            ease: 'power2.inOut',
            onUpdate: () => {
              if (cuenta) cuenta.textContent = String(Math.round(progreso.v));
            },
          },
          0,
        )
        .to(loader, { yPercent: -100, duration: 0.95, ease: 'expo.inOut' }, '+=0.05')
        .add(() => void intro.play(), '-=0.55')
        .add(() => {
          avisos.alTerminarPrecarga();
          lenis.start();
        });
    } else {
      intro.play();
    }

    /* ---------- 2. Portada al hacer scroll: el teléfono gira y el título se separa ---------- */
    gsap
      .timeline({
        scrollTrigger: { trigger: '.ld-hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
        defaults: { ease: 'none' },
      })
      .to('[data-phone]', { yPercent: -16, rotationY: -24, rotationZ: 7, scale: 0.88 }, 0)
      .to('.ld-sol', { scale: 1.4, yPercent: 18 }, 0)
      .to('[data-hero-linea]:nth-child(1)', { xPercent: -10 }, 0)
      .to('[data-hero-linea]:nth-child(2)', { xPercent: 8 }, 0)
      .to('[data-hero-linea]:nth-child(3)', { xPercent: -5 }, 0)
      .to('.ld-hero__texto', { autoAlpha: 0.15, yPercent: -12 }, 0.25);

    /* ---------- 3. Cinta: avanza sola y acelera/invierte con la velocidad del scroll ---------- */
    const cintas = todos('[data-cinta]').map((fila) => {
      const sentido = Number(fila.dataset['cinta']) || 1;
      return gsap.fromTo(
        fila,
        { xPercent: sentido > 0 ? 0 : -50 },
        { xPercent: sentido > 0 ? -50 : 0, duration: 32, ease: 'none', repeat: -1 },
      );
    });
    ScrollTrigger.create({
      trigger: '.ld-cinta',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (st) => {
        const impulso = gsap.utils.clamp(1, 6, 1 + Math.abs(st.getVelocity()) / 350);
        for (const cinta of cintas)
          gsap
            .timeline({ overwrite: true })
            .to(cinta, { timeScale: impulso * st.direction, duration: 0.2 })
            .to(cinta, { timeScale: st.direction, duration: 1.1, ease: 'power2.out' });
      },
    });

    /* ---------- 4. Manifiesto: las palabras se encienden al avanzar ---------- */
    const manifiesto = uno('[data-palabras]');
    if (manifiesto) {
      const palabras = SplitText.create(manifiesto, { type: 'words' });
      gsap.fromTo(
        palabras.words,
        { opacity: 0.18 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: { trigger: manifiesto, start: 'top 82%', end: 'bottom 48%', scrub: true },
        },
      );
    }

    /* ---------- 5. Títulos: cada línea sube al entrar y sale hacia arriba al pasar ---------- */
    const disparadores = new Map<Element, ScrollTrigger>();
    for (const el of todos('[data-lineas]')) {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        // Si el ancho cambia, SplitText vuelve a partir las líneas: se rehace el disparador.
        onSplit: (s) => {
          disparadores.get(el)?.kill();
          disparadores.set(
            el,
            entrarYSalir(s.lines, zonaDe(el), { yPercent: 112 }, { yPercent: 0 }, { yPercent: -112 }, 0.12),
          );
        },
      });
    }

    /* ---------- 6. Textos y tarjetas: aparecen al entrar y se desvanecen al salir ---------- */
    for (const el of todos('[data-aparecer]'))
      entrarYSalir([el], zonaDe(el), { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -50 });

    /* ---------- 7. Cifras que cuentan y barras que se llenan ---------- */
    for (const el of todos('[data-contar]')) {
      const fin = Number(el.dataset['contar']);
      const valor = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 92%',
        once: true,
        onEnter: () =>
          gsap.to(valor, {
            v: fin,
            duration: 1.8,
            ease: 'power3.out',
            onUpdate: () => (el.textContent = formato.format(Math.round(valor.v))),
          }),
      });
    }
    gsap.from('[data-llenar]', {
      scaleX: 0,
      transformOrigin: '0 50%',
      duration: 1.6,
      ease: 'expo.out',
      scrollTrigger: { trigger: '[data-llenar]', start: 'top 90%', once: true },
    });

    /* ---------- 8. Recompensas: cada tarjeta se achica cuando llega la siguiente ---------- */
    const cartas = todos('[data-carta]');
    cartas.forEach((carta, i) => {
      const siguiente = cartas[i + 1];
      if (!siguiente) return;
      gsap.to(carta, {
        scale: 0.9,
        rotation: i % 2 ? 2 : -2,
        ease: 'none',
        scrollTrigger: { trigger: siguiente, start: 'top bottom', end: 'top 22%', scrub: true },
      });
    });

    /* ---------- 9. Llamada a la acción: el círculo amarillo se expande ---------- */
    gsap.fromTo(
      '[data-cta-circulo]',
      { clipPath: 'circle(9% at 50% 62%)' },
      {
        clipPath: 'circle(74% at 50% 50%)',
        ease: 'none',
        scrollTrigger: { trigger: '.ld-cta', start: 'top 85%', end: 'center 55%', scrub: true },
      },
    );

    /* ---------- 10. Pie: la marca gigante sube letra por letra ---------- */
    const gigante = uno('[data-gigante]');
    if (gigante) {
      const letras = SplitText.create(gigante, { type: 'chars', mask: 'chars' });
      letrasPie = letras.chars as HTMLElement[];
      gsap.from(letras.chars, {
        yPercent: 100,
        ease: 'none',
        stagger: 0.08,
        scrollTrigger: { trigger: gigante, start: 'top bottom', end: 'bottom bottom', scrub: true },
      });
    }

    /* ---------- 10b. Pie: al tocar o hacer clic en SUMA, las letras hacen una ola ---------- */
    if (gigante && letrasPie.length) {
      const ola = () =>
        gsap
          .timeline({ overwrite: true })
          .to(letrasPie, {
            fontStretch: '100%',
            color: '#ffffff',
            duration: 0.35,
            ease: 'power2.out',
            stagger: 0.07,
          })
          .to(
            letrasPie,
            { fontStretch: '62%', color: '#ffc400', duration: 0.6, ease: 'elastic.out(1, 0.5)', stagger: 0.07 },
            0.3,
          );
      escuchar(gigante, 'click', ola);
    }

    /* ---------- 11. Cabecera: cambia de color por sección y se oculta al bajar ---------- */
    for (const seccion of todos('[data-tema]')) {
      ScrollTrigger.create({
        trigger: seccion,
        start: 'top 44px',
        end: 'bottom 44px',
        onToggle: (st) => st.isActive && avisos.alCambiarTema(seccion.dataset['tema'] === 'claro'),
      });
    }
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (st) => avisos.alOcultarCabecera(st.direction === 1 && st.scroll() > innerHeight * 0.7),
    });

    /* ---------- 12. Escritorio: scroll horizontal de los pasos e historias a la deriva ---------- */
    mm.add(ESCRITORIO, () => {
      const pista = uno('[data-pista]');
      const ventana = pista?.parentElement;
      if (!pista || !ventana) return;
      gsap.set(ventana, { overflow: 'hidden' });
      const recorrido = () => Math.max(0, pista.scrollWidth - ventana.clientWidth);
      const barra = uno('[data-pasos-barra]');
      const horizontal = gsap.to(pista, {
        x: () => -recorrido(),
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-pasos-pin]',
          start: 'top top',
          end: () => '+=' + recorrido(),
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          // Se calcula primero: el espacio que agrega al anclarse desplaza todo lo que viene después.
          refreshPriority: 1,
          invalidateOnRefresh: true,
          onUpdate: (st) => barra && gsap.set(barra, { scaleX: st.progress }),
        },
      });
      // Los números grandes se desplazan dentro de cada tarjeta (parallax horizontal).
      for (const numero of todos('.ld-paso__num'))
        gsap.fromTo(
          numero,
          { xPercent: 45 },
          {
            xPercent: -25,
            ease: 'none',
            scrollTrigger: {
              trigger: numero.parentElement,
              containerAnimation: horizontal,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          },
        );

      const fila = uno('[data-historias]');
      if (fila)
        gsap.fromTo(
          fila,
          { x: () => innerWidth * 0.12 },
          {
            x: () => -(fila.scrollWidth - innerWidth * 0.88),
            ease: 'none',
            scrollTrigger: {
              trigger: '.ld-historias',
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
    });

    /* ---------- 13. Con mouse: inclinación 3D, botones magnéticos y vista previa ---------- */
    mm.add(PUNTERO_FINO, () => {
      // Teléfono e insignias siguen al puntero con distinta profundidad.
      const hero = uno('.ld-hero');
      const escena = uno('[data-escena]');
      if (hero && escena) {
        gsap.set(escena, { transformPerspective: 1100 });
        const giroX = gsap.quickTo(escena, 'rotationX', { duration: 0.8, ease: 'power3' });
        const giroY = gsap.quickTo(escena, 'rotationY', { duration: 0.8, ease: 'power3' });
        const capas = todos('[data-profundidad]').map((el) => ({
          x: gsap.quickTo(el, 'x', { duration: 1, ease: 'power3' }),
          y: gsap.quickTo(el, 'y', { duration: 1, ease: 'power3' }),
          k: Number(el.dataset['profundidad']) || 1,
        }));
        escuchar(hero, 'pointermove', (e) => {
          const r = hero.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          giroY(px * 14);
          giroX(-py * 10);
          for (const c of capas) {
            c.x(px * 46 * c.k);
            c.y(py * 34 * c.k);
          }
        });
        escuchar(hero, 'pointerleave', () => {
          giroX(0);
          giroY(0);
          for (const c of capas) {
            c.x(0);
            c.y(0);
          }
        });
      }

      // Marca gigante del pie: cada letra se ensancha y se aclara según lo cerca que esté el puntero.
      const pie = uno('.ld-footer');
      const marca = uno('[data-gigante]');
      if (pie && marca && letrasPie.length) {
        const reaccionar = (e: PointerEvent) => {
          for (const letra of letrasPie) {
            const r = letra.getBoundingClientRect();
            const distancia = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
            const cercania = gsap.utils.clamp(0, 1, 1 - distancia / (r.width * 1.8));
            gsap.to(letra, {
              fontStretch: `${62 + cercania * 38}%`,
              color: cercania > 0.55 ? '#ffffff' : '#ffc400',
              skewX: cercania * -8,
              duration: 0.5,
              ease: 'power3.out',
              overwrite: 'auto',
            });
          }
        };
        escuchar(marca, 'pointermove', reaccionar);
        escuchar(marca, 'pointerleave', () =>
          gsap.to(letrasPie, {
            fontStretch: '62%',
            color: '#ffc400',
            skewX: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.5)',
            stagger: 0.03,
          }),
        );
      }

      // Botones magnéticos: se acercan al puntero y vuelven con rebote.
      for (const boton of todos('[data-magnetico]')) {
        const x = gsap.quickTo(boton, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
        const y = gsap.quickTo(boton, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
        escuchar(boton, 'pointermove', (e) => {
          const r = boton.getBoundingClientRect();
          x((e.clientX - (r.left + r.width / 2)) * 0.3);
          y((e.clientY - (r.top + r.height / 2)) * 0.4);
        });
        escuchar(boton, 'pointerleave', () => {
          x(0);
          y(0);
        });
      }

      // Vista previa que sigue al puntero sobre la lista "Explora".
      const seccion = uno('.ld-explora');
      const lista = uno('[data-lista]');
      const vista = uno('[data-vista]');
      if (seccion && lista && vista) {
        const tarjetas = Array.from(vista.children) as HTMLElement[];
        gsap.set(vista, { xPercent: -50, yPercent: -50, scale: 0.5, autoAlpha: 0 });
        const vx = gsap.quickTo(vista, 'x', { duration: 0.7, ease: 'power3' });
        const vy = gsap.quickTo(vista, 'y', { duration: 0.7, ease: 'power3' });
        const giro = gsap.quickTo(vista, 'rotation', { duration: 0.9, ease: 'power3' });
        let ultimoX = 0;
        let activo = -1;
        escuchar(seccion, 'pointermove', (e) => {
          const r = seccion.getBoundingClientRect();
          vx(e.clientX - r.left);
          vy(e.clientY - r.top);
          giro(gsap.utils.clamp(-14, 14, (e.clientX - ultimoX) * 0.7));
          ultimoX = e.clientX;
        });
        escuchar(lista, 'pointerover', (e) => {
          const item = (e.target as HTMLElement).closest<HTMLElement>('[data-indice]');
          if (!item) return;
          const indice = Number(item.dataset['indice']);
          if (indice === activo) return;
          activo = indice;
          gsap.to(vista, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' });
          // Efecto "tragamonedas": la tarjeta activa entra y las demás salen en vertical.
          tarjetas.forEach((t, i) =>
            gsap.to(t, { yPercent: (i - indice) * 100, duration: 0.6, ease: 'expo.out' }),
          );
        });
        escuchar(lista, 'pointerleave', () => {
          activo = -1;
          gsap.to(vista, { autoAlpha: 0, scale: 0.5, duration: 0.35, ease: 'power3.in' });
        });
      }
    });
  }

  return () => {
    cancelado = true;
    for (const quitar of limpiezas) quitar();
    mm.revert();
    ctx.revert();
    gsap.ticker.remove(latido);
    lenis.destroy();
  };
}
