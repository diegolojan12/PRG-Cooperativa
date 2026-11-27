# Especificación · Gestión de referidos

> Revisión de auditoría 2026-11-26: la validación de cuentas y referidos es automática contra la base institucional autorizada. El administrador solo consulta. La implementación y las pruebas de esta revisión están pendientes; la evidencia del flujo manual es histórica. Véase [validación automática](../../validacion-automatica.md).

| Campo | Valor |
| ----- | ----- |
| Épicas | EPI-05 |
| Sprint | 2 |
| Historias | HU-011 · HU-012 |
| Requisitos de usuario | UR-13 · UR-16 · UR-17 · UR-54 |
| Requisitos funcionales | RF-11 · RF-11-3 · RF-11-4 · RF-11-5 · RF-11-6 · RF-50 |
| Casos de uso (EAPX) | CU-06 Consultar referidos · CU-06.1 Filtrar (extend) · CU-06.2 Validar automáticamente (extend; revisado en auditoría 1) · CU-06.5 Gestionar los datos de un referido (extend) · CU-06.6 Asociar manualmente (extend) |
| No funcionales | RNF-12 · RNF-13 |
| Estado | Base anterior implementada en el alcance indicado; integración automática revisada pendiente de implementación y verificación |
| Fuente previa | [`docs/CORRECCIONES-AUDITORIA-SPRINT1.md`](../../../../docs/CORRECCIONES-AUDITORIA-SPRINT1.md) · auditoría G01, G06, G08, G11, G12 |

## 1. Problema y objetivo

El corazón de SUMA es que un socio recomiende a personas para que se unan a la cooperativa. El socio necesita
registrar y seguir a sus referidos. El sistema los valida automáticamente contra los requisitos institucionales; la administración consulta resultados e incidencias, sin perder historial ni crear duplicados.

## 2. Actores

| Actor | Qué puede hacer |
| ----- | --------------- |
| Socio | Registrar referidos, ver y editar los suyos mientras están *Pendientes*, darlos de baja con motivo. |
| Administrador | Ver, filtrar y exportar referidos y asociar manualmente un usuario a un socio; esa asociación dispara validación automática y no equivale a aprobación. |
| Gestor de contenidos | No accede a referidos. |

## 3. Historias de usuario

- **HU-011 · Gestión de referidos** — Como Socio / Cliente o Administrador, quiero registrar, modificar o dar de baja
  referidos para dar seguimiento a las personas invitadas. En el backlog se usa «Usuario General» como categoría de usuario. Esta especificación detalla los permisos y la propiedad de los registros; UR-54 cubre el alta manual.
- **HU-012 · Administración de referidos** — Como administrador, quiero administrar el listado completo de todos los
  referidos para tener control total del seguimiento: tabla global de 20 por página con filtros. El socio solo ve los suyos.
- Como socio/cliente, quiero que el sistema valide mis referidos automáticamente para acreditar los puntos cuando cumplan los requisitos (HU-021 · Sprint 3; revisión pendiente de implementar).
- Como administrador, quiero asociar manualmente a un usuario recién registrado con el socio que lo invitó,
  para corregir los casos en que no usó el enlace.

## 4. Criterios de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | RF-11 | un socio | registra un referido con nombre, correo, celular y consentimiento | el referido queda *Pendiente* y asociado a ese socio |
| CA-02 | RF-11 / RNF-12 | un formulario con celular inválido | se envía | se rechaza indicando el campo |
| CA-03 | RF-11 | un referido sin consentimiento del tratamiento de datos | se envía | se rechaza |
| CA-04 | RNF-12 | un texto con código HTML o script | se envía | se rechaza |
| CA-05 | RF-11 | un correo que ya tiene un referido activo | se registra otra vez | se rechaza por duplicado |
| CA-06 | RF-11-3 | un listado de referidos | se consulta | muestra 20 por página y el total por estado |
| CA-07 | RF-11-3 | el listado del administrador | se filtra por estado, fechas, búsqueda, campaña o provincia | solo aparecen los que cumplen el filtro; un estado inexistente se rechaza |
| CA-08 | RF-11-3 | un referido Pendiente | se consulta | muestra requisito faltante o causa técnica, fecha y último intento, sin cola de dictamen administrativo |
| CA-09 | RF-11 | un socio | consulta o edita referidos de otro socio | no los ve ni los puede editar |
| CA-10 | RF-11-4 · RNF-12 | un socio o administrador | intenta fijar el resultado manualmente | se deniega; solo el servicio interno decide el estado |
| CA-11 | RF-11-4 | un referido sin registro activo o cuenta validada | el sistema reevalúa | conserva Pendiente por requisito faltante y no acredita puntos |
| CA-12 | RF-11-4 · RF-12-2 · RF-50 | registro activo, cuenta validada y relación válida y única | el sistema reevalúa | aprueba automáticamente y acredita a ambas partes una sola vez, con bitácora y avisos |
| CA-13 | RF-11-4 · RNF-20 | un resultado ya confirmado | se repite o concurre el evento | no duplica cambios, créditos ni avisos; el socio no edita decisiones confirmadas |
| CA-14 | RF-11-6 | un socio con un referido *Pendiente* | lo da de baja sin motivo | se rechaza; con motivo, deja de aparecer pero se conserva en la base |
| CA-15 | RF-11-6 | un referido dado de baja | se registra otra vez el mismo correo | se acepta |
| CA-16 | RF-11-6 | un referido *Aprobado* | el socio intenta darlo de baja | se le niega |
| CA-17 | RF-11-5 | usuario registrado hace 30 días o menos | el administrador lo asocia al referidor | se comprueba unicidad y se dispara validación automática; no se aprueba por la asociación manual |
| CA-18 | RF-11-5 | un usuario | se intenta asociarlo consigo mismo o pasados 30 días | se rechaza; quien se registró hace más de 30 días ni siquiera aparece en la lista de asociables |
| CA-19 | RF-11-3 · T-01 | una persona que se registró con código | se filtra el listado por su provincia | aparece, porque el referido hereda la provincia de su usuario |
| CA-20 | RF-11 | la lista de usuarios asociables y de socios | se arma | incluye a todos los roles participantes (experiencia Comunidad), no solo al rol llamado `SOCIO` |

## 5. Reglas de negocio

1. Estados: **Pendiente → Aprobado** o **Pendiente → Rechazado**, resueltos por el servicio automático. Pendiente espera datos o reintento técnico, sin decisión administrativa.
2. Para aprobar automáticamente se exige registro activo, cuenta validada por RF-50 y relación válida y única, sin autorreferencia.
3. Los puntos por referido aprobado son el valor de `puntosReferido` **vigente en el momento de aprobar**.
4. El correo es único solo entre los referidos activos (no dados de baja).
5. La baja es lógica: guarda fecha, quién la hizo y el motivo.
6. Celular: 10 dígitos que empiezan con `09`.
7. La antigüedad se usa para seguimiento comercial y de incidencias; no representa un plazo de aprobación administrativa. Las fallas técnicas se reintentan cada 5 minutos.

## 6. Fuera de alcance

- Enlace y QR de invitación, alta por enlace (HU-017 a HU-019 · Sprint 3, ya programadas en `sprint-3/01-invitacion`).
- Campañas (HU-025 a HU-027 · Sprint 3). El filtro de campaña solo muestra opciones cuando haya datos; el de provincia ya funciona (CA-19).

## 7. Requisitos no funcionales aplicables

- RNF-12 — Validación y saneamiento de entradas.
- RNF-13 — Bitácora de altas, cambios, dictámenes, bajas y asociaciones.
- RNF-05 — Correo y celular del referido cifrados (ver `sprint-1/03-proteccion-datos`).

## 8. Preguntas abiertas

| # | Pregunta | Para | Estado |
| - | -------- | ---- | ------ |
| P-01 | ¿El socio puede dar de baja sus referidos *Pendientes* o solo la administración? | PO | Confirmado: sí puede (HU-011 reescrita y UR-54). Confirmada por el usuario al autorizar la corrección de HU-011/HU-012 (2026-11-19) |
| P-02 | ¿Qué número de HU corresponde a cada criterio? | PO | Resuelta: CA-01 a CA-05, CA-09, CA-14 a CA-16 → HU-011; CA-06 a CA-08 → HU-012 |

## 9. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11-26 | Primera auditoría: validación automática institucional; criterios revisados y verificación pendiente | Equipo |
| 2026-11 | Estados pasan a Pendiente/Aprobado/Rechazado; migración CONTACTADO→PENDIENTE, VALIDADO→APROBADO (G01) | Equipo |
| 2026-11 | Baja lógica (G06), listado de 20 con filtros y atraso (G08), dictamen con cuenta aprobada (G11), asociación manual (G12) | Equipo |
| 2026-11-14 | Documentado como spec SDD a partir del código y las pruebas | Equipo |
| 2026-11-14 | HU-011 y HU-012 identificadas en el backlog. Sprint 2: el socio necesita cuenta Aprobada para referir (RF-06-1) y ve 10 por página con nombre de pila (HU-020) | Equipo |
| 2026-11-16 | Pasa del Sprint 1 al 2 (HU-011 y HU-012 son del Sprint 2). HU-011 y HU-012 reescritas; UR-54; CA-18 con prueba de 30 días; CA-19 (provincia) y CA-20 (roles participantes) nuevos; casos de uso CU-06.5 y CU-06.6 | Equipo |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad revisada al 26 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 2 |
| Historias | HU-011 · HU-012 |
| Épicas de BKL-G1 | EPI-05 |
| Requisitos de usuario | UR-13 · UR-16 · UR-17 · UR-54 |
| Requisitos funcionales | RF-11 · RF-11-3 · RF-11-4 · RF-11-5 · RF-11-6 · RF-50 |
| Requisitos no funcionales | RNF-12 · RNF-13 |
| Casos de uso | CU-06 Consultar referidos · CU-06.1 Filtrar (extend) · CU-06.2 Validar automáticamente (extend; revisado en auditoría 1) · CU-06.5 Gestionar los datos de un referido (extend) · CU-06.6 Asociar manualmente (extend) |
| Diagram_ID de comportamiento | 45 Sequence; 46 Activity; 47 Sequence; 48 Activity |
| Modelo UML revisado: casos de uso y clases | [SUMA-Diagramas_Vistas.eapx](../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
