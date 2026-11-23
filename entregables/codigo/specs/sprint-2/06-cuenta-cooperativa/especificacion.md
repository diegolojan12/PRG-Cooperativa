# Especificación · Vinculación y verificación de la cuenta de la Cooperativa

| Campo | Valor |
| ----- | ----- |
| Sprint | 2 |
| Historias | HU-015 · HU-016 |
| Épicas | EPI-06 (HU-015) · EPI-08 Verificar cuentas y referidos (HU-016) |
| Requisitos de usuario | UR-07 · UR-08 · UR-09 · UR-14 · UR-44 |
| Requisitos funcionales | RF-05 (RF-05-1 a RF-05-6) · RF-06 (RF-06-1 a RF-06-3) · RF-39 · RF-42 |
| No funcionales | RNF-05 · RNF-12 · RNF-16 · RNF-23 · RNF-24 |
| Casos de uso (EAPX) | CU-04 Solicitar vinculación de cuenta cooperativa · CU-04.1 Validar los datos y la unicidad de la cuenta (include) · CU-04.2 Registrar la solicitud pendiente (include) · CU-05.4 Comprobar que la cuenta vinculada esté aprobada (include de CU-05 y CU-12) · CU-18 Verificar una cuenta vinculada · CU-18.1 Generar el código y el enlace de referido (extend) |
| Clases (EAPX) | `CuentaCooperativa` (`numeroCuenta`, `tipoCuenta`, `estado`, `motivo`, `fechaRevision`; `aprobar`, `rechazar`, `numeroEnmascarado`, `estaAprobada`) · `Usuario 1 — 0..1 CuentaCooperativa` |
| Estado | Implementada · Verificada |

## 1. Problema y objetivo

Solo quien es socio de la Cooperativa puede referir y canjear (UR-09). Como no hay integración con el sistema de
la Cooperativa (acta de constitución, RF-50 «No tendrá»), la persona declara su cuenta y la administración la verifica
a mano. Mientras tanto, el prospecto participa en todo lo demás.

## 2. Actores

| Actor | Qué hace |
| ----- | -------- |
| Socio / Cliente o prospecto | Vincula su cuenta al registrarse o desde *Mi cuenta*; ve su estado; vuelve a intentar si la rechazan. |
| Administrador | Revisa la cola de pendientes y aprueba o rechaza con motivo. |

## 3. Historias de usuario (backlog `BKL-G1`)

- **HU-015** — Como socio/cliente, deseo vincular mi cuenta de ahorros o corriente para activar los beneficios de referir y canjear.
- **HU-016** — Como administrador, deseo verificar las cuentas vinculadas para confirmar que pertenecen a su titular.

## 4. Criterios de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | HU-015 · RF-05-1 | un usuario en el registro (paso 2) o en *Mi cuenta* | elige Ahorros o Corriente y escribe el número | se aceptan solo esos 2 tipos y exactamente 10 dígitos |
| CA-02 | HU-015 · RF-05-2 · UR-14 | un número ya vinculado a otro usuario en estado Pendiente o Aprobado | se intenta vincular | se rechaza |
| CA-03 | HU-015 · RF-05 | una solicitud válida | se envía | queda en estado **Pendiente** |
| CA-04 | HU-015 · RF-05-5 | una cuenta vinculada | se muestra | solo se ven los 4 últimos dígitos, salvo que el titular pida verla |
| CA-05 | RF-05 | una solicitud Pendiente | el titular intenta vincular otra | se rechaza hasta que la revisen |
| CA-06 | HU-015 · RF-05-6 | una vinculación Rechazada | el titular ingresa otra cuenta | se acepta como nueva solicitud Pendiente |
| CA-07 | HU-016 · RF-05-3 · UR-08 | la cola del administrador | se consulta | lista las Pendientes de la más antigua a la más reciente, 20 por página, resaltando las de más de 2 días hábiles |
| CA-08 | HU-016 · RF-05-4 | una vinculación Pendiente | el administrador decide | solo puede quedar **Aprobado** o **Rechazado** (con motivo); otra decisión sobre una ya resuelta se rechaza |
| CA-09 | HU-016 · RF-39 | una decisión sobre la cuenta | se guarda | el titular recibe una notificación (llega a su pantalla en máximo 5 s) |
| CA-10 | HU-016 · RF-42 | una decisión sobre la cuenta | se guarda | queda en la bitácora con autor, usuario, estado anterior y nuevo y motivo |
| CA-11 | RF-06-1 | un usuario sin cuenta Aprobada | intenta referir o generar su enlace | se bloquea |
| CA-12 | RF-06-2 | un usuario sin cuenta Aprobada | abre el inicio o Referidos | ve 1 aviso con el acceso a «Vincular mi cuenta» |
| CA-13 | RF-06 · RF-09 | una cuenta que pasa a Aprobada | se aprueba | se habilitan referir y su enlace en ese momento (se genera su código; el uso del enlace es HU-017, `sprint-3/01-invitacion`) |
| CA-14 | RF-06-3 | un usuario sin cuenta verificada | usa capacitaciones, juegos, retos o comunidad | no se le bloquea por la cuenta |
| CA-15 | — | un rol sin experiencia Comunidad (Gestor, Administrador) | intenta vincular una cuenta | se rechaza |

## 5. Reglas de negocio

1. Estados de la vinculación: **Pendiente → Aprobado** o **Pendiente → Rechazado**.
2. La plataforma solo guarda el tipo y el número de la cuenta, cifrado (RNF-05, RNF-23); nunca saldos ni movimientos.
3. Unicidad del número entre vinculaciones Pendientes o Aprobadas, comparando el índice HMAC.
4. Toda la verificación vive en la ruta `PATCH /usuarios/:id/cuenta` y la clase `CuentaCooperativa`: es la única pieza
   que cambiaría si se integra la Cooperativa (RNF-24).
5. Días hábiles: sin fines de semana ni feriados fijos de Ecuador (misma regla que el Sprint 1).

## 6. Fuera de alcance

- Verificación automática con la Cooperativa (RF-50 · «No tendrá»).
- Desvincular una cuenta Aprobada.

## 7. Preguntas abiertas

| # | Pregunta | Para | Estado |
| - | -------- | ---- | ------ |
| P-01 | ¿Cómo comprueba la administración la titularidad (llamada, agencia)? Influye en el motivo de rechazo que se escribe. | Jefatura de Marketing | Abierta |

## 8. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11-10 | Primera implementación en la rama `sprint-2` | Equipo |
| 2026-11-14 | Integrada en `main`; autorización por experiencia del rol en vez de `rol === 'SOCIO'`; prueba de la cola de revisión | Equipo |
| 2026-11-16 | Carpeta renumerada a `06-cuenta-cooperativa`; casos de uso CU-18, CU-18.1 y CU-05.4 (antes faltaba el caso de uso del administrador que verifica la cuenta, UR-08) | Equipo |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 2 |
| Historias | HU-015 · HU-016 |
| Épicas de BKL-G1 | EPI-06 · EPI-08 |
| Requisitos de usuario | UR-07 · UR-08 · UR-09 · UR-14 · UR-44 |
| Requisitos funcionales | RF-05 (RF-05-1 a RF-05-6) · RF-06 (RF-06-1 a RF-06-3) · RF-39 · RF-42 |
| Requisitos no funcionales | RNF-05 · RNF-12 · RNF-16 · RNF-23 · RNF-24 |
| Casos de uso | CU-04 Solicitar vinculación de cuenta cooperativa · CU-04.1 Validar los datos y la unicidad de la cuenta (include) · CU-04.2 Registrar la solicitud pendiente (include) · CU-05.4 Comprobar que la cuenta vinculada esté aprobada (include de CU-05 y CU-12) · CU-18 Verificar una cuenta vinculada · CU-18.1 Generar el código y el enlace de referido (extend) |
| Diagram_ID de comportamiento | 43 Sequence; 44 Activity; 69 Sequence; 70 Activity; 101 Sequence; 102 Activity |
| Modelo UML vigente | [SUMA-Diagramas_Vistas_Textos_Centrados.eapx](../../../../SUMA-Diagramas_Vistas_Textos_Centrados.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
