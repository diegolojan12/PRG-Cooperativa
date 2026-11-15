# Tareas · Registro en 3 pasos y confirmación del correo

Plan: [`plan.md`](plan.md) · Estado: Completado (2 pendientes externas)

## Fase 1 · Datos

- [x] T01 — `sprint2.sql`: `correoVerificado`, `celularIndice`, `ConfirmacionCorreo`, `AvisoPrivacidad`, `AceptacionTerminos` (CA-03, CA-07, CA-09)
- [x] T02 — Registrar `sprint2` en `MIGRACIONES` de `database.mjs` (aplicación única)
- [x] T03 — Indexar celulares existentes al iniciar (`protegerDatosExistentes`) (CA-03)

## Fase 2 · Pruebas

- [x] T04 — Prueba `HU-013 / HU-014` (CA-03, CA-05 a CA-07, CA-09 a CA-13)
- [x] T05 — Migración probada sobre una base con datos del Sprint 1

## Fase 3 · Backend

- [x] T06 — `AvisoPrivacidad` y `AceptacionTerminos` (CA-06, CA-07)
- [x] T07 — `ConfirmacionCorreo`: código de 6 dígitos, 10 min, 5 intentos, 3 reenvíos por hora (CA-09 a CA-12)
- [x] T08 — `/auth/register` con confirmación de clave, unicidad de celular, aceptación y código de referido (CA-02 a CA-08)
- [x] T09 — `/auth/login` sin sesión para cuentas sin confirmar; `current()` exige `correoVerificado` (CA-13)
- [x] T10 — Bloquear registro en producción sin SMTP (CA-15)

## Fase 4 · Frontend

- [x] T11 — Registro en 3 pasos con porcentaje, «No, aún no», requisitos de contraseña y casilla de términos (CA-01 a CA-06)
- [x] T12 — `ConfirmarCorreoPage` con reenvío (CA-10 a CA-12)
- [x] T13 — Login redirige a confirmar correo (CA-13)

## Fase 5 · Cierre

- [x] T14 — Spec, plan y matriz del sprint
- [ ] T15 — Publicar textos oficiales del aviso, versión 1.0 (P-01)
- [ ] T16 — Configurar SMTP de producción y medir la entrega en menos de 60 s (P-02, RNF-14)

## Verificación

| Comando | Resultado | Fecha |
| ------- | --------- | ----- |
| `cd backend && npm run test:sprint` | 24/24 pasan | 2026-11-14 |
| `cd frontend && npx ng test --watch=false` | 17/17 pasan | 2026-11-14 |
| `cd frontend && npx ng lint && npx ng build` | Sin errores | 2026-11-14 |

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01, CA-02, CA-04 | Pantalla de registro · `e2e/smoke.cjs` | Implementado; e2e no ejecutado en esta integración |
| CA-03 | `HU-013 / HU-014` · `RF-11: vinculación…` | Sí |
| CA-05, CA-06, CA-07 | `HU-013 / HU-014` | Sí |
| CA-08 | Indirecta en `RF-11: vinculación…` (usa módulos del rol Socio) | Sí |
| CA-09 a CA-13 | `HU-013 / HU-014` | Sí |
| CA-14 | `RF-11: vinculación…` | Sí |
| CA-15 | `producción nunca expone enlaces ni códigos` | Parcial: el bloqueo sin SMTP no tiene prueba propia |
