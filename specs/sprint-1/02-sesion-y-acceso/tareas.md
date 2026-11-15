# Tareas · Sesión, acceso y registro

Plan: [`plan.md`](plan.md) · Estado: Completado (1 pendiente)

## Fase 1 · Datos

- [x] T01 — `Usuario`, `Sesion`, `Recuperacion` en `sprint1.sql` (CA-01, CA-07, CA-11)
- [x] T02 — `intentosFallidos`, `bloqueadoHasta`, `cuentaEstado`, tabla `DosFactor` en `sprint1-auditoria.sql` (CA-04, CA-06)

## Fase 2 · Pruebas

- [x] T03 — Pruebas `RF-04-1 / RNF-06`, `RF-04-2`, `RF-04-3`, `RF-04-4`, `RF-07`, `producción nunca expone…`
- [ ] T04 — Prueba de los reintentos de correo (CA-18)

## Fase 3 · Backend

- [x] T05 — Login con verificación de origen y mensaje genérico (CA-01 a CA-03)
- [x] T06 — Desafío y validación de segundo factor, 6 dígitos, 5 min, un uso (CA-04, CA-05 · G05)
- [x] T07 — Bloqueo por cuenta tras 5 fallos, respuesta 423 (CA-06 · G04)
- [x] T08 — Vencimiento deslizante de 15 min en `current()` (CA-07, CA-08 · G03)
- [x] T09 — Logout y revocación al desactivar la cuenta (CA-09, CA-10)
- [x] T10 — Recuperación de un solo uso, 30 min, que revoca sesiones (CA-11 a CA-13)
- [x] T11 — Registro sin cédula, celular `09…`, cuenta de 10 dígitos opcional (CA-14, CA-15 · G21)
- [x] T12 — Registro cerrado según `registroAbierto` (CA-16)
- [x] T13 — Ocultar `devCodigo` / `devResetUrl` en producción (CA-17)
- [x] T14 — Cola de correo con 3 reintentos cada 5 min (CA-18 · G18)

## Fase 4 · Frontend

- [x] T15 — Login con paso de 2FA y alerta persistente de bloqueo (CA-04, CA-06)
- [x] T16 — `InactividadService` compartido entre pestañas (CA-08 · G03)
- [x] T17 — Pantallas de registro y recuperación (CA-11, CA-14, CA-15)

## Fase 5 · Cierre

- [ ] T18 — Confirmar números de HU y decidir P-02 (aviso de privacidad) con el PO

## Verificación

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01 a CA-05 | `RF-04-1 / RNF-06` | Sí |
| CA-06 | `RF-04-2` | Sí |
| CA-07, CA-08 | `RF-04-3` · `auth.spec.ts` | Sí |
| CA-09, CA-10 | `RF-04-4` | Sí |
| CA-11 a CA-13 | `RF-07` | Sí |
| CA-14, CA-15 | `RF-11-4` (registro) | Sí |
| CA-16 | `RF-14 / RF-14-2 / RF-42` | Sí |
| CA-17 | `producción nunca expone enlaces ni códigos` | Sí |
| CA-18 | — | Sin prueba automatizada |
