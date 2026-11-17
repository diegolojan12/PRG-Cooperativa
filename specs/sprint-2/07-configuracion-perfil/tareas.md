# Tareas · Configuración del perfil

Plan: [`plan.md`](plan.md) · Estado: Completado

## Fase 1 · Pruebas

- [x] T01 — `HU-055 / HU-056 / RF-03 / RF-46: configuración del perfil` (CA-02 a CA-12, CA-14)

## Fase 2 · Backend

- [x] T02 — Migración `sprint2-perfil.sql` y `schema.prisma` (`perfilPublico`, `bajaEn`, `bajaMotivo`, `CambioCorreo`)
- [x] T03 — `PATCH /auth/perfil` con las mismas reglas del registro y unicidad del celular (CA-02, CA-03)
- [x] T04 — Cambio de correo con código: `ConfirmacionCorreo.iniciarCambio()` / `confirmarCambio()` (CA-04, CA-05)
- [x] T05 — `POST /auth/perfil/clave` y cierre de las demás sesiones (CA-06)
- [x] T06 — `PATCH /auth/perfil/privacidad` y `GET /perfiles/:id` con `PerfilPublico` (CA-09 a CA-12)
- [x] T07 — `POST /auth/perfil/baja`: baja lógica, cierre de sesión, bloqueo para administradores (CA-07, CA-08)

## Fase 3 · Frontend

- [x] T08 — Página *Mi perfil* con 5 secciones y ayuda en todos los campos
- [x] T09 — Ruta `/panel/perfil` en las dos experiencias y enlace desde la tarjeta del usuario

## Fase 4 · Documentación

- [x] T10 — CU-03 con sus sub-casos en el EAPX; backlog Excel y Jira; matriz de trazabilidad
