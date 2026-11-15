# Especificación · Estado de referidos, dictamen y puntos automáticos

| Campo | Valor |
| ----- | ----- |
| Sprint | 2 |
| Historias | HU-020 · HU-021 · HU-022 |
| Épicas | EPI-07 (HU-020) · EPI-08 (HU-021) · EPI-10 Ganar puntos, niveles e insignias (HU-022) |
| Requisitos de usuario | UR-15 · UR-16 · UR-19 · UR-24 · UR-44 |
| Requisitos funcionales | RF-11-2 · RF-11-4 · RF-12 (RF-12-1, RF-12-2) · RF-14-3 · RF-14-4 · RF-38 (RF-38-1) · RF-39 (RF-39-1, RF-39-2) · RF-42 |
| No funcionales | RNF-01 · RNF-13 · RNF-20 |
| Casos de uso (EAPX) | CU-06 Consultar referidos · CU-06.2 Aprobar o rechazar un referido |
| Clases (EAPX) | `Referido` (`consultaSocio`, `nombreDePila`, `aprobar`, `rechazar`) · `MovimientoPuntos` (`actividad`, `clave`, `usuarioId`, `cantidad`, `fecha`, `referidoId`) · `AcreditacionPuntos` (`registrar`) · `Notificacion` |
| Estado | Implementada · Verificada |

## 1. Problema y objetivo

El socio necesita saber qué pasó con cada persona que invitó, y el programa solo funciona si el premio llega
rápido y es exacto: al aprobarse un referido, el socio y la persona referida reciben sus puntos y un aviso con
la cantidad. Los puntos tienen que cuadrar siempre con sus movimientos (RNF-20).

## 2. Actores

| Actor | Qué hace |
| ----- | -------- |
| Socio / Cliente | Ve sus referidos y recibe avisos y puntos. |
| Persona referida | Recibe sus puntos de bienvenida al aprobarse. |
| Administrador | Aprueba o rechaza referidos Pendientes; configura los puntos por acción. |
| Sistema | Acredita los puntos y notifica. |

## 3. Historias de usuario (backlog `BKL-G1`)

- **HU-020** — Como socio/cliente, deseo ver el estado de mis referidos para saber si ya fueron aprobados.
- **HU-021** — Como administrador, deseo aprobar o rechazar a los referidos para premiar solo a los que se volvieron socios.
- **HU-022** — Como socio/cliente, deseo recibir puntos automáticamente por mis actividades para ver recompensada mi participación.

## 4. Criterios de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | HU-020 · RF-11-2 | un socio con referidos | abre Referidos | ve 10 por página con **nombre de pila**, fecha y estado (Pendiente, Aprobado o Rechazado) |
| CA-02 | HU-020 · RF-39-1 | la lista o un aviso del socio | se muestra | nunca incluye apellidos, correo ni celular del referido |
| CA-03 | HU-020 · RF-39 | un referido que cambia de estado | se dictamina | el socio recibe una notificación que aparece en su pantalla en máximo 5 s |
| CA-04 | HU-020 | la consulta periódica de avisos | se hace | no renueva la sesión (la inactividad de 15 min sigue contando) |
| CA-05 | HU-021 · RF-11-4 | un referido cuya cuenta vinculada no está Aprobada | el administrador intenta aprobarlo | se rechaza |
| CA-06 | HU-021 · RF-11-4 | un referido ya dictaminado | se intenta dictaminar otra vez (incluso al mismo tiempo) | solo la primera decisión se guarda; la segunda recibe un rechazo |
| CA-07 | HU-021 · RF-12-2 · UR-19 | un referido aprobado | se guarda la decisión | el socio que refirió **y** la persona referida reciben sus puntos, en la misma operación |
| CA-08 | HU-021 · RF-42 | un dictamen | se guarda | queda en la bitácora con estado anterior y nuevo |
| CA-09 | HU-022 · RF-12-1 | una actividad bonificable confirmada | se acredita | se suma exactamente el valor entero configurado vigente en ese momento |
| CA-10 | HU-022 · RF-38-1 | puntos acreditados | se guardan | el usuario recibe una notificación con la cantidad exacta («Ganaste N puntos.») |
| CA-11 | HU-022 · RNF-20 | el mismo evento | llega dos veces | se acredita una sola vez y se notifica una sola vez |
| CA-12 | RF-14-3 · RF-14-4 | la configuración | el administrador guarda puntos por capacitación, trivia, taller y reto, y el valor del punto | se aceptan enteros de 0 a 10 000 y un valor en dólares con 2 decimales, y cada cambio queda en la bitácora |
| CA-13 | RF-12-1 | un cambio posterior del valor configurado | se guarda | no altera los puntos ya acreditados |

## 5. Reglas de negocio

1. Mientras no existan campañas (Sprint 3), ambas partes reciben `puntosReferido` (por defecto 100).
2. Cada movimiento tiene una clave única `actividad:evento:usuario`; así un evento repetido no duplica puntos.
3. Actividades previstas: `REFERIDO`, `CAPACITACION`, `TRIVIA`, `TALLER`, `RETO`. En este sprint solo `REFERIDO` tiene flujo real;
   las demás usan el mismo servicio cuando se construyan sus módulos (Sprint 4).
4. El saldo del usuario es la suma de sus movimientos.

## 6. Fuera de alcance

- Puntos de campaña para socio y referido (RF-13-3 · Sprint 3).
- Saldo disponible e historial paginado (HU-028 · Sprint 3).
- Niveles e insignias (HU-030 a HU-034).

## 7. Preguntas abiertas

| # | Pregunta | Para | Estado |
| - | -------- | ---- | ------ |
| P-01 | Hasta que existan campañas, ¿el referido debe recibir los mismos puntos que el socio o un valor de bienvenida propio? Hoy recibe los mismos. | PO | Abierta |

## 8. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11-10 | Primera implementación en la rama `sprint-2` | Equipo |
| 2026-11-14 | Integrada en `main`; vista del socio y listados por capacidad del rol (`esAdmin`) en vez de `rol === 'ADMIN'` | Equipo |
