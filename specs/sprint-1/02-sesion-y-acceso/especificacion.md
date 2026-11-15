# Especificación · Sesión, acceso y registro

| Campo | Valor |
| ----- | ----- |
| Sprint | 1 |
| Historias | HU-003 · HU-004 (recuperación) · registro básico (ampliado por HU-013 en el Sprint 2) |
| Requisitos | RF-04 · RF-04-1 · RF-04-2 · RF-04-3 · RF-04-4 · RF-07 · RF-07-1 |
| No funcionales | RNF-04 · RNF-06 · RNF-12 · RNF-14 · RNF-22 |
| Estado | Implementada · Verificada |
| Fuente previa | [`docs/SPRINT1-HU-001-002-003.md`](../../../docs/SPRINT1-HU-001-002-003.md) · auditoría G03, G04, G05, G18, G21 |

## 1. Problema y objetivo

La plataforma maneja datos de socios de una cooperativa de ahorro y crédito. Hay que garantizar que solo
entre quien debe, que una sesión olvidada no quede abierta y que una cuenta se pueda recuperar de forma segura.

## 2. Actores

| Actor | Qué puede hacer |
| ----- | --------------- |
| Visitante | Registrarse como socio (si el registro está abierto) y recuperar su contraseña. |
| Socio / Gestor | Iniciar y cerrar sesión. |
| Administrador | Iniciar sesión con segundo factor; desactivar cuentas. |

## 3. Historias de usuario

- **HU-003 · Sesión** — Como usuario, quiero iniciar sesión de forma segura y que se cierre sola si dejo de usarla,
  para que nadie use mi cuenta en un equipo compartido.
- **Registro** — Como visitante, quiero registrarme con mis datos y, si quiero, mi cuenta de la cooperativa,
  para participar en el programa de referidos.
- **HU-004 · Recuperación** — Como usuario, deseo recuperar el acceso a mi sesión para volver a entrar si olvido mi contraseña;
  criterio: se envía un enlace temporal al correo para restablecer el acceso.

## 4. Criterios de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | RF-04-1 | un visitante sin sesión | pide datos protegidos | se le responde "no autenticado" |
| CA-02 | RF-04-1 | un usuario | escribe una contraseña incorrecta | se rechaza sin decir qué dato falló |
| CA-03 | RF-04-1 | una petición de inicio de sesión desde otro origen | llega al servidor | se rechaza |
| CA-04 | RNF-06 | un usuario cuyo rol exige segundo factor | escribe bien su contraseña | recibe un código de 6 dígitos por correo y **no** tiene sesión hasta validarlo |
| CA-05 | RNF-06 | un código de segundo factor | se usa mal, se usa dos veces o pasan 5 min | se rechaza |
| CA-06 | RF-04-2 | una cuenta | falla la contraseña 5 veces seguidas | queda bloqueada 15 min, aunque luego escriba la contraseña correcta |
| CA-07 | RF-04-3 | una sesión abierta | el usuario hace cualquier acción | la sesión se renueva por 15 min más |
| CA-08 | RF-04-3 | una sesión abierta | pasan 15 min sin acciones | la sesión vence y el usuario vuelve al inicio de sesión, en todas sus pestañas |
| CA-09 | RF-04-4 | un usuario con sesión | pulsa "Cerrar sesión" | la sesión deja de servir de inmediato |
| CA-10 | RF-04-4 | un usuario con sesión | el administrador desactiva su cuenta | su sesión deja de servir de inmediato |
| CA-11 | RF-07 | un usuario que olvidó su contraseña | pide recuperarla | recibe un enlace de un solo uso válido por 30 min |
| CA-12 | RF-07 | un enlace de recuperación usado o vencido | se intenta usar | se rechaza |
| CA-13 | RF-07 | una contraseña cambiada por recuperación | se guarda | se cierran todas las sesiones abiertas de esa cuenta |
| CA-14 | Registro | un visitante | se registra con nombre, correo, celular y contraseña válidos | se crea su cuenta de socio |
| CA-15 | Registro | un visitante que da su cuenta de la cooperativa | el número no tiene 10 dígitos | se rechaza con mensaje en el campo |
| CA-16 | Registro / RF-14 | el registro cerrado por configuración | un visitante intenta registrarse | se rechaza |
| CA-17 | RNF-12 | producción | se pide un código o un enlace | nunca aparece en la respuesta; solo llega por correo |
| CA-18 | RNF-14 | un correo que no se pudo enviar | falla el envío | se reintenta 3 veces, cada 5 min |

## 5. Reglas de negocio

1. Contraseña: de 8 a 128 caracteres, con al menos una mayúscula y un número.
2. Celular ecuatoriano: 10 dígitos que empiezan con `09`.
3. Cuenta de la cooperativa (opcional al registrarse): 10 dígitos + tipo (ahorros o corriente). Queda *Pendiente*
   hasta que un administrador la revise.
4. El registro no pide cédula.
5. El bloqueo es por cuenta. Además, hay un límite por IP como defensa adicional.
6. Las cuentas que crea el administrador reciben un enlace de activación válido por 24 h (ver spec 04).

## 6. Fuera de alcance

- Registro en tres pasos y confirmación de correo (HU-013, HU-014 · Sprint 2).
- Inicio de sesión con redes sociales.

## 7. Requisitos no funcionales aplicables

- RNF-04 — Contraseñas con hash y sal.
- RNF-06 — Segundo factor para administradores.
- RNF-12 — Validación y saneamiento de entradas.
- RNF-14 — Reintentos de correo.
- RNF-22 — Sesión segura (cookie `httpOnly`).

## 8. Preguntas abiertas

| # | Pregunta | Para | Estado |
| - | -------- | ---- | ------ |
| P-01 | ¿Qué números de HU corresponden a registro y recuperación? | PO | Resuelta: HU-004 (recuperación); el registro completo es HU-013 (Sprint 2) |
| P-02 | ¿El registro debe pedir aceptar el aviso de privacidad y los términos? | PO | Resuelta: sí, en HU-013 / RF-47 (Sprint 2) |

## 9. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11 | Auditoría G03 (inactividad), G04 (bloqueo), G05 (2FA), G18 (reintentos), G21 (registro sin cédula, cuenta de 10 dígitos) | Equipo |
| 2026-11-14 | Documentado como spec SDD a partir del código y las pruebas | Equipo |
| 2026-11-14 | HU-004 identificada en el backlog; el registro pasa a la spec 01 del Sprint 2 (confirmación de correo y consentimiento) | Equipo |
