# Tareas · Registro en 3 pasos y confirmación del correo

> Revisión de auditoría 2026-11-26: la validación de cuentas y referidos es automática contra la base institucional autorizada. El administrador solo consulta. La implementación y las pruebas de esta revisión están pendientes; la evidencia del flujo manual es histórica. Véase [validación automática](../../validacion-automatica.md).

Plan: [`plan.md`](plan.md) · Estado: Base funcional implementada; gestión de acuerdos trasladada al Sprint 5, mediciones RNF diferidas

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
- [x] T17 — Provincia en el paso 1, `GET /auth/provincias` y migración `sprint2-correcciones.sql` (CA-16 · 2026-11-16)
- [x] T19 — Pruebas `T-01` y `HU-014 / CA-15` (la prueba adelantada `RF-47-4` se acepta en Sprint 5) (2026-11-16)

## Fase 5 · Cierre

- [x] T14 — Spec, plan y matriz del sprint
- [ ] T16 — Medición RNF-14 y configuración definitiva de producción, diferidas. Gmail de desarrollo configurado; recepción de 2FA confirmada por el usuario.

## Verificación

| Comando | Resultado | Fecha |
| ------- | --------- | ----- |
| `cd backend && npm run test:sprint` | 32/32 pasan | 2026-11-16 |
| `cd frontend && npx ng test --watch=false` | 17/17 pasan | 2026-11-16 |
| `cd frontend && npx ng lint && npx ng build` | Sin errores | 2026-11-16 |
| `cd e2e && node smoke.cjs` | Pasa (incluye registro con provincia y código precargado) | 2026-11-16 |

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01, CA-02, CA-04 | Pantalla de registro · `e2e/smoke.cjs` | Sí |
| CA-03 | `HU-013 / HU-014` · `RF-11: vinculación…` | Sí |
| CA-05, CA-06, CA-07 | `HU-013 / HU-014` | Sí |
| CA-08 | Indirecta en `RF-11: vinculación…` (usa módulos del rol Socio) | Sí |
| CA-09 a CA-13 | `HU-013 / HU-014` | Sí |
| CA-14 | `RF-11: vinculación…` | Sí |
| CA-15 | `HU-014 / CA-15` · `producción nunca expone enlaces ni códigos` | Sí |
| CA-16 | `T-01` | Sí |
| CA-20 | `RF-14 / RF-14-2 / RF-42` | Sí |
| CA-21 | `RF-11-4` (cuenta de 8 dígitos) | Sí |

T15 (obtener/publicar textos oficiales) y T18 (publicación de versiones, CA-17 a CA-19) pasan a Sprint 5 · HU-057. Se conservan sus números como antecedente; no se marcan como completadas ni se exige su aprobación para el alcance funcional del Sprint 2.

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad revisada al 26 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 2 |
| Historias | HU-013 · HU-014 |
| Épicas de BKL-G1 | EPI-06 |
| Requisitos de usuario | UR-01 · UR-02 · UR-13 · UR-14 · UR-52 |
| Requisitos funcionales | RF-01 (RF-01-1 a RF-01-6, con provincia) · RF-02 (RF-02-1 a RF-02-3) · RF-47 (RF-47-1, RF-47-2) · RF-08-2 · RF-14 |
| Requisitos no funcionales | RNF-04 · RNF-05 · RNF-10 · RNF-12 · RNF-14 · RNF-16 |
| Casos de uso | CU-01 Registrar y activar una cuenta · CU-01.1 Aceptar términos y aviso de privacidad (include) · CU-01.2 Confirmar el correo con un código (include) · CU-01.3 Vincular el registro a un referido (extend) · CU-01.4 Validar que el correo y el celular no estén registrados (include) |
| Diagram_ID de comportamiento | 31 Sequence; 32 Activity; 37 Sequence; 38 Activity |
| Modelo UML revisado: casos de uso y clases | [SUMA-Diagramas_Vistas.eapx](../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
