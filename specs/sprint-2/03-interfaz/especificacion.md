# Especificación · Interfaz clara, avisos y ayuda en formularios

| Campo | Valor |
| ----- | ----- |
| Épicas | EPI-04 |
| Sprint | 2 |
| Historias | HU-008 · HU-009 · HU-010 |
| Requisitos de usuario | UR-04 · UR-53 |
| Requisitos funcionales | RF-49 · RF-49-1 · RF-49-2 · RF-49-3 · RF-49-4 |
| No funcionales | RNF-15 · RNF-16 · RNF-17 · RNF-18 |
| Casos de uso (EAPX) | Transversal: UR-53 no requiere caso de uso propio; el menú adaptable es parte de CU-02.4 Cargar el menú y los permisos del rol |
| Estado | Implementada · Verificada |
| Origen | CA-13 de `sprint-1/01-roles-y-permisos` y la sección «Historias transversales» del README del Sprint 1 (auditoría G16, G17, G20) |

## 1. Problema y objetivo

Socios de todas las edades, muchos desde el celular, tienen que entender cada pantalla sin ayuda: qué dato pide cada
campo, si una acción salió bien o mal y cómo corregir un error.

## 2. Actores

| Actor | Qué puede hacer |
| ----- | --------------- |
| Todos los usuarios | Navegar con el menú de su rol en cualquier tamaño de pantalla; recibir avisos y ayuda en cada formulario. |

## 3. Historias de usuario

- **HU-008 · Interfaz clara** — Como usuario, quiero una interfaz visual clara y fácil de entender para navegar
  cómodamente por las secciones. Criterio del backlog: el diseño se adapta a la pantalla y tiene menús accesibles.
- **HU-009 · Mensajes y alertas** — Como usuario, quiero interactuar con mensajes y alertas visuales para estar informado
  de lo que pasa. Criterio del backlog: aparecen avisos al realizar una acción con éxito o error.
- **HU-010 · Ayuda en formularios** — Como usuario, quiero asistencia visual en los formularios para entender qué
  información debo llenar. Criterio del backlog: todos los campos tienen textos de ayuda o ejemplos.

## 4. Criterios de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | RF-49-4 · HU-008 | una pantalla de 768 px o más | se abre la plataforma | se ve el menú completo del rol (antes `sprint-1/01` · CA-13) |
| CA-02 | RF-49-4 · RNF-18 | una pantalla de menos de 768 px (probado a 390 px) | se abre la plataforma | el menú es desplegable en el panel, o barra inferior + «Más» en la experiencia Comunidad, sin desplazamiento horizontal |
| CA-03 | RF-49-3 · HU-009 | cualquier acción | termina con éxito o con error | aparece 1 aviso que se distingue por color, icono y texto, visible 4 s como mínimo o hasta que el usuario lo cierre |
| CA-04 | HU-009 · RNF-15 | un aviso de error | se muestra | se anuncia a lectores de pantalla (`role="alert"`; el de éxito usa `role="status"`) |
| CA-05 | RF-49-1 · HU-010 | cualquier campo de un formulario | se muestra | tiene un texto de ayuda o un ejemplo debajo |
| CA-06 | RF-49-2 · RNF-16 | un campo con error | se valida | se marca en rojo y debajo dice la causa y la corrección esperada |
| CA-07 | RF-08-3 | un usuario | entra a la plataforma | el menú solo tiene los módulos de su rol (detalle en `sprint-1/01-roles-y-permisos`) |

## 5. Reglas de negocio

1. Un solo sistema de avisos para toda la aplicación (`AvisoService`): no se crean avisos propios por pantalla.
2. El componente de campo no compila si le falta el texto de ayuda (la ayuda es obligatoria por diseño).
3. Los botones de envío no se deshabilitan para «evitar» errores: se marcan los campos y se explica la causa.

## 6. Fuera de alcance

- Versión en inglés (RNF-26, «No tendrá»).
- Aplicación nativa (la Visión pide web adaptable).

## 7. Requisitos no funcionales aplicables

- RNF-15 — WCAG 2.2 AA (revisión con axe o WAVE pendiente: [`docs/PROTOCOLO-PRUEBAS-USUARIOS.md`](../../../docs/PROTOCOLO-PRUEBAS-USUARIOS.md), prueba 8).
- RNF-16 — Causa y corrección en el 100 % de los errores de validación.
- RNF-17 — Navegadores: Chrome, Edge, Firefox y Safari (prueba 7 del protocolo).
- RNF-18 — De 360 a 1 920 px sin desplazamiento horizontal.

## 8. Preguntas abiertas

Ninguna.

## 9. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11 | Auditoría G16 (ayuda obligatoria en campos), G17 (avisos distinguibles), G20 (menú móvil) | Equipo |
| 2026-11-16 | Spec propia del Sprint 2 (HU-008 a HU-010 son del Sprint 2 según el backlog) | Equipo |

## Refinamiento visual del gestor · 2026-11-19

Dashboard de entrada para la interfaz Administración sin privilegios de administrador. Combina bienvenida, accesos permitidos, indicadores y agenda de ejemplo. Se identifica como vista previa; no incorpora campañas, persistencia ni operaciones de publicación. Los permisos siguen determinados por el servidor. Texto con contraste mínimo 4,5:1, foco visible y adaptación móvil.

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 2 |
| Historias | HU-008 · HU-009 · HU-010 |
| Épicas de BKL-G1 | EPI-04 |
| Requisitos de usuario | UR-04 · UR-53 |
| Requisitos funcionales | RF-49 · RF-49-1 · RF-49-2 · RF-49-3 · RF-49-4 |
| Requisitos no funcionales | RNF-15 · RNF-16 · RNF-17 · RNF-18 |
| Casos de uso | Transversal: UR-53 no requiere caso de uso propio; el menú adaptable es parte de CU-02.4 Cargar el menú y los permisos del rol |
| Diagram_ID de comportamiento | 33 Activity; 34 Sequence |
| Modelo UML vigente | [SUMA-Diagramas_Vistas_Textos_Centrados.eapx](../../../entregables/SUMA-Diagramas_Vistas_Textos_Centrados.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
