# Especificación · Sesión y acceso

| Campo | Valor |
| ----- | ----- |
| Épicas | EPI-02 |
| Sprint | 1 |
| Historias | HU-003 |
| Requisitos de usuario | UR-03 |
| Requisitos funcionales | RF-04 · RF-04-1 · RF-04-2 · RF-04-3 · RF-04-4 |
| No funcionales | RNF-04 · RNF-06 · RNF-12 · RNF-14 · RNF-22 |
| Casos de uso (EAPX) | CU-02 Iniciar sesión · CU-02.1 Validar las credenciales (include) · CU-02.2 Confirmar el segundo factor (extend) · CU-02.6 Cerrar sesión (extend) |
| Estado | Implementada · Verificada |
| Fuente previa | [`docs/SPRINT1-HU-001-002-003.md`](../../../docs/SPRINT1-HU-001-002-003.md) · auditoría G03, G04, G05, G18 |

## 1. Problema y objetivo

La plataforma maneja datos de socios de una cooperativa de ahorro y crédito. Hay que garantizar que solo
entre quien debe y que una sesión olvidada no quede abierta.

## 2. Actores

| Actor | Qué puede hacer |
| ----- | --------------- |
| Socio / Gestor | Iniciar y cerrar sesión. |
| Administrador | Iniciar sesión con segundo factor; desactivar cuentas. |

## 3. Historias de usuario

- **HU-003 · Sesión** — Como usuario, quiero crear mi sesión e iniciar o cerrar de forma segura, para entrar a mi
  cuenta y proteger mi información. Criterio del backlog: se permite la creación de la sesión y el cierre por inactividad.

## 4. Criterios de aceptación

Los criterios conservan su número original. CA-11 a CA-16 se trasladaron a otras specs del Sprint 2.

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
| ~~CA-11 a CA-13~~ | RF-07 | — | — | Trasladados a [`sprint-2/01-recuperacion-de-acceso`](../../sprint-2/01-recuperacion-de-acceso/especificacion.md) (HU-004) |
| ~~CA-14 a CA-16~~ | RF-01 | — | — | Trasladados a [`sprint-2/05-registro-y-confirmacion`](../../sprint-2/05-registro-y-confirmacion/especificacion.md) (HU-013) |
| CA-17 | RNF-12 | producción | se pide un código | nunca aparece en la respuesta; solo llega por correo |
| CA-18 | RNF-14 | un correo con el código que no se pudo enviar | falla el envío | se reintenta 3 veces, cada 5 min, mientras el código siga vigente |

## 5. Reglas de negocio

1. Contraseña: de 8 a 128 caracteres, con al menos una mayúscula y un número.
2. El bloqueo es por cuenta. Además, hay un límite por IP como defensa adicional.
3. El segundo factor depende del rol (`requiereSegundoFactor`), no de un nombre de rol escrito en el código.
4. Una cuenta con el correo sin confirmar no puede iniciar sesión (ver HU-014).

## 6. Fuera de alcance

- Recuperación de la contraseña (HU-004 · Sprint 2).
- Registro de la cuenta (HU-013 · Sprint 2).
- Inicio de sesión con redes sociales.

## 7. Requisitos no funcionales aplicables

- RNF-04 — Contraseñas con hash y sal (scrypt).
- RNF-06 — Segundo factor para administradores.
- RNF-12 — Validación y saneamiento de entradas.
- RNF-14 — Reintentos de correo.
- RNF-22 — Inicio de sesión en 30 segundos o menos (medición con usuarios: [`docs/PROTOCOLO-PRUEBAS-USUARIOS.md`](../../../docs/PROTOCOLO-PRUEBAS-USUARIOS.md)).

## 8. Preguntas abiertas

| # | Pregunta | Para | Estado |
| - | -------- | ---- | ------ |
| P-01 | ¿Qué números de HU corresponden a registro y recuperación? | PO | Resuelta: HU-004 (recuperación) y HU-013 (registro), ambas del Sprint 2 |

## 9. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11 | Auditoría G03 (inactividad), G04 (bloqueo), G05 (2FA), G18 (reintentos) | Equipo |
| 2026-11-14 | Documentado como spec SDD a partir del código y las pruebas | Equipo |
| 2026-11-16 | Alcance reducido a HU-003, según la columna *Sprint* del backlog (Sprint 1 = HU-001 a HU-003). Recuperación y registro pasan al Sprint 2. Casos de uso del EAPX agregados | Equipo |
| 2026-11-19 | CA-18 con prueba automatizada; transporte y vigencia de mensajes precisados en `sprint-2/08-correo-transaccional`. No se declara medida la recepción real | Revisión G2 |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 1 |
| Historias | HU-003 |
| Épicas de BKL-G1 | EPI-02 |
| Requisitos de usuario | UR-03 |
| Requisitos funcionales | RF-04 · RF-04-1 · RF-04-2 · RF-04-3 · RF-04-4 |
| Requisitos no funcionales | RNF-04 · RNF-06 · RNF-12 · RNF-14 · RNF-22 |
| Casos de uso | CU-02 Iniciar sesión · CU-02.1 Validar las credenciales (include) · CU-02.2 Confirmar el segundo factor (extend) · CU-02.6 Cerrar sesión (extend) |
| Diagram_ID de comportamiento | 33 Activity; 34 Sequence; 99 Sequence; 100 Activity |
| Modelo UML vigente | [SUMA-Diagramas_Vistas.eapx](../../../entregables/SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
