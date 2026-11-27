# Tareas · Interfaz clara, avisos y ayuda en formularios

Plan: [`plan.md`](plan.md) · Estado: Completado (falta la revisión formal de accesibilidad)

- [x] T01 — `AvisoService` y `AvisoComponent` únicos para toda la aplicación (CA-03, CA-04 · G17)
- [x] T02 — `CampoComponent` con ayuda obligatoria y error con causa y corrección (CA-05, CA-06 · G16)
- [x] T03 — Menú completo desde 768 px y desplegable en pantallas menores (CA-01, CA-02 · G20)
- [x] T04 — Barra inferior + «Más» en la experiencia Comunidad (CA-02)
- [x] T05 — Pruebas en `features.spec.ts`, `auth.spec.ts` y `e2e/smoke.cjs`
- [ ] T06 — Revisión con axe o WAVE y navegación con teclado (RNF-15)
- [ ] T07 — Prueba en Chrome, Edge, Firefox y Safari y de 360 a 1 920 px (RNF-17, RNF-18)

## Verificación (2026-11-16)

| Criterio | Prueba | ¿Pasa? |
| -------- | ------ | ------ |
| CA-01, CA-07 | `features.spec.ts` | Sí |
| CA-02 | `e2e/smoke.cjs` (390 px) | Sí |
| CA-03, CA-04 | `auth.spec.ts` | Sí |
| CA-05, CA-06 | `features.spec.ts` | Sí |

## Refinamiento del dashboard del gestor

- [x] T08 — Vista previa de contenidos con bienvenida y accesos según permisos.
- [x] T09 — Verificar contraste, navegación, escritorio y móvil sin añadir lógica de campañas.


Verificación del refinamiento (2026-11-19): compilación y lint correctos; 18 pruebas unitarias aprobadas. Chromium: gestor en 1440, 768, 390 y 360 px, sin desbordamiento de página, menú móvil y permisos verificados. Se midieron 73 textos visibles del dashboard: contraste mínimo 5,89:1 sobre sus fondos calculados. No equivale a una auditoría completa WCAG. Capturas en `.local/test-results/SUMA-gestor-*.png`. Las ocho pantallas de administrador pasaron; la regresión general posterior se detuvo por tiempo de espera al iniciar sesión como socio. Advertencia no bloqueante de compilación: CSS del componente 6,88 kB frente a presupuesto recomendado de 4 kB (límite de error 8 kB). No se modificó Jira ni se implementaron campañas o lógica de contenidos.

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
| Modelo UML vigente | [SUMA-Diagramas_Vistas.eapx](../../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
