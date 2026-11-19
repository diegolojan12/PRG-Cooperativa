# Especificación · Correo transaccional configurable

| Campo | Valor |
| --- | --- |
| Historias existentes | HU-001, HU-003, HU-004, HU-014; cambio de correo reutilizado por HU-023 (Sprint 3) |
| Requisitos | RF-08-2, RNF-06, RF-07, RF-02, RF-03, RNF-12, RNF-14 |
| Estado | Implementada y verificada con SMTP local; Gmail configurado y recepción real de 2FA confirmada por el usuario. Medición RNF-14 diferida. Ampliación solicitada el 2026-11-19 |
| Jira | Solo G2: G2-21, G2-23, G2-24, G2-34; reutilización por G2-43 |

## Objetivo y alcance

Entregar los mensajes de acceso, activación, confirmación, cambio de correo y recuperación
al correo de la cuenta correspondiente. El proveedor de envío es independiente del dominio
del destinatario. La elección para desarrollo es Gmail; se puede sustituir mediante SMTP.
El correo del administrador de este laboratorio será `nixx2409@gmail.com`, almacenado en su
cuenta, sin redirigir los mensajes de otras personas a esa dirección.

El segundo factor del administrador es un **código** de seis dígitos (5 minutos), no un enlace.
La recuperación usa un **enlace** (30 minutos); la confirmación de registro usa un código
(10 minutos). Se mantienen las reglas de las especificaciones originales.

## Criterios de aceptación

| ID | Dado | Cuando | Entonces |
| --- | --- | --- | --- |
| CA-01 | Un remitente autorizado | se configura Gmail, Microsoft 365, Yahoo o un host SMTP | los flujos usan el mismo adaptador y pueden dirigirse a cualquier dominio de correo |
| CA-02 | Configuración incompleta, puerto o TLS inválidos | se inicia el adaptador | se informa qué variable corregir sin imprimir contraseñas ni tokens |
| CA-03 | Un servidor remoto | se conecta | usa TLS implícito en 465 o STARTTLS obligatorio; no se deshabilita la validación de certificados |
| CA-04 | Un código o enlace vigente cuyo envío falla | se reintenta | como máximo hay 3 reintentos cada 5 minutos; no se reenvía si venció o fue sustituido/usado |
| CA-05 | Un administrador configurado con su correo real | solicita acceso o recuperación | el mensaje se dirige al correo de su cuenta y las demás cuentas conservan sus destinatarios |
| CA-06 | Credenciales del proveedor | se verifica SMTP | se comprueba conexión/autenticación sin enviar correos ni mostrar secretos |
| CA-07 | Flujos de 2FA, recuperación y confirmación | se prueban con servidor SMTP local | se comprueban destinatario, contenido y uso del código/enlace recibido |
| CA-08 | Producción sin transporte configurado | se solicita un flujo que requiere correo | no se crean desafíos imposibles de recibir; la recuperación mantiene la respuesta genérica para cuentas existentes e inexistentes |

## Límites y cierre

- Las credenciales del remitente las proporciona el titular en su equipo; no se inventan cuentas ni contraseñas del proveedor.
- No se implementa un inicio de sesión social ni el consentimiento OAuth de Google/Microsoft.
- SMTP admite contraseña de aplicación o token OAuth2 emitido externamente; la renovación de tokens genéricos es externa.
- Cola en memoria: se pierden reintentos al reiniciar el proceso (limitación heredada).
- RNF-14 (entrega real en 60 segundos) requiere credenciales reales y medición en la bandeja; un SMTP simulado o `verify()` no la demuestra.

## Historial

| Fecha | Cambio |
| --- | --- |
| 2026-11-19 | Ampliación transversal de historias existentes, elección de Gmail para desarrollo y destinatario del administrador solicitados en el chat. |
