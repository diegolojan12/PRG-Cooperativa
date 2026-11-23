# Plan técnico · Interfaz clara, avisos y ayuda en formularios

Especificación: [`especificacion.md`](especificacion.md) · Estado: Implementado

## 1. Chequeo contra la constitución

| Principio | ¿Se cumple? | Nota |
| --------- | ----------- | ---- |
| II. Nada quemado | Sí | El menú sale de los módulos del rol que entrega el servidor |
| VI. Accesibilidad | Sí | Roles ARIA en avisos; `aria-describedby` de ayuda y error en cada control |
| VII. Arquitectura | Sí | Componentes compartidos en `frontend/src/app/shared/` |

## 2. Componentes

| Pieza | Archivo | Criterios |
| ----- | ------- | --------- |
| `AvisoService` (éxito 5 s, error 8 s, mínimo 4 s) | `core/ui/aviso.service.ts` | CA-03 |
| `AvisoComponent` (color, icono, `role` alert/status, botón cerrar) | `shared/aviso/aviso.component.ts` | CA-03, CA-04 |
| `CampoComponent` (ayuda obligatoria, error con causa) | `shared/campo/campo.component.ts` | CA-05, CA-06 |
| Shell del panel (menú desplegable bajo 768 px) | `layout/shell.component.*`, `css/panel.css` | CA-01, CA-02 |
| Shell Comunidad (barra inferior + «Más») | `layout/comunidad-shell.component.*`, `css/comunidad.css` | CA-02 |
| Errores del servidor por campo (`campos`) | `core/http/api-error.ts` | CA-06 |

## 3. Estrategia de pruebas

| Criterio | Prueba |
| -------- | ------ |
| CA-01, CA-07 | `features.spec.ts` · «Menú por rol (HU-002, RF-08-3)» |
| CA-02 | `e2e/smoke.cjs` · «móvil, menú por rol y acceso denegado» (390 px) |
| CA-03, CA-04 | `auth.spec.ts` · «un 403 muestra un aviso de error» · revisión de `AvisoComponent` |
| CA-05, CA-06 | `features.spec.ts` · «Campos con ayuda y error (RF-49-1, RF-49-2)» y «no deshabilita el envío… (RNF-16)» |

## Dashboard del gestor · 2026-11-19

Componente independiente cargado en la entrada no administrativa del panel. Datos ilustrativos locales etiquetados, enlaces derivados del menú autorizado, estilos encapsulados y ajustes del shell limitados a esta experiencia. Verificar compilación, lint, pruebas y capturas en escritorio y móvil.

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
| Modelo UML vigente | [SUMA-Diagramas_Vistas_Textos_Centrados.eapx](../../../SUMA-Diagramas_Vistas_Textos_Centrados.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
