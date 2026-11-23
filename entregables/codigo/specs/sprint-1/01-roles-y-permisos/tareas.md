# Tareas · Roles, permisos y menú según el rol

Plan: [`plan.md`](plan.md) · Estado: Completado

## Fase 1 · Datos

- [x] T01 — Tablas `Rol` y `Modulo` en `sprint1-roles.sql` (CA-01)
- [x] T02 — Semilla `catalogo-inicial.mjs` con 16 módulos y 3 roles, sin pisar cambios (CA-01)

## Fase 2 · Pruebas

- [x] T03 — Prueba `HU-001: roles y permisos se crean, editan y eliminan…` (CA-02, CA-03, CA-04, CA-06, CA-08)
- [x] T04 — Prueba `RF-08-1 / RF-08-4` (CA-01, CA-07, CA-10, CA-11)
- [x] T05 — Prueba `RF-08: permisos por rol se aplican de inmediato` (CA-05)

## Fase 3 · Backend

- [x] T06 — `Rol.crear` y `Rol#validarPermisos` en `dominio/acceso.mjs` (CA-02, CA-04)
- [x] T07 — Endpoints `/roles`, `/roles/:rol`, `/roles/opciones`, `/modulos` (CA-02 a CA-07)
- [x] T08 — `/auth/me` y login devuelven `menu` e `interfaz` (CA-08, CA-09)
- [x] T09 — Autorización por módulo y `alcanceGlobal` en cada petición (CA-05, CA-10)
- [x] T10 — Regla "al menos un administrador activo" (CA-11)
- [x] T11 — Bitácora estructurada de roles, `objetivoId` + `rolAnterior/rolNuevo` (CA-12 · auditoría G14)

## Fase 4 · Frontend

- [x] T12 — Pantalla Roles y permisos (`roles.page.ts`) (CA-02 a CA-06)
- [x] T13 — `authGuard`, `moduloGuard`, `interfazMatch`, `esAdminMatch` y carga diferida (CA-09, CA-10 · G19)
- [x] T14 — `ShellComponent` y `ComunidadShellComponent` dibujan `menu` (CA-08, CA-09)
- [x] T15 — Menú desplegable bajo 768 px (trasladado con CA-13 a `sprint-2/03-interfaz`)
- [x] T16 — Rol Gestor de contenidos con sus límites (G02)

## Fase 5 · Cierre

- [x] T17 — Análisis del diagrama de clases (`Rol`, `Modulo`, `Sesion`) en `docs/SPRINT1-HU-001-002-003.md`
- [x] T18 — P-01 y P-02: propuesta escrita en RF-08-1 de la ERS (2026-11-16); falta la confirmación del PO

## Verificación

| Comando | Resultado | Fecha |
| ------- | --------- | ----- |
| `cd backend && npm run test:sprint` | Pasa | Cierre del Sprint 1 |
| `cd frontend && npx ng test --watch=false` | Pasa | Cierre del Sprint 1 |
| `cd e2e && node smoke.cjs` | Pasa | Cierre del Sprint 1 |

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01 | `RF-08-1 / RF-08-4` | Sí |
| CA-02 | `HU-001: roles y permisos…` | Sí |
| CA-03 | `HU-001: roles y permisos…` | Sí |
| CA-04 | `HU-001` · `RF-08: permisos por rol…` | Sí |
| CA-05 | `RF-08: permisos por rol se aplican de inmediato` | Sí |
| CA-06 | `HU-001: roles y permisos…` | Sí |
| CA-07 | `HU-001` · `RF-08-1 / RF-08-4` | Sí |
| CA-08 | `HU-001` · `RF-04-1 / RNF-06` | Sí |
| CA-09 | `RF-04-1 / RNF-06` (`interfaz`) | Sí |
| CA-10 | `RF-08-1 / RF-08-4` · `features.spec.ts` | Sí |
| CA-11 | `RF-08-1 / RF-08-4` | Sí |
| CA-12 | `RF-14 / RF-14-2 / RF-42` | Sí |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 1 |
| Historias | HU-001 · HU-002 |
| Épicas de BKL-G1 | EPI-01 |
| Requisitos de usuario | UR-04 |
| Requisitos funcionales | RF-08 · RF-08-1 · RF-08-2 · RF-08-3 · RF-08-4 · RF-08-5 |
| Requisitos no funcionales | RNF-13 · RNF-15 · RNF-18 |
| Casos de uso | CU-16 Gestionar roles y permisos · CU-17 Gestionar usuarios de la plataforma · CU-02.4 Cargar el menú y los permisos del rol (include de CU-02) |
| Diagram_ID de comportamiento | 63 Sequence; 64 Activity; 65 Sequence; 66 Activity; 67 Sequence; 68 Activity |
| Modelo UML vigente | [SUMA-Diagramas_Vistas_Textos_Centrados.eapx](../../../../SUMA-Diagramas_Vistas_Textos_Centrados.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
