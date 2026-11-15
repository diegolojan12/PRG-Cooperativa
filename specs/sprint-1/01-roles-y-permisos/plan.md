# Plan técnico · Roles, permisos y menú según el rol

Especificación: [`especificacion.md`](especificacion.md) · Estado: Implementado

## 1. Chequeo contra la constitución

| Principio | ¿Se cumple? | Nota |
| --------- | ----------- | ---- |
| II. Nada quemado | Sí | Roles, módulos y permisos en BD; `catalogo-inicial.mjs` solo es semilla (`ON CONFLICT DO NOTHING`) |
| III. Seguridad | Sí | Permisos leídos en cada petición en el servidor; un rol nuevo no puede tener `alcanceGlobal` |
| IV. Trazabilidad | Sí | `Rol creado`, `Rol actualizado`, `Permisos actualizados`, `Rol eliminado` en `Actividad` |
| V. Prueba por criterio | Sí | Ver §7 |
| VI. Accesibilidad | Sí | Menú desplegable bajo 768 px (`panel.css`), barra inferior en la comunidad |
| VII. Arquitectura | Sí | Reglas en `dominio/acceso.mjs`; guards y `loadComponent` en el frontend |

## 2. Modelo de datos

Migración `backend/prisma/sprint1-roles.sql` (+ `RolPermiso` en `sprint1.sql`):

| Tabla | Columnas clave |
| ----- | -------------- |
| `Rol` | `clave` (PK), `nombre`, `descripcion`, `sistema`, `requiereSegundoFactor`, `alcanceGlobal`, `interfaz` (`COMUNIDAD`/`ADMINISTRACION`), `disponibles` (JSON), `obligatorios` (JSON), `creadoEn` |
| `Modulo` | `clave` (PK), `etiqueta`, `grupo`, `icono`, `orden`, `ambito` (`ADMIN`/`COMUN`), `disponible` |
| `RolPermiso` | `rol` (PK), `modulos` (JSON con los módulos asignados hoy) |

Semilla: `backend/src/dominio/catalogo-inicial.mjs` (16 módulos, 3 roles).

## 3. API

| Método | Ruta | Módulo requerido | Respuestas |
| ------ | ---- | ---------------- | ---------- |
| GET | `/api/modulos` | `roles` | 200 |
| GET | `/api/roles` | `roles` | 200 |
| GET | `/api/roles/opciones` | `usuarios` | 200 |
| POST | `/api/roles` | `roles` | 201 · 400 (clave inválida, módulo de administración) · 403 · 409 (duplicado) |
| PUT | `/api/roles/:rol` | `roles` | 200 · 400 · 403 · 404 |
| DELETE | `/api/roles/:rol` | `roles` | 200 · 409 (rol del sistema o en uso) |
| GET | `/api/auth/me` | sesión | 200 con `rol`, `modulos`, `menu`, `interfaz`, `esAdmin` |

Autorización: `admin(req, modulo)` / `current(req)` en `api.mjs` consultan `RolPermiso` + `Rol.alcanceGlobal` en cada petición.

## 4. Dominio

`backend/src/dominio/acceso.mjs`:

- `Rol.crear({...}, catalogo)` — valida la clave (mayúsculas, sin espacios), fija `alcanceGlobal=false` y `sistema=false`.
- `Rol#validarPermisos(modulos, catalogo)` — exige los obligatorios, limita a los disponibles y rechaza
  módulos `ambito='ADMIN'` si el rol no tiene alcance global.
- `Modulo#esDeAdministracion`.
- `INTERFACES = ['COMUNIDAD', 'ADMINISTRACION']`.

## 5. Frontend

| Pantalla / componente | Ruta | Guard | Archivos |
| --------------------- | ---- | ----- | -------- |
| Roles y permisos | `/panel/roles` | `authGuard` + `moduloGuard` | `features/administracion/roles.page.ts` |
| Panel administrativo | `/panel` | `authGuard`, `esAdminMatch` | `layout/shell.component.*` |
| Interfaz del socio | `/panel` | `authGuard`, `interfazMatch('COMUNIDAD')` | `layout/comunidad-shell.component.*` |
| Acceso denegado | `/panel/acceso-denegado` | — | `features/ayuda/acceso-denegado.page.ts` |
| Módulo aún no construido | `/panel/:modulo` | `moduloGuard` | `features/ayuda/proximamente.page.ts` |
| Guards | — | — | `core/auth/guards.ts`, `core/auth/session.store.ts` |

El menú se dibuja con `menu` que entrega el servidor; el frontend no compara nombres de rol.

## 6. Bitácora

| Acción | `datos` |
| ------ | ------- |
| `Rol creado` | clave y nombre del rol |
| `Permisos actualizados` | rol y módulos asignados |
| `Rol actualizado` / `Usuario actualizado` | `objetivoId`, `rolAnterior`, `rolNuevo`, `activo` |
| `Rol eliminado` | clave del rol |

## 7. Estrategia de pruebas

| Criterio | Prueba (`backend/test/sprint.test.mjs`) |
| -------- | --------------------------------------- |
| CA-01, CA-07, CA-10, CA-11 | `RF-08-1 / RF-08-4: 3 roles y acceso denegado en servidor` |
| CA-02, CA-03, CA-04, CA-06, CA-08 | `HU-001: roles y permisos se crean, editan y eliminan sin tocar el código` |
| CA-05 | `RF-08: permisos por rol se aplican de inmediato` |
| CA-08, CA-09 | `RF-04-1 / RNF-06: …` (comprueba `menu` e `interfaz` del socio) |
| CA-12 | `RF-14 / RF-14-2 / RF-42: configuración y bitácora completa` (`rolNuevo`, `objetivoId`) |
| CA-10, CA-13 (frontend) | `frontend/src/app/features/features.spec.ts` (guards, menú por rol) · `e2e/smoke.cjs` (móvil 390 px) |

## 8. Decisiones y riesgos

| Decisión | Alternativas descartadas | Motivo |
| -------- | ------------------------ | ------ |
| RBAC: permisos por rol | Permisos por usuario | Lo pide el comentario de la HU ("Roles") y es más simple de auditar |
| Autorizar por `alcanceGlobal` y módulo | `rol === 'ADMIN'` | Permite roles nuevos sin tocar código |
| Semilla que nunca pisa cambios | Migración con datos fijos | Respeta lo que el administrador ya configuró |
| Experiencia según `Rol.interfaz` | Según el nombre del rol | Un rol nuevo elige su experiencia |
