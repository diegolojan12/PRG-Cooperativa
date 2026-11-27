# Especificación · Recuperación de acceso

| Campo | Valor |
| ----- | ----- |
| Épicas | EPI-02 |
| Sprint | 2 |
| Historias | HU-004 |
| Requisitos de usuario | UR-05 |
| Requisitos funcionales | RF-07 · RF-07-1 · RF-07-2 |
| No funcionales | RNF-03 · RNF-04 · RNF-12 · RNF-14 · RNF-22 |
| Casos de uso (EAPX) | CU-02.3 Solicitar recuperación de acceso (extend de CU-02) · CU-02.5 Restablecer la contraseña (extend de CU-02.3) |
| Estado | Implementada · Verificada |
| Origen | Criterios CA-11 a CA-13 de la spec `sprint-1/02-sesion-y-acceso` (separados el 2026-11-16) |

## 1. Problema y objetivo

Un usuario que olvidó su contraseña debe poder volver a entrar sin ayuda del administrador, sin que nadie más pueda
usar ese camino para apoderarse de la cuenta.

## 2. Actores

| Actor | Qué puede hacer |
| ----- | --------------- |
| Socio / Gestor / Administrador | Pedir el enlace de recuperación y definir una nueva contraseña. |

## 3. Historias de usuario

- **HU-004 · Recuperación** — Como usuario, quiero recuperar el acceso a mi sesión para volver a entrar si olvido mi
  contraseña. Criterio del backlog: se envía un enlace temporal al correo para restablecer el acceso.

## 4. Criterios de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | RF-07, RF-07-1 | un usuario que olvidó su contraseña | pide recuperarla | recibe un enlace de un solo uso válido por 30 min (antes 02 · CA-11) |
| CA-02 | RF-07 | cualquier correo | se pide recuperación | la respuesta es la misma exista o no la cuenta |
| CA-03 | RF-07-1 | un enlace de recuperación usado o vencido | se intenta usar | se rechaza (antes 02 · CA-12) |
| CA-04 | RF-07-2 | una nueva contraseña | no tiene 8 caracteres, 1 mayúscula y 1 número | se rechaza con la causa en el campo |
| CA-05 | RF-07 | una contraseña cambiada por recuperación | se guarda | se cierran todas las sesiones abiertas y se borran los desafíos de 2FA de esa cuenta (antes 02 · CA-13) |
| CA-06 | RNF-12 | producción | se pide un enlace | nunca aparece en la respuesta; solo llega por correo |

## 5. Reglas de negocio

1. Un usuario tiene como máximo 1 enlace vigente: pedir otro invalida el anterior.
2. Solo se guarda la huella del token, nunca el token.
3. El cambio de contraseña desbloquea la cuenta (pone a 0 los intentos fallidos).
4. Las cuentas que crea el administrador usan el mismo mecanismo con un enlace de activación de 24 h (spec `02-administracion`).

## 6. Fuera de alcance

- Recuperación por SMS o preguntas de seguridad.

## 7. Requisitos no funcionales aplicables

- RNF-03 — HTTPS en producción.
- RNF-04 — Contraseñas con hash y sal.
- RNF-14 — Entrega del correo en 60 s (medición con SMTP real pendiente).
- RNF-22 — Recuperar la contraseña en 5 minutos o menos (medición con usuarios pendiente: [`docs/PROTOCOLO-PRUEBAS-USUARIOS.md`](../../../../../docs/PROTOCOLO-PRUEBAS-USUARIOS.md)).

## 8. Preguntas abiertas

| # | Pregunta | Para | Estado |
| - | -------- | ---- | ------ |
| P-01 | Proveedor SMTP de producción | PO | Abierta (compartida con `05-registro-y-confirmacion`) |

## 9. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11-14 | Criterios escritos dentro de la spec de sesión del Sprint 1 | Equipo |
| 2026-11-16 | Spec propia del Sprint 2 (HU-004 es del Sprint 2 según el backlog); casos de uso CU-02.3 y CU-02.5 | Equipo |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 2 |
| Historias | HU-004 |
| Épicas de BKL-G1 | EPI-02 |
| Requisitos de usuario | UR-05 |
| Requisitos funcionales | RF-07 · RF-07-1 · RF-07-2 |
| Requisitos no funcionales | RNF-03 · RNF-04 · RNF-12 · RNF-14 · RNF-22 |
| Casos de uso | CU-02.3 Solicitar recuperación de acceso (extend de CU-02) · CU-02.5 Restablecer la contraseña (extend de CU-02.3) |
| Diagram_ID de comportamiento | 39 Sequence; 40 Activity |
| Modelo UML vigente | [SUMA-Diagramas_Vistas.eapx](../../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
