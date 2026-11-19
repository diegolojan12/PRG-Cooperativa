# Plan técnico · Datos del perfil y baja · HU-023

Especificación: [`especificacion.md`](especificacion.md) · Estado: Implementado

## 1. Chequeo contra la constitución

| Principio | ¿Se cumple? | Nota |
| --------- | ----------- | ---- |
| II. Nada quemado | Sí | La baja se niega por `Rol.alcanceGlobal`, no por el nombre del rol |
| III. Seguridad | Sí | Contraseña actual para cambios sensibles; correo nuevo confirmado con código; datos cifrados; las demás sesiones se cierran al cambiar la contraseña |
| IV. Trazabilidad | Sí | `Perfil actualizado`, `Correo actualizado`, `Contraseña cambiada`, `Privacidad del perfil`, `Baja de cuenta` en `Actividad` |
| V. Prueba por criterio | Sí | Ver §5 |
| VII. Arquitectura | Sí | El cambio de correo vive en `ConfirmacionCorreo` |

## 2. Modelo de datos (migración `backend/prisma/sprint2-perfil.sql`)

| Cambio | Para qué |
| ------ | -------- |
| `Usuario.bajaEn`, `Usuario.bajaMotivo` | RF-03-3 (baja lógica) |
| Tabla `CambioCorreo` (`usuarioId`, `correo` cifrado, `correoIndice`, `huella`, `vence`, `intentos`) | RF-03-2 (correo nuevo pendiente de confirmar) |

## 3. API

| Método | Ruta | Acceso | Respuestas |
| ------ | ---- | ------ | ---------- |
| PATCH | `/api/auth/perfil` | sesión | 200 perfil · 400 · 409 (celular de otra cuenta) |
| POST | `/api/auth/perfil/correo` | sesión + contraseña | 200 `{destino}` · 400 · 409 · 503 sin correo |
| POST | `/api/auth/perfil/correo/confirmar` | sesión | 200 perfil · 400 código inválido · 404 sin cambio pendiente |
| POST | `/api/auth/perfil/clave` | sesión + contraseña | 200 · 400 |
| POST | `/api/auth/perfil/baja` | sesión + contraseña, rol sin alcance global | 200 (cierra la sesión) · 400 · 409 administrador |

## 4. Frontend

- `features/perfil/perfil.page.ts`: secciones Datos personales, Correo de acceso, Contraseña y Dar de baja. La sección Privacidad existente corresponde al Sprint 5.
- Ruta `/panel/perfil` en las dos experiencias (Comunidad y Administración); se llega desde la tarjeta del usuario.
- Todos los campos con ayuda y error debajo (`app-campo`, RF-49-1 y RF-49-2).

## 5. Pruebas

`backend/test/sprint.test.mjs` · `HU-055 / HU-056 / RF-03 / RF-46: configuración del perfil` cubre CA-02 a CA-08 y CA-14. La prueba existente también cubre privacidad, cuya aceptación pertenece al Sprint 5.
