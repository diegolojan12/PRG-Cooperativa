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
