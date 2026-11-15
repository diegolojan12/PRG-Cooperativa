# Tareas · Administración: usuarios, configuración, bitácora y tablero

Plan: [`plan.md`](plan.md) · Estado: Completado (1 pendiente)

## Fase 1 · Datos

- [x] T01 — `Configuracion` y `Actividad` (`sprint1.sql`)
- [x] T02 — `ip`, `objetivoId`, `datos` y trigger `actividad_inmutable` (`sprint1-auditoria.sql`) (CA-10, CA-12)
- [x] T03 — Fechas de solicitud y revisión de la cuenta vinculada (`sprint1-dominio.sql`) (CA-05)

## Fase 2 · Pruebas

- [x] T04 — `RF-08-2`, `RF-14 / RF-14-2 / RF-42`, `RF-45-1`
- [ ] T05 — Prueba de API de la revisión de cuentas vinculadas (CA-05)

## Fase 3 · Backend

- [x] T06 — Alta de Gestor/Admin con enlace de activación de 24 h (CA-01 a CA-03 · G15)
- [x] T07 — Revisión de cuentas pendientes (CA-05 · G11)
- [x] T08 — `ParametroGlobal` y validación de configuración (CA-06 a CA-08)
- [x] T09 — Una fila de bitácora por parámetro cambiado (CA-09 · G13)
- [x] T10 — Bitácora con IP, 50 por página y filtros (CA-10, CA-11 · G07)
- [x] T11 — `GET /indicadores` con 6 indicadores (CA-13 a CA-15 · G10)

## Fase 4 · Frontend

- [x] T12 — `TableroPage` separado de `ResumenPage` (CA-13 · G10)
- [x] T13 — Usuarios: alta, cambio de rol, activar/desactivar, cuentas pendientes (CA-01, CA-04, CA-05)
- [x] T14 — Configuración con ayuda y error por campo (CA-06 a CA-08)
- [x] T15 — Registro de actividad con filtros y paginación (CA-11)

## Fase 5 · Cierre

- [ ] T16 — Confirmar números de HU con el PO (P-01)

## Verificación

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01 a CA-03 | `RF-08-2` | Sí |
| CA-04 | `RF-04-4` · `HU-001` | Sí |
| CA-05 | — | Sin prueba de API |
| CA-06 a CA-12 | `RF-14 / RF-14-2 / RF-42` | Sí |
| CA-13, CA-14 | `RF-45-1` | Sí |
| CA-15 | `RF-08-1 / RF-08-4` | Sí |
