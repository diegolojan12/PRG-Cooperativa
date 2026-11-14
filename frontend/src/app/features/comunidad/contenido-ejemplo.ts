/**
 * CONTENIDO DE EJEMPLO para la vista previa de la comunidad.
 *
 * Los módulos Comunidad, Capacitaciones, Juegos, Retos y Recompensas llegan en sprints
 * posteriores. Mientras tanto la interfaz del socio se muestra con estas publicaciones
 * de muestra; el feed las reemplazará por datos reales de la API sin cambiar la pantalla.
 */
export type TipoPublicacion = 'anuncio' | 'programa' | 'reto' | 'comunidad';
export type Tono = 'amarillo' | 'azul' | 'marino';

export interface ComentarioEjemplo {
  autor: string;
  texto: string;
}
export interface PublicacionEjemplo {
  id: number;
  autor: string;
  rol: string;
  tipo: TipoPublicacion;
  etiqueta: string;
  tiempo: string;
  titulo: string;
  texto: string;
  /** Bloque ilustrado opcional (las publicaciones de socios son solo texto). */
  destacado?: string;
  icono?: string;
  tono?: Tono;
  puntos?: number;
  likes: number;
  comentarios: ComentarioEjemplo[];
}

export const PUBLICACIONES_EJEMPLO: readonly PublicacionEjemplo[] = [
  {
    id: 1,
    autor: 'Cooperativa Padre Julián Lorente',
    rol: 'Anuncio oficial',
    tipo: 'anuncio',
    etiqueta: 'Anuncio',
    tiempo: 'Hoy',
    titulo: 'Nueva campaña: recomienda y suma',
    texto:
      'Invita a tus amigos y familiares a ser parte de la cooperativa. Cada persona aprobada suma puntos a tu cuenta.',
    destacado: 'Recomienda y gana',
    icono: 'referidos',
    tono: 'amarillo',
    puntos: 100,
    likes: 48,
    comentarios: [{ autor: 'Carlos T.', texto: '¡Excelente! Ya envié mi primera invitación.' }],
  },
  {
    id: 2,
    autor: 'Equipo de Educación Financiera',
    rol: 'Capacitación',
    tipo: 'programa',
    etiqueta: 'Programa',
    tiempo: 'Hace 3 h',
    titulo: 'Taller: arma tu presupuesto en 4 pasos',
    texto:
      'Aprende a ordenar tus ingresos y gastos, y a fijar una meta de ahorro realista para este trimestre.',
    destacado: 'Presupuesto familiar',
    icono: 'book',
    tono: 'azul',
    puntos: 40,
    likes: 31,
    comentarios: [],
  },
  {
    id: 3,
    autor: 'Comunidad SUMA',
    rol: 'Reto semanal',
    tipo: 'reto',
    etiqueta: 'Reto',
    tiempo: 'Hace 1 día',
    titulo: 'Reto de la semana: ahorra sin sentirlo',
    texto:
      'Aparta una pequeña cantidad cada día durante 7 días. Completa el reto y desbloquea una insignia.',
    destacado: '7 días de ahorro',
    icono: 'gift',
    tono: 'marino',
    puntos: 70,
    likes: 64,
    comentarios: [
      { autor: 'María L.', texto: 'Voy en el día 3, ¡ánimo!' },
      { autor: 'Luis R.', texto: '¿Se puede empezar hoy mismo?' },
    ],
  },
  {
    id: 4,
    autor: 'Equipo de Bienestar',
    rol: 'Salud y bienestar',
    tipo: 'programa',
    etiqueta: 'Programa',
    tiempo: 'Hace 2 días',
    titulo: 'Pausas activas para tu jornada',
    texto:
      'Cinco minutos de estiramientos cada dos horas mejoran tu energía. Mira la guía rápida y compártela con tu equipo.',
    destacado: 'Cuida tu bienestar',
    icono: 'heart',
    tono: 'azul',
    likes: 22,
    comentarios: [],
  },
  {
    id: 5,
    autor: 'Cooperativa Padre Julián Lorente',
    rol: 'Anuncio oficial',
    tipo: 'anuncio',
    etiqueta: 'Anuncio',
    tiempo: 'Hace 4 días',
    titulo: 'Juega y aprende: trivia financiera',
    texto:
      'Pronto podrás jugar partidas cortas de trivia para reforzar tus conocimientos y sumar puntos.',
    destacado: 'Trivia financiera',
    icono: 'game',
    tono: 'marino',
    puntos: 25,
    likes: 39,
    comentarios: [],
  },
];

export interface EventoEjemplo {
  dia: string;
  mes: string;
  titulo: string;
  detalle: string;
}
export const EVENTOS: readonly EventoEjemplo[] = [
  { dia: '18', mes: 'NOV', titulo: 'Taller de presupuesto', detalle: 'Virtual · 18:30' },
  { dia: '25', mes: 'NOV', titulo: 'Charla de ahorro', detalle: 'Agencia matriz · 10:00' },
  { dia: '02', mes: 'DIC', titulo: 'Cierre del reto semanal', detalle: 'En línea' },
];

export interface SeccionEjemplo {
  titulo: string;
  descripcion: string;
  icono: string;
  tarjetas: { titulo: string; texto: string; icono: string; etiqueta: string }[];
}
/** Vista previa de cada módulo de la comunidad hasta que llegue su sprint. */
export const SECCIONES: Record<string, SeccionEjemplo> = {
  comunidad: {
    titulo: 'Comunidad',
    descripcion: 'Conoce a otros socios, comparte logros y participa en conversaciones.',
    icono: 'usuarios',
    tarjetas: [
      { titulo: 'Muro de la comunidad', texto: 'Publicaciones de socios y de la cooperativa.', icono: 'post', etiqueta: 'Próximamente' },
      { titulo: 'Grupos por intereses', texto: 'Ahorro, emprendimiento, familia y más.', icono: 'usuarios', etiqueta: 'Próximamente' },
    ],
  },
  aprende: {
    titulo: 'Capacitaciones y talleres',
    descripcion: 'Cursos cortos y talleres de educación financiera con evaluación y puntos.',
    icono: 'book',
    tarjetas: [
      { titulo: 'Presupuesto familiar', texto: 'Aprende a ordenar tus finanzas en 4 pasos.', icono: 'book', etiqueta: 'Curso' },
      { titulo: 'Ahorro con metas', texto: 'Define objetivos y mide tu avance.', icono: 'points', etiqueta: 'Curso' },
      { titulo: 'Crédito responsable', texto: 'Cuándo y cómo endeudarte con cuidado.', icono: 'roles', etiqueta: 'Taller' },
    ],
  },
  juegos: {
    titulo: 'Juegos',
    descripcion: 'Aprende jugando: trivias y desafíos financieros que suman puntos.',
    icono: 'game',
    tarjetas: [
      { titulo: 'Trivia financiera', texto: 'Preguntas rápidas para medir lo que sabes.', icono: 'game', etiqueta: 'Trivia' },
      { titulo: 'Simulador de ahorro', texto: 'Mira cómo crece tu dinero con el tiempo.', icono: 'tablero', etiqueta: 'Simulador' },
    ],
  },
  retos: {
    titulo: 'Retos',
    descripcion: 'Completa retos semanales, gana insignias y sube de nivel.',
    icono: 'gift',
    tarjetas: [
      { titulo: 'Ahorra sin sentirlo', texto: '7 días apartando una pequeña cantidad.', icono: 'gift', etiqueta: 'Semanal' },
      { titulo: 'Invita y suma', texto: 'Refiere personas y desbloquea premios.', icono: 'referidos', etiqueta: 'Referidos' },
    ],
  },
  recompensas: {
    titulo: 'Recompensas',
    descripcion: 'Canjea tus puntos por premios y beneficios exclusivos.',
    icono: 'points',
    tarjetas: [
      { titulo: 'Catálogo de premios', texto: 'Beneficios y artículos para canjear.', icono: 'gift', etiqueta: 'Próximamente' },
      { titulo: 'Mis insignias', texto: 'Tus logros en un solo lugar.', icono: 'check', etiqueta: 'Próximamente' },
    ],
  },
  bienestar: {
    titulo: 'Salud y bienestar',
    descripcion: 'Consejos y servicios de salud asociados a tu membresía.',
    icono: 'heart',
    tarjetas: [
      { titulo: 'Pausas activas', texto: 'Rutinas de 5 minutos para tu jornada.', icono: 'heart', etiqueta: 'Guía' },
      { titulo: 'Servicios de salud', texto: 'Convenios y beneficios disponibles.', icono: 'roles', etiqueta: 'Próximamente' },
    ],
  },
};
