# Tareas · Administración: usuarios, configuración, bitácora y tablero

> Revisión de auditoría 2026-11-26: la validación de cuentas y referidos es automática contra la base institucional autorizada. El administrador solo consulta. La implementación y las pruebas de esta revisión están pendientes; la evidencia del flujo manual es histórica. Véase [validación automática](../../validacion-automatica.md).

Plan: [`plan.md`](plan.md) · Estado: Base implementada; bienvenida de HU-006 y programación del respaldo pendientes

## Fase 1 · Datos

- [x] T01 — `Configuracion` y `Actividad` (`sprint1.sql`)
- [x] T02 — `ip`, `objetivoId`, `datos` y trigger `actividad_inmutable` (`sprint1-auditoria.sql`) (CA-10, CA-12)
- [x] T03 — Fechas de solicitud y revisión de la cuenta vinculada (`sprint1-dominio.sql`) (CA-05)

## Fase 2 · Pruebas

- [x] T04 — `RF-08-2`, `RF-14 / RF-14-2 / RF-42`, `RF-45-1`
- [x] T05 — Prueba de API de la revisión de cuentas vinculadas (CA-05): `HU-015 / HU-016 / RF-06` y `RF-11: vinculación…`

## Fase 3 · Backend

- [x] T06 — Alta de Gestor/Admin con enlace de activación de 24 h (CA-01 a CA-03 · G15)
- [x] T07 — Revisión de cuentas pendientes (CA-05 · G11)
- [x] T08 — `ParametroGlobal` y validación de configuración (CA-06 a CA-08)
- [x] T09 — Una fila de bitácora por parámetro cambiado (CA-09 · G13)
- [x] T10 — Bitácora con IP, 50 por página y filtros (CA-10, CA-11 · G07)
- [x] T11 — `GET /indicadores` con 6 indicadores (CA-13 a CA-15 · G10)
- [x] T17 — Usuarios activos sin inicios de sesión y roles por `ROLES_PARTICIPANTES` (CA-17 · 2026-11-16)
- [x] T18 — `backend/scripts/respaldo.mjs` y `npm run db:respaldo` (CA-16 · G24 · 2026-11-16)
- [ ] T19 — Programar `npm run db:respaldo` en el servidor (diario, 02:00)

## Fase 4 · Frontend

- [x] T12 — `TableroPage` separado de `ResumenPage` (CA-13 · G10)
- [x] T13 — Usuarios: alta, cambio de rol, activar/desactivar, cuentas pendientes (CA-01, CA-04, CA-05)
- [x] T14 — Configuración con ayuda y error por campo (CA-06 a CA-08)
- [x] T15 — Registro de actividad con filtros y paginación (CA-11)

## Fase 5 · Cierre

- [x] T16 — Números de HU confirmados con el backlog (P-01)

## Verificación

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01 a CA-03 | `RF-08-2` | Sí |
| CA-04 | `RF-04-4` · `HU-001` | Sí |
| CA-05 | `HU-015 / HU-016 / RF-06` · `RF-11: vinculación…` | Sí |
| CA-06 a CA-12 | `RF-14 / RF-14-2 / RF-42` | Sí |
| CA-13, CA-14 | `RF-45-1` | Sí |
| CA-15 | `RF-08-1 / RF-08-4` | Sí |
| CA-16 | Ejecución manual de `npm run db:respaldo` (2026-11-16, 34,6 KB) | Sí, falta programarlo |
| CA-17 | `RF-45-1: tablero con 6 indicadores` | Sí |

## Pendiente de integración de HU-006

- [ ] T20 — Aplicar `mensajeBienvenida` en los inicios actuales previstos y verificar guardar configuración → abrir inicio → mostrar el valor (CA-08, RF-14). La persistencia de API está probada; esa prueba no cubre el consumo visual.

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad revisada al 26 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 2 |
| Historias | HU-005 · HU-006 · HU-007 |
| Épicas de BKL-G1 | EPI-03 |
| Requisitos de usuario | UR-04 · UR-46 · UR-48 · UR-49 |
| Requisitos funcionales | RF-08-2 · RF-14 · RF-14-1 · RF-14-2 · RF-14-3 · RF-14-4 · RF-42 · RF-42-1 · RF-42-2 · RF-45-1 |
| Requisitos no funcionales | RNF-08 · RNF-09 · RNF-13 · RNF-15 |
| Casos de uso | CU-17 Gestionar usuarios de la plataforma · CU-19 Configurar los parámetros (CU-19.1 puntos por acción, CU-19.2 versión de los términos) · CU-20 Consultar la bitácora (CU-20.1 filtrar) · CU-15 Consultar indicadores |
| Diagram_ID de comportamiento | 71 Sequence; 72 Activity; CU-15 (tablero) y CU-20 (bitácora) tienen vistas Use Case 18 y 29, sin pareja de comportamiento propia |
| Modelo UML revisado: casos de uso y clases | [SUMA-Diagramas_Vistas.eapx](../../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
