# Tareas · Sesión y acceso

Plan: [`plan.md`](plan.md) · Estado: Base funcional verificada; recepción real y tiempos con usuarios pendientes

## Fase 1 · Datos

- [x] T01 — `Usuario` y `Sesion` en `sprint1.sql` (CA-01, CA-07)
- [x] T02 — `intentosFallidos`, `bloqueadoHasta` y tabla `DosFactor` en `sprint1-auditoria.sql` (CA-04, CA-06)

## Fase 2 · Pruebas

- [x] T03 — Pruebas `RF-04-1 / RNF-06`, `RF-04-2`, `RF-04-3`, `RF-04-4`, `producción nunca expone…`
- [x] T04 — CA-18: prueba automatizada de reintentos y vigencia en `backend/test/correo.test.mjs` (añadida 2026-11-19; reemplaza la excepción anterior)

## Fase 3 · Backend

- [x] T05 — Login con verificación de origen y mensaje genérico (CA-01 a CA-03)
- [x] T06 — Desafío y validación de segundo factor, 6 dígitos, 5 min, un uso (CA-04, CA-05 · G05)
- [x] T07 — Bloqueo por cuenta tras 5 fallos, respuesta 423 (CA-06 · G04)
- [x] T08 — Vencimiento deslizante de 15 min en `current()` (CA-07, CA-08 · G03)
- [x] T09 — Logout y revocación al desactivar la cuenta (CA-09, CA-10)
- [x] T13 — Ocultar `devCodigo` en producción (CA-17)
- [x] T14 — Cola de correo con 3 reintentos cada 5 min (CA-18 · G18)

T10 (recuperación) pasó a `sprint-2/01-recuperacion-de-acceso`; T11 y T12 (registro) a `sprint-2/05-registro-y-confirmacion`.

## Fase 4 · Frontend

- [x] T15 — Login con paso de 2FA y alerta persistente de bloqueo (CA-04, CA-06)
- [x] T16 — `InactividadService` compartido entre pestañas (CA-08 · G03)

## Fase 5 · Cierre

- [x] T18 — Números de HU confirmados con el backlog (HU-003 en el Sprint 1)

## Verificación (2026-11-16)

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01 a CA-05 | `RF-04-1 / RNF-06` · `e2e/smoke.cjs` | Sí |
| CA-06 | `RF-04-2` | Sí |
| CA-07, CA-08 | `RF-04-3` · `auth.spec.ts` | Sí |
| CA-09, CA-10 | `RF-04-4` | Sí |
| CA-17 | `producción nunca expone enlaces ni códigos` | Sí |
| CA-18 | `backend/test/correo.test.mjs` | Sí (2026-11-19); entrega real pendiente |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 1 |
| Historias | HU-003 |
| Épicas de BKL-G1 | EPI-02 |
| Requisitos de usuario | UR-03 |
| Requisitos funcionales | RF-04 · RF-04-1 · RF-04-2 · RF-04-3 · RF-04-4 |
| Requisitos no funcionales | RNF-04 · RNF-06 · RNF-12 · RNF-14 · RNF-22 |
| Casos de uso | CU-02 Iniciar sesión · CU-02.1 Validar las credenciales (include) · CU-02.2 Confirmar el segundo factor (extend) · CU-02.6 Cerrar sesión (extend) |
| Diagram_ID de comportamiento | 33 Activity; 34 Sequence; 99 Sequence; 100 Activity |
| Modelo UML vigente | [SUMA-Diagramas_Vistas.eapx](../../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
