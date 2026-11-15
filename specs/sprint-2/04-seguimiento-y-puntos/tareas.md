# Tareas · Estado de referidos, dictamen y puntos automáticos

Plan: [`plan.md`](plan.md) · Estado: Completado

## Fase 1 · Datos

- [x] T01 — `sprint2.sql`: nueva clave de `MovimientoPuntos`, `actividad`, migración de créditos anteriores (CA-07, CA-11, CA-13)
- [x] T02 — Índice de la bandeja de notificaciones (CA-03)
- [x] T03 — Parámetros de puntos por acción y `valorPunto` sembrados en `init()` (CA-12)

## Fase 2 · Pruebas

- [x] T04 — `RF-11: vinculación…` (CA-06, CA-07, CA-10, CA-12, CA-13)
- [x] T05 — `HU-022: acreditar una actividad interna…` (CA-09, CA-11)
- [x] T06 — `RF-39: las notificaciones se leen por destinatario…` (CA-03, CA-04)

## Fase 3 · Backend

- [x] T07 — `Referido.consultaSocio()` y paginación de 10 para el socio (CA-01, CA-02)
- [x] T08 — Dictamen atómico con acreditación a socio y referido (CA-05 a CA-08)
- [x] T09 — `AcreditacionPuntos` y `MovimientoPuntos` con clave idempotente (CA-09 a CA-11)
- [x] T10 — `/notificaciones/bandeja` sin renovar sesión (CA-04)
- [x] T11 — `ParametroGlobal` con `valorPunto` (CA-12)
- [x] T12 — Vista por capacidad (`esAdmin`) en vez de `rol === 'ADMIN'` en listados, alta y exportación

## Fase 4 · Frontend

- [x] T13 — Lista del socio con nombre de pila, fecha y estado (CA-01)
- [x] T14 — Bandeja con contador sin leer y sondeo cada 3 s en los shells Comunidad y Panel (CA-03)
- [x] T15 — Configuración de puntos por acción y valor del punto (CA-12)

## Fase 5 · Cierre

- [ ] T16 — Decidir con el PO los puntos del referido mientras no haya campañas (P-01)

## Verificación

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01, CA-02 | `RF-11 / RNF-12` · `RF-11: vinculación…` | Sí |
| CA-03, CA-04 | `RF-39` · `RF-11-4` | Sí |
| CA-05 | `RF-11-4` | Sí |
| CA-06, CA-07 | `RF-11: vinculación…` | Sí |
| CA-08 | — | Implementado; falta una prueba que consulte la fila `Dictamen de referido` |
| CA-09, CA-11 | `HU-022` | Sí |
| CA-10, CA-12, CA-13 | `RF-11: vinculación…` | Sí |
