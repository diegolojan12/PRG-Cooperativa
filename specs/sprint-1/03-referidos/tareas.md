# Tareas · Gestión de referidos

Plan: [`plan.md`](plan.md) · Estado: Completado (2 pendientes)

## Fase 1 · Datos

- [x] T01 — Tabla `Referido` y `Notificacion` (`sprint1.sql`) (CA-01)
- [x] T02 — Columnas de baja lógica y fin del `UNIQUE(correo)` (`sprint1-auditoria.sql`) (CA-14, CA-15)
- [x] T03 — `fechaDecision`, `campania`, `provincia`, `correoIndice`, `MovimientoPuntos` (`sprint1-dominio.sql`) (CA-07, CA-12)
- [x] T04 — Migración de estados CONTACTADO→PENDIENTE, VALIDADO→APROBADO (G01)

## Fase 2 · Pruebas

- [x] T05 — `RF-11 / RNF-12`, `RF-11-4`, `RF-11-5`, `RF-11-6`, `días hábiles`
- [ ] T06 — Prueba del límite de 30 días en la asociación manual (CA-18)

## Fase 3 · Backend

- [x] T07 — Alta con validación, consentimiento, saneamiento y duplicados (CA-01 a CA-05)
- [x] T08 — Listado de 20 por página con filtros, `porEstado` y `diasHabilesPendiente` (CA-06 a CA-08 · G08)
- [x] T09 — Aislamiento por socio en el servidor (CA-09)
- [x] T10 — Dictamen solo de administración con cuenta aprobada, puntos y notificación (CA-10 a CA-13 · G11)
- [x] T11 — Baja lógica con motivo (CA-14 a CA-16 · G06)
- [x] T12 — Asociación manual dentro de 30 días (CA-17, CA-18 · G12)
- [x] T13 — Exportación con los mismos filtros

## Fase 4 · Frontend

- [x] T14 — Pantalla de referidos: alta, edición, filtros, paginación, atraso resaltado, baja con motivo
- [x] T15 — Dictamen y asociación manual en la vista de administración
- [x] T16 — Notificaciones del socio

## Fase 5 · Cierre

- [ ] T17 — Resolver P-01 (quién da de baja) y P-02 (números de HU) con el PO

## Verificación

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01 a CA-07 | `RF-11 / RNF-12` | Sí |
| CA-08 | `días hábiles` · `RF-11 / RNF-12` | Sí |
| CA-09 a CA-13 | `RF-11-4` | Sí |
| CA-14 a CA-16 | `RF-11-6` | Sí |
| CA-17 | `RF-11-5` | Sí |
| CA-18 | `RF-11-5` (mismo usuario) | Parcial: falta el caso de 30 días |
