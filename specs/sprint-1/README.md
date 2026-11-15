# Sprint 1 · Acceso, roles, referidos y administración

| Campo | Valor |
| ----- | ----- |
| Estado | Implementado y verificado (fusionado en `main`, PR #1 de `sprint-1`) |
| Objetivo | Que socios, gestores y administradores entren de forma segura, vean solo lo que les corresponde, y que el ciclo básico del referido (alta → dictamen → puntos) funcione con trazabilidad completa |
| Modo SDD | Documentado **a posteriori**: las specs se escribieron a partir del código y de las pruebas que ya pasan |

## Funcionalidades

| # | Funcionalidad | HU | Spec | Plan | Tareas | Estado |
| - | ------------- | -- | ---- | ---- | ------ | ------ |
| 01 | Roles, permisos y menú según el rol | HU-001, HU-002, HU-008 | [spec](01-roles-y-permisos/especificacion.md) | [plan](01-roles-y-permisos/plan.md) | [tareas](01-roles-y-permisos/tareas.md) | Verificada |
| 02 | Sesión, acceso y registro | HU-003, HU-004 | [spec](02-sesion-y-acceso/especificacion.md) | [plan](02-sesion-y-acceso/plan.md) | [tareas](02-sesion-y-acceso/tareas.md) | Verificada · 1 prueba pendiente |
| 03 | Gestión de referidos | HU-011, HU-012 | [spec](03-referidos/especificacion.md) | [plan](03-referidos/plan.md) | [tareas](03-referidos/tareas.md) | Verificada · 1 prueba pendiente |
| 04 | Administración: usuarios, configuración, bitácora, tablero | HU-005, HU-006, HU-007 | [spec](04-administracion/especificacion.md) | [plan](04-administracion/plan.md) | [tareas](04-administracion/tareas.md) | Verificada · 1 prueba pendiente |
| 05 | Protección de datos en reposo | RNF-05 | [spec](05-proteccion-datos/especificacion.md) | [plan](05-proteccion-datos/plan.md) | [tareas](05-proteccion-datos/tareas.md) | Verificada · 1 prueba pendiente |

## Matriz de trazabilidad

| Requisito | Spec · criterio | Prueba (`backend/test/sprint.test.mjs` salvo indicación) |
| --------- | --------------- | -------------------------------------------------------- |
| HU-001 · RF-08 | 01 · CA-02 a CA-07 | `HU-001: roles y permisos se crean, editan y eliminan sin tocar el código` · `RF-08: permisos por rol se aplican de inmediato` |
| RF-08-1 · RF-08-4 | 01 · CA-01, CA-10, CA-11 | `RF-08-1 / RF-08-4: 3 roles y acceso denegado en servidor` |
| HU-002 · RF-08-3 | 01 · CA-08, CA-09 | `HU-001…` · `RF-04-1 / RNF-06` · `features.spec.ts` |
| RF-08-5 · RNF-13 | 01 · CA-12 | `RF-14 / RF-14-2 / RF-42` |
| HU-008 · RF-49-4 · RNF-18 | 01 · CA-13 | `e2e/smoke.cjs` (390 px) |
| HU-003 · RF-04-1 · RNF-06 | 02 · CA-01 a CA-05 | `RF-04-1 / RNF-06: credenciales, origen y segundo factor del administrador` |
| RF-04-2 | 02 · CA-06 | `RF-04-2: bloqueo de 15 minutos tras 5 intentos fallidos consecutivos` |
| RF-04-3 | 02 · CA-07, CA-08 | `RF-04-3: la sesión se renueva…` · `auth.spec.ts` |
| RF-04-4 | 02 · CA-09, CA-10 | `RF-04-4: desactivar cuenta y cerrar sesión` |
| HU-004 · RF-07 | 02 · CA-11 a CA-13 | `RF-07: recuperación de un solo uso que revoca sesiones` |
| RNF-12 (códigos) | 02 · CA-17 | `producción nunca expone enlaces ni códigos` |
| RNF-14 | 02 · CA-18 | — (pendiente) |
| HU-011 · HU-012 · RF-11 · RF-11-3 · RNF-12 | 03 · CA-01 a CA-08 | `RF-11 / RNF-12: valida, rechaza código, evita duplicados y pagina de 20` · `días hábiles…` |
| RF-11-4 | 03 · CA-09 a CA-13 | `RF-11-4: dictamen reservado a administración y con cuenta vinculada aprobada` |
| RF-11-5 | 03 · CA-17, CA-18 | `RF-11-5: asociación manual dentro de 30 días` (falta el caso de 30 días) |
| HU-011 · RF-11-6 | 03 · CA-14 a CA-16 | `RF-11-6: baja lógica que conserva el historial` |
| RF-08-2 | 04 · CA-01 a CA-03 | `RF-08-2: solo el administrador crea cuentas de Gestor o Administrador` |
| HU-006 · RF-14 · RF-14-1 · RF-14-2 | 04 · CA-06 a CA-09 | `RF-14 / RF-14-2 / RF-42: configuración y bitácora completa` |
| HU-007 · RF-42 · RF-42-1 · RF-42-2 | 04 · CA-10 a CA-12 | `RF-14 / RF-14-2 / RF-42` |
| HU-005 · RF-45-1 | 04 · CA-13 a CA-15 | `RF-45-1: tablero con 6 indicadores` |
| RNF-05 | 05 · CA-01 a CA-06 | `RNF-05: migra datos personales y conserva acceso y unicidad por correo` |

## Historias transversales de interfaz (EPI-04)

| HU | Criterio del backlog | Dónde se cumple | Prueba |
| -- | -------------------- | --------------- | ------ |
| HU-008 · Interfaz clara | El diseño se adapta a la pantalla y tiene menús accesibles | Spec 01 · CA-13; `panel.css`, `comunidad.css` | `e2e/smoke.cjs` (390 px) |
| HU-009 · Mensajes y alertas | Avisos al terminar una acción con éxito o error | `AvisoService` + `AvisoComponent` (rol `alert`/`status`, color e icono) — auditoría G17 | `features.spec.ts` (avisos) |
| HU-010 · Ayuda en formularios | Todos los campos tienen textos de ayuda o ejemplos | `CampoComponent` con ayuda obligatoria — auditoría G16 | `features.spec.ts` (campos) |

## Brechas de la auditoría (G01–G24) por funcionalidad

| Funcionalidad | Brechas |
| ------------- | ------- |
| 01 · Roles y permisos | G02, G14, G19, G20 |
| 02 · Sesión y acceso | G03, G04, G05, G18, G21 |
| 03 · Referidos | G01, G06, G08, G11 (dictamen), G12 |
| 04 · Administración | G07, G10, G11 (revisión de cuentas), G13, G15 |
| 05 · Protección de datos | G09 |
| Transversales | G16 = **HU-010** (ayuda y error en todos los campos: `CampoComponent`), G17 = **HU-009** (avisos distinguibles: `AvisoService`), G22 (ESLint y pre-commit), G23 (dependencias sin uso y PWA) |
| **Pendiente** | G24 — respaldo diario y retención de 5 años → [`backlog.md`](../backlog.md) |

## Decisiones abiertas con el Product Owner

| # | Decisión | Spec |
| - | -------- | ---- |
| 1 | ¿Permisos por persona (`UsuarioPermiso`) o solo por rol? | 01 · P-01 |
| 2 | RF-08-1 "exactamente 3 roles" frente a HU-001 "gestionar roles" | 01 · P-02 |
| 3 | ~~¿El registro pide aceptar aviso de privacidad y términos?~~ Resuelta: sí, HU-013 / RF-47 (Sprint 2) | 02 · P-02 |
| 4 | ¿El socio puede dar de baja sus referidos *Pendientes*? | 03 · P-01 |
| 5 | ~~Números de HU~~ Resuelta con el backlog `BKL-G1`: HU-004, HU-005 a HU-007, HU-008 a HU-010, HU-011 y HU-012 | 02, 03, 04 · P-01 |
| 6 | ¿Se mantiene "SUMA" como nombre del producto? | 04 · P-02 |
| 7 | Custodia de `SUMA_DATA_KEY` en producción | 05 · P-01 |

## Pruebas pendientes para cerrar el sprint al 100 %

1. Reintentos de correo (02 · CA-18).
2. Límite de 30 días en la asociación manual (03 · CA-18).
3. Revisión de cuentas vinculadas por API (04 · CA-05).
4. Arranque en producción sin `SUMA_DATA_KEY` (05 · CA-07).

## Verificación del sprint

| Comando | Qué cubre |
| ------- | --------- |
| `cd backend && npm run test:sprint` | 18 pruebas de integración y criterios de aceptación (PostgreSQL, esquema aislado) |
| `cd frontend && npx ng test --watch=false` | 16 pruebas: guards, inactividad, avisos, menú por rol, campos, listado, baja, configuración |
| `cd frontend && npx ng lint && npx ng build` | 0 errores de lint; build con carga diferida |
| `cd e2e && node smoke.cjs` | Flujo completo en Chromium: 2FA, tablero, CRUD + dictamen + baja, configuración, móvil 390 px, recuperación, registro |

## Documentos previos (evidencia histórica)

- [`docs/SPRINT1-HU-001-002-003.md`](../../docs/SPRINT1-HU-001-002-003.md) — análisis de HU-001 a HU-003 y del diagrama de clases.
- [`docs/CORRECCIONES-AUDITORIA-SPRINT1.md`](../../docs/CORRECCIONES-AUDITORIA-SPRINT1.md) — estado de las brechas G01–G24.
- [`docs/LABORATORIO.md`](../../docs/LABORATORIO.md) — cómo ejecutar la plataforma y montar el laboratorio de 3 PC.
