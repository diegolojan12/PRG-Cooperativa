# Especificación · Vinculación y verificación de la cuenta de la Cooperativa

> Revisión de auditoría 2026-11-26: la validación de cuentas y referidos es automática contra la base institucional autorizada. El administrador solo consulta. La implementación y las pruebas de esta revisión están pendientes; la evidencia del flujo manual es histórica. Véase [validación automática](../../validacion-automatica.md).

| Campo | Valor |
| ----- | ----- |
| Sprint | 2 |
| Historias | HU-015 · HU-016 |
| Épicas | EPI-06 (HU-015) · EPI-08 Verificar cuentas y referidos (HU-016) |
| Requisitos de usuario | UR-07 · UR-08 · UR-09 · UR-14 · UR-44 |
| Requisitos funcionales | RF-05 (RF-05-1 a RF-05-6) · RF-06 (RF-06-1 a RF-06-3) · RF-39 · RF-42 · RF-50 (RF-50-1, RF-50-2) |
| No funcionales | RNF-01 · RNF-02 · RNF-03 · RNF-05 · RNF-07 · RNF-08 · RNF-09 · RNF-11 · RNF-12 · RNF-13 · RNF-16 · RNF-20 · RNF-23 · RNF-24 |
| Casos de uso (EAPX) | CU-04 Solicitar vinculación de cuenta cooperativa · CU-04.1 Validar los datos y la unicidad de la cuenta (include) · CU-04.2 Registrar solicitud para validación automática (revisado en auditoría 1) (include) · CU-05.4 Comprobar que la cuenta vinculada esté aprobada (include de CU-05 y CU-12) · CU-18 Validar automáticamente una cuenta vinculada (revisado en auditoría 1) · CU-18.1 Generar el código y el enlace de referido (extend) |
| Clases de la implementación anterior | `CuentaCooperativa` (`numeroCuenta`, `tipoCuenta`, `estado`, `motivo`, `fechaRevision`; `aprobar`, `rechazar`, `numeroEnmascarado`, `estaAprobada`) · `Usuario 1 — 0..1 CuentaCooperativa` |
| Estado | Requisitos revisados tras auditoría; automatización pendiente de implementación y verificación |

## 1. Problema y objetivo

Solo quien tiene cuenta validada puede referir y canjear (UR-09). El sistema comprueba automáticamente existencia, titularidad y condición habilitada en la base institucional autorizada (RF-50, obligatorio). El prospecto participa en las demás funciones mientras completa sus requisitos.

## 2. Actores

| Actor | Qué hace |
| ----- | -------- |
| Socio / Cliente o prospecto | Vincula su cuenta al registrarse o desde *Mi cuenta*; ve su estado; vuelve a intentar si la rechazan. |
| Administrador | Consulta resultados e incidencias; no aprueba ni rechaza cuentas. |
| Sistema | Coteja la cuenta con la fuente institucional, persiste evidencia y resultado, reintenta y notifica. |

## 3. Historias de usuario (backlog `BKL-G1`)

- **HU-015** — Como socio/cliente, deseo vincular mi cuenta de ahorros o corriente para activar los beneficios de referir y canjear.
- **HU-016** — Como socio/cliente, deseo que mi cuenta vinculada se valide automáticamente contra la base institucional para confirmar mi titularidad sin esperar al administrador.

## 4. Criterios de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | HU-015 · RF-05-1 | un usuario en el registro (paso 2) o en *Mi cuenta* | elige Ahorros o Corriente y escribe el número | se aceptan solo esos 2 tipos y exactamente 10 dígitos |
| CA-02 | HU-015 · RF-05-2 · UR-14 | un número ya vinculado a otro usuario en estado Pendiente o Aprobado | se intenta vincular | se rechaza |
| CA-03 | HU-015 · RF-05 · RF-50 | una solicitud válida | se envía | se registra en máximo 3 s y se inicia la validación automática; con fuente disponible y vigente, el resultado completo llega en máximo 5 s |
| CA-04 | HU-015 · RF-05-5 | una cuenta vinculada | se muestra | solo se ven los 4 últimos dígitos, salvo que el titular pida verla |
| CA-05 | RF-05 · RF-50-2 | una solicitud Pendiente | se repite o reintenta | se reutiliza la solicitud, sin duplicados; una incidencia técnica se reintenta cada 5 minutos |
| CA-06 | HU-015 · RF-05-6 | una vinculación Rechazada | el titular corrige los datos | se inicia una nueva validación automática conservando el historial |
| CA-07 | HU-016 · RF-05-3 · UR-08 | el administrador consulta pendientes | se carga el listado | ve 20 por página, causa, último intento y siguiente reintento, sin acciones de aprobar o rechazar |
| CA-08 | HU-016 · RF-05-4 · RF-50 | fuente institucional disponible y vigente | responde al cotejo | el sistema aprueba con existencia, titularidad y condición habilitada confirmadas o rechaza con causa por incumplimiento; falla técnica conserva Pendiente |
| CA-09 | HU-016 · RF-39 | un resultado automático persistido | se confirma la transacción | el titular recibe aviso en máximo 5 s, una sola vez por evento |
| CA-10 | HU-016 · RF-42 · RNF-13 | un intento automático | se ejecuta | queda evidencia inmutable con origen Sistema, fecha, estados, causa, intento, versión de regla y referencia y vigencia de la fuente |
| CA-11 | RF-06-1 | un usuario sin cuenta Aprobada | intenta referir o generar su enlace | se bloquea |
| CA-12 | RF-06-2 | un usuario sin cuenta Aprobada | abre el inicio o Referidos | ve 1 aviso con el acceso a «Vincular mi cuenta» |
| CA-13 | RF-06 · RF-09 | cuenta aprobada automáticamente | se confirma el resultado | se habilitan beneficios y código en máximo 3 s y se reevalúa el referido asociado |
| CA-14 | RF-06-3 | un usuario sin cuenta verificada | usa capacitaciones, juegos, retos o comunidad | no se le bloquea por la cuenta |
| CA-15 | — | un rol sin experiencia Comunidad (Gestor, Administrador) | intenta vincular una cuenta | se rechaza |

## 5. Reglas de negocio

1. Estados de la vinculación: **Pendiente → Aprobado** o **Pendiente → Rechazado**.
2. La plataforma solo guarda el tipo y el número de la cuenta, cifrado (RNF-05, RNF-23); nunca saldos ni movimientos.
3. Unicidad del número entre vinculaciones Pendientes o Aprobadas, comparando el índice HMAC.
4. La validación vive en un servicio interno con acceso institucional de solo lectura y reglas documentadas (RNF-24). Ninguna ruta administrativa acepta decisiones manuales.
5. Pendiente expresa procesamiento, requisito faltante o reintento técnico. Los errores de conexión no implican rechazo. Se reintenta cada 5 minutos y tras completar los datos.
6. La fuente debe ser autorizada y vigente; una declaración del usuario o coincidencia de nombres no demuestra titularidad. Cada intento y resultado se audita como Sistema.

## 6. Fuera de alcance

- Consulta de saldos o movimientos financieros y operaciones sobre cuentas institucionales.
- Desvincular una cuenta Aprobada.

## 7. Preguntas abiertas

| # | Pregunta | Para | Estado |
| - | -------- | ---- | ------ |
| P-01 | Concretar fuente autorizada, esquema, vínculo verificable de identidad, condición habilitada y vigencia de datos. | Administración Tecnológica de la Cooperativa | Pendiente de definición técnica; validación automática requerida |

## 8. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11-26 | Primera auditoría: validación automática institucional; criterios revisados y verificación pendiente | Equipo |
| 2026-11-10 | Primera implementación en la rama `sprint-2` | Equipo |
| 2026-11-14 | Integrada en `main`; autorización por experiencia del rol en vez de `rol === 'SOCIO'`; prueba de la cola de revisión | Equipo |
| 2026-11-16 | Carpeta renumerada a `06-cuenta-cooperativa`; casos de uso CU-18, CU-18.1 y CU-05.4 (antes faltaba el caso de uso del administrador que verifica la cuenta, UR-08) | Equipo |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad revisada al 26 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 2 |
| Historias | HU-015 · HU-016 |
| Épicas de BKL-G1 | EPI-06 · EPI-08 |
| Requisitos de usuario | UR-07 · UR-08 · UR-09 · UR-14 · UR-44 |
| Requisitos funcionales | RF-05 (RF-05-1 a RF-05-6) · RF-06 (RF-06-1 a RF-06-3) · RF-39 · RF-42 · RF-50 (RF-50-1, RF-50-2) |
| Requisitos no funcionales | RNF-01 · RNF-02 · RNF-03 · RNF-05 · RNF-07 · RNF-08 · RNF-09 · RNF-11 · RNF-12 · RNF-13 · RNF-16 · RNF-20 · RNF-23 · RNF-24 |
| Casos de uso | CU-04 Solicitar vinculación de cuenta cooperativa · CU-04.1 Validar los datos y la unicidad de la cuenta (include) · CU-04.2 Registrar solicitud para validación automática (revisado en auditoría 1) (include) · CU-05.4 Comprobar que la cuenta vinculada esté aprobada (include de CU-05 y CU-12) · CU-18 Validar automáticamente una cuenta vinculada (revisado en auditoría 1) · CU-18.1 Generar el código y el enlace de referido (extend) |
| Diagram_ID de comportamiento | 43 Sequence; 44 Activity; 69 Sequence; 70 Activity; 101 Sequence; 102 Activity |
| Modelo UML revisado: casos de uso y clases | [SUMA-Diagramas_Vistas.eapx](../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
