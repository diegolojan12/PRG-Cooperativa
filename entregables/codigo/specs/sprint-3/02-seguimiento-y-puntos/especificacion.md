# Especificación · Estado y validación automática de referidos y puntos

> Revisión de auditoría 2026-11-26: la validación de cuentas y referidos es automática contra la base institucional autorizada. El administrador solo consulta. La implementación y las pruebas de esta revisión están pendientes; la evidencia del flujo manual es histórica. Véase [validación automática](../../validacion-automatica.md).

| Campo | Valor |
| ----- | ----- |
| Sprint | 3 (HU-020 a HU-022; implementada por adelantado durante el Sprint 2) |
| Historias | HU-020 · HU-021 · HU-022 |
| Épicas | EPI-07 (HU-020) · EPI-08 (HU-021) · EPI-10 Ganar puntos, niveles e insignias (HU-022) |
| Requisitos de usuario | UR-15 · UR-16 · UR-19 · UR-24 · UR-44 |
| Requisitos funcionales | RF-11-2 · RF-11-4 · RF-12 (RF-12-1, RF-12-2) · RF-14-3 · RF-14-4 · RF-38 (RF-38-1) · RF-39 (RF-39-1, RF-39-2) · RF-42 · RF-50 |
| No funcionales | RNF-01 · RNF-02 · RNF-05 · RNF-07 · RNF-09 · RNF-12 · RNF-13 · RNF-16 · RNF-20 · RNF-23 · RNF-24 |
| Casos de uso (EAPX) | CU-06 Consultar referidos · CU-06.2 Validar automáticamente un referido (revisado en auditoría 1) (extend) · CU-06.4 Acreditar los puntos al socio y al referido (extend de CU-06.2) · CU-36 Consultar notificaciones |
| Clases de la implementación anterior | `Referido` (`consultaSocio`, `nombreDePila`, `aprobar`, `rechazar`) · `MovimientoPuntos` (`actividad`, `clave`, `usuarioId`, `cantidad`, `fecha`, `referidoId`) · `AcreditacionPuntos` (`registrar`) · `Notificacion` |
| Estado | Requisitos revisados; automatización pendiente de implementación y verificación |

## 1. Problema y objetivo

El socio necesita saber qué pasó con cada persona que invitó, y el programa solo funciona si el premio llega
rápido y es exacto: al aprobarse un referido, el socio y la persona referida reciben sus puntos y un aviso con
la cantidad. Los puntos tienen que cuadrar siempre con sus movimientos (RNF-20).

## 2. Actores

| Actor | Qué hace |
| ----- | -------- |
| Socio / Cliente | Ve sus referidos y recibe avisos y puntos. |
| Persona referida | Recibe sus puntos de bienvenida al aprobarse. |
| Administrador | Consulta resultados e incidencias y configura puntos; no decide estados. |
| Sistema | Valida automáticamente requisitos institucionales, decide el resultado, acredita puntos y notifica sin duplicados. |

## 3. Historias de usuario (backlog `BKL-G1`)

- **HU-020** — Como socio/cliente, deseo ver el estado de mis referidos para conocer su resultado de validación automática.
- **HU-021** — Como socio/cliente, deseo que mis referidos se validen automáticamente al cumplir las condiciones institucionales para recibir puntos sin aprobación manual.
- **HU-022** — Como socio/cliente, deseo recibir puntos automáticamente por mis actividades para ver recompensada mi participación.

## 4. Criterios de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | HU-020 · RF-11-2 | un socio con referidos | abre Referidos | ve 10 por página con **nombre de pila**, fecha y estado (Pendiente, Aprobado o Rechazado) |
| CA-02 | HU-020 · RF-39-1 | la lista o un aviso del socio | se muestra | nunca incluye apellidos, correo ni celular del referido |
| CA-03 | HU-020 · RF-39 | un cambio automático de estado | se confirma | el socio recibe un solo aviso en máximo 5 s, sin datos personales ajenos |
| CA-04 | HU-020 | la consulta periódica de avisos | se hace | no renueva la sesión (la inactividad de 15 min sigue contando) |
| CA-05 | HU-021 · RF-11-4 · RF-50 | un referido con registro activo, cuenta validada y relación válida y única | el sistema lo reevalúa | se aprueba automáticamente en máximo 2 s; requisito faltante o falla técnica conserva Pendiente y un incumplimiento confirmado genera Rechazado con causa |
| CA-06 | HU-021 · RF-11-4 · RNF-20 | el mismo evento automático | llega repetido o concurrente | se confirma una sola transición y ningún efecto duplicado |
| CA-07 | HU-021 · RF-12-2 · UR-19 | referido aprobado automáticamente | se confirma | ambas partes reciben puntos en máximo 2 s, con estado y créditos atómicos; una falla revierte toda la operación |
| CA-08 | HU-021 · RF-42 | intento o resultado automático | se procesa | se registra origen Sistema, causa, estados, intento y referencia y vigencia de la fuente en bitácora inmutable |
| CA-09 | HU-022 · RF-12-1 | una actividad bonificable confirmada | se acredita | se suma exactamente el valor entero configurado vigente en ese momento |
| CA-10 | HU-022 · RF-38-1 | puntos acreditados | se guardan | el usuario recibe una notificación con la cantidad exacta («Ganaste N puntos.») |
| CA-11 | HU-022 · RNF-20 | el mismo evento | llega dos veces | se acredita una sola vez y se notifica una sola vez |
| CA-12 | RF-14-3 · RF-14-4 | la configuración | el administrador guarda puntos por capacitación, trivia, taller y reto, y el valor del punto | se aceptan enteros de 0 a 10 000 y un valor en dólares con 2 decimales, y cada cambio queda en la bitácora |
| CA-13 | RF-12-1 | un cambio posterior del valor configurado | se guarda | no altera los puntos ya acreditados |

## 5. Reglas de negocio

1. Mientras no exista una campaña activa, ambas partes reciben `puntosReferido` (por defecto 100). Así quedó escrito
   en RF-12-2 de la ERS y en el criterio de HU-021 (2026-11-16).
2. Cada movimiento tiene una clave única `actividad:evento:usuario`; así un evento repetido no duplica puntos.
3. Actividades previstas: `REFERIDO`, `CAPACITACION`, `TRIVIA`, `TALLER`, `RETO`. En este sprint solo `REFERIDO` tiene flujo real;
   las demás usan el mismo servicio cuando se construyan sus módulos (Sprint 4).
4. El saldo del usuario es la suma de sus movimientos.
5. La validación se ejecuta al activar el registro, validar la cuenta o corregir la asociación. Falta de requisitos o falla técnica conserva Pendiente; se reevalúa al completar datos y cada 5 minutos para incidencias técnicas.
6. La aprobación, ambos créditos y los eventos de aviso se confirman en una transacción, con claves únicas y reversión completa ante fallas. El administrador no decide el resultado.

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
| 2026-11-26 | Primera auditoría: validación automática institucional; criterios revisados y verificación pendiente | Equipo |
| 2026-11-10 | Primera implementación en la rama `sprint-2` | Equipo |
| 2026-11-14 | Integrada en `main`; vista del socio y listados por capacidad del rol (`esAdmin`) en vez de `rol === 'ADMIN'` | Equipo |
| 2026-11-16 | Pasa a `sprint-3/` (HU-020 a HU-022 son del Sprint 3). Regla de puntos sin campañas escrita en RF-12-2; criterio de HU-022 limitado a referidos hasta el Sprint 4; prueba de bitácora del dictamen (`RF-42: el dictamen…`); casos de uso CU-06.4 y CU-36 | Equipo |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad revisada al 26 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 3 |
| Historias | HU-020 · HU-021 · HU-022 |
| Épicas de BKL-G1 | EPI-07 · EPI-08 · EPI-10 |
| Requisitos de usuario | UR-15 · UR-16 · UR-19 · UR-24 · UR-44 |
| Requisitos funcionales | RF-11-2 · RF-11-4 · RF-12 (RF-12-1, RF-12-2) · RF-14-3 · RF-14-4 · RF-38 (RF-38-1) · RF-39 (RF-39-1, RF-39-2) · RF-42 · RF-50 |
| Requisitos no funcionales | RNF-01 · RNF-02 · RNF-05 · RNF-07 · RNF-09 · RNF-12 · RNF-13 · RNF-16 · RNF-20 · RNF-23 · RNF-24 |
| Casos de uso | CU-06 Consultar referidos · CU-06.2 Validar automáticamente un referido (revisado en auditoría 1) (extend) · CU-06.4 Acreditar los puntos al socio y al referido (extend de CU-06.2) · CU-36 Consultar notificaciones |
| Diagram_ID de comportamiento | 45 Sequence; 46 Activity; 47 Sequence; 48 Activity |
| Modelo UML revisado: casos de uso y clases | [SUMA-Diagramas_Vistas.eapx](../../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
