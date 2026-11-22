# Tareas · Sesión y acceso

Plan: [`plan.md`](plan.md) · Estado: Completado (CA-18 sin prueba automatizada, por decisión)

## Fase 1 · Datos

- [x] T01 — `Usuario` y `Sesion` en `sprint1.sql` (CA-01, CA-07)
- [x] T02 — `intentosFallidos`, `bloqueadoHasta` y tabla `DosFactor` en `sprint1-auditoria.sql` (CA-04, CA-06)

## Fase 2 · Pruebas

- [x] T03 — Pruebas `RF-04-1 / RNF-06`, `RF-04-2`, `RF-04-3`, `RF-04-4`, `producción nunca expone…`
- [x] T04 — CA-18: se decide no automatizar (la cola es en memoria a propósito); se documenta en el plan §8

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
| CA-18 | — | Sin prueba automatizada (decisión) |
