# Tareas · <Nombre de la funcionalidad>

Plan: [`plan.md`](plan.md) · Estado: Pendiente

Reglas: una tarea es un cambio pequeño y revisable, y cita el criterio (`CA-##`) que habilita.
`[P]` marca las tareas que se pueden hacer en paralelo con la anterior.

## Fase 1 · Datos

- [ ] T01 — Migración `sprintN-<tema>.sql` (CA-##)

## Fase 2 · Pruebas (se escriben antes de implementar, y fallan)

- [ ] T02 — Prueba de integración para CA-01

## Fase 3 · Backend

- [ ] T03 — Regla de dominio … (CA-##)
- [ ] T04 — Endpoint … (CA-##)

## Fase 4 · Frontend

- [ ] T05 [P] — Pantalla … (CA-##)

## Fase 5 · Cierre

- [ ] T06 — Actualizar la matriz de trazabilidad del sprint
- [ ] T07 — Cambiar el estado de la spec a *Implementada*

## Verificación

| Comando | Resultado | Fecha |
| ------- | --------- | ----- |
| `cd backend && npm run test:sprint` | | |
| `cd frontend && npx ng test --watch=false` | | |
| `cd frontend && npx ng lint && npx ng build` | | |
| `cd e2e && node smoke.cjs` | | |

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01 | | |
