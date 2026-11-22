# Tareas · Recuperación de acceso

Plan: [`plan.md`](plan.md) · Estado: Completado

- [x] T01 — Tabla `Recuperacion` en `sprint1.sql` (CA-01)
- [x] T02 — `POST /auth/forgot` con respuesta idéntica y enlace de 30 min (CA-01, CA-02)
- [x] T03 — `POST /auth/reset` de un solo uso que revoca sesiones y 2FA (CA-03, CA-05)
- [x] T04 — Regla de contraseña en servidor y en pantalla (CA-04)
- [x] T05 — Ocultar `devResetUrl` en producción (CA-06)
- [x] T06 — Pantalla `recuperar.page` (pedir enlace y nueva contraseña)
- [x] T07 — Prueba `RF-07` y paso de recuperación en `e2e/smoke.cjs`
- [ ] T08 — Medir RNF-22 (5 min) con usuarios y RNF-14 con SMTP real

## Verificación (2026-11-16)

| Criterio | Prueba | ¿Pasa? |
| -------- | ------ | ------ |
| CA-01, CA-03, CA-05 | `RF-07` · `e2e/smoke.cjs` | Sí |
| CA-02, CA-06 | `producción nunca expone enlaces ni códigos` | Sí |
| CA-04 | `HU-013 / HU-014…` (misma validación) | Sí |
