# Sprint 1 · Roles, permisos y sesión

| Campo | Valor |
| ----- | ----- |
| Estado | Base funcional implementada y verificada (PR #1); cierre integral pendiente de correo real, tiempos con usuarios y custodia de clave (auditoría 2026-11-19) |
| Semanas | 9–10 |
| Historias | **HU-001 · HU-002 · HU-003** (columna *Sprint* de la hoja `BKL-G1`) |
| Objetivo | Que administradores, gestores y socios entren de forma segura y vean solo lo que les corresponde según su rol |
| Modo SDD | Documentado **a posteriori**: las specs se escribieron a partir del código y de las pruebas que ya pasan |
| Reorganización | El 2026-11-16 se alineó con el backlog. HU-004 a HU-012 se habían construido y documentado aquí, pero son del Sprint 2: sus specs están ahora en [`sprint-2/`](../sprint-2/README.md) |

## Funcionalidades

| # | Funcionalidad | HU | Casos de uso | Spec | Plan | Tareas | Estado |
| - | ------------- | -- | ------------ | ---- | ---- | ------ | ------ |
| 01 | Roles, permisos y menú según el rol | HU-001, HU-002 | CU-16, CU-17, CU-02.4 | [spec](01-roles-y-permisos/especificacion.md) | [plan](01-roles-y-permisos/plan.md) | [tareas](01-roles-y-permisos/tareas.md) | Verificada |
| 02 | Sesión y acceso | HU-003 | CU-02, CU-02.1, CU-02.2, CU-02.6 | [spec](02-sesion-y-acceso/especificacion.md) | [plan](02-sesion-y-acceso/plan.md) | [tareas](02-sesion-y-acceso/tareas.md) | Verificada |
| 03 | Protección de datos en reposo (transversal) | RNF-05 | — | [spec](03-proteccion-datos/especificacion.md) | [plan](03-proteccion-datos/plan.md) | [tareas](03-proteccion-datos/tareas.md) | Verificada |

## Matriz de trazabilidad

| HU | Épica | UR | RF / RNF | Caso de uso | Criterios | Prueba (`backend/test/sprint.test.mjs` salvo indicación) |
| -- | ----- | -- | -------- | ----------- | --------- | -------------------------------------------------------- |
| HU-001 Roles y permisos | EPI-01 | UR-04 | RF-08, RF-08-1, RF-08-2, RF-08-5 · RNF-13 | CU-16, CU-17 | 01 · CA-01 a CA-07, CA-11, CA-12 | `HU-001: roles y permisos…` · `RF-08: permisos por rol…` · `RF-08-1 / RF-08-4` · `RF-08-2` |
| HU-002 Acceso a módulos | EPI-01 | UR-04 | RF-08-3, RF-08-4 | CU-02.4 | 01 · CA-08 a CA-10 | `RF-08-1 / RF-08-4` · `features.spec.ts` · `auth.spec.ts` |
| HU-003 Sesión | EPI-02 | UR-03 | RF-04-1 a RF-04-4 · RNF-04, RNF-06, RNF-12, RNF-14 | CU-02, CU-02.1, CU-02.2, CU-02.6 | 02 · CA-01 a CA-10, CA-17, CA-18 | `RF-04-1 / RNF-06` · `RF-04-2` · `RF-04-3` · `RF-04-4` · `producción nunca expone…` · `e2e/smoke.cjs` |
| Transversal | — | UR-51 | RNF-05 | — | 03 · CA-01 a CA-07 | `RNF-05: migra datos personales…` · `RNF-05: producción no arranca sin SUMA_DATA_KEY` |

## Brechas de la auditoría (G01–G24) que cubre este sprint

| Funcionalidad | Brechas |
| ------------- | ------- |
| 01 · Roles y permisos | G02, G14, G19 |
| 02 · Sesión y acceso | G03, G04, G05, G18 |
| 03 · Protección de datos | G09 |
| Transversales | G22 (ESLint y pre-commit), G23 (dependencias sin uso y PWA) |

Las demás brechas (G01, G06–G08, G10–G13, G15–G17, G20, G21, G24) están en las specs del Sprint 2.

## Decisiones abiertas con el Product Owner

| # | Decisión | Spec | Estado |
| - | -------- | ---- | ------ |
| 1 | ¿Permisos por persona o solo por rol? | 01 · P-01 | Propuesta en RF-08-1: por rol. Falta confirmación |
| 2 | RF-08-1 «3 roles» frente a HU-001 «gestionar roles» | 01 · P-02 | Propuesta en RF-08-1: 3 roles base y roles adicionales. Falta confirmación |
| 3 | Custodia de `SUMA_DATA_KEY` en producción | 03 · P-01 | Abierta |

## Verificación del sprint (2026-11-16)

| Comando | Resultado |
| ------- | --------- |
| `cd backend && npm run test:sprint` | 32/32 pasan (todas las pruebas de los Sprints 1 a 3) |
| `cd backend && npm run lint` | 0 errores |
| `cd frontend && npx ng test --watch=false` | 17/17 pasan |
| `cd frontend && npx ng lint && npx ng build` | 0 errores; build con carga diferida |
| `cd e2e && node smoke.cjs` | Pasa: 2FA del administrador, menú por rol y móvil a 390 px |

CA-18 de sesión cuenta con prueba automatizada en `backend/test/correo.test.mjs` desde el 2026-11-19. La cola sigue en memoria y la medición de entrega externa RNF-14 permanece pendiente.

## Documentos previos (evidencia histórica)

- [`docs/SPRINT1-HU-001-002-003.md`](../../docs/SPRINT1-HU-001-002-003.md) — análisis de HU-001 a HU-003 y del diagrama de clases.
- [`docs/CORRECCIONES-AUDITORIA-SPRINT1.md`](../../docs/CORRECCIONES-AUDITORIA-SPRINT1.md) — estado de las brechas G01–G24.
- [`docs/LABORATORIO.md`](../../docs/LABORATORIO.md) — cómo ejecutar la plataforma y montar el laboratorio de 3 PC.

## Referencias vigentes

Actualización documental del 22 de noviembre de 2026. Consultar [la matriz de trazabilidad](../TRAZABILIDAD.md) para identificadores, épicas, sprints y modelo UML. HU-055 es duplicada de HU-023/S3; HU-056 y HU-057 se mantienen en S5. Los registros históricos conservan su fecha y las verificaciones pendientes conservan su estado.
