# Auditoría de trazabilidad · Sprint 2 · 2026-11-19

**Dictamen: no corresponde declarar el Sprint 2 completo al 100 % en código e interfaz. Se reprodujeron dos brechas funcionales, además de desajustes de trazabilidad y pendientes de aceptación.** No son observaciones sobre cumplimiento de RNF. La afirmación previa de «100 % funcional» se corrige con esta evidencia.

## Alcance y fuentes

- Historias vigentes: HU-004 a HU-016, proyecto G2, sprint 58. HU-056/HU-057 pertenecen ahora al Sprint 5 y HU-055 duplica HU-023.
- Excel leído sin modificar: [DocumentacionResumenRequisitos.xlsx](<C:/Users/Usuario/Downloads/DocumentacionResumenRequisitos.xlsx>), hojas UserReq., Req. Funcionales, Req. No Funcionales y Trazabilidad. Se identificaron 50 RF principales y 179 subrequisitos, no 229 funciones exigibles en este sprint.
- Jira consultado en vivo: 13 historias y 53 subtareas hijas. El filtro sprint=58 devuelve los padres; las subtareas se recuperaron por parent para no omitirlas.
- Specs actuales, API, dominio, interfaces Angular, pruebas y navegador con datos aislados. No se auditaron diagramas EA ni se modificaron Jira, Excel, código de producto o criterios de aceptación.
- RNF: se comprueban identificadores y vínculos; **su cumplimiento no se evalúa**. Cuando un plazo aparece también dentro de una HU o RF, se señala como no medido; no se cambia silenciosamente el texto del requisito.

## Hallazgos funcionales reproducidos

### F-01 · El socio no puede editar sus referidos desde la app · HU-011

La historia permite editar referidos propios Pendientes. `puedeEditar` devuelve verdadero únicamente para administradores. El listado del socio devuelve solo nombre de pila, fecha y estado, por privacidad; tampoco proporciona los datos completos necesarios para rellenar el formulario actual.

Evidencia: alta del socio HTTP 201, referido propio Pendiente con **0 botones Editar** y 1 botón de baja; edición del mismo registro por API HTTP 200. El servidor implementa la operación, la interfaz no.

Código: [permiso de edición](../frontend/src/app/features/referidos/referidos.page.ts:150), [proyección privada](../backend/src/dominio/referidos.mjs:76), [API de edición](../backend/src/api.mjs:1075). [Captura](../.local/test-results/AUDITORIA-S2-socio-sin-editar.png).

Corrección necesaria: resolver la edición de registros propios en la interfaz sin exponer datos de contacto en el listado ni datos de otros socios; mantener las restricciones de registros vinculados a cuentas y su aceptación explícita. No basta con mostrar el botón y rellenar campos vacíos.

### F-02 · El mensaje de bienvenida configurable no se aplica en los inicios actuales · HU-006 / UR-46 / RF-14

Se guardó un mensaje distinto en Configuración dentro de una base aislada (HTTP 200). `/api/overview` devolvió el nuevo mensaje. El inicio del socio lo mostró **0 veces**: mantiene una frase fija. El dashboard del gestor tampoco consume ese parámetro. La página Resumen antigua sí lo muestra, pero no es la entrada actual del socio ni del gestor.

Código: [respuesta de overview](../backend/src/api.mjs:856), [texto fijo del socio](../frontend/src/app/features/comunidad/feed.page.html:12), [Resumen antiguo](../frontend/src/app/features/resumen/resumen.page.html:24), [rutas actuales](../frontend/src/app/app.routes.ts:71). [Captura](../.local/test-results/AUDITORIA-S2-bienvenida-no-aplicada.png).

Corrección necesaria: definir en qué inicio se aplica el mensaje e incorporarlo allí con prueba de guardar → abrir inicio → ver cambio. No se modificaron datos reales.

## Matriz HU → UR → RF → evidencia → subtareas

| HU / Jira | UR | RF y subrequisitos | Subtareas Listo / total | Resultado |
| --- | --- | --- | --- | --- |
| [HU-004](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-24) | UR-05 | RF-07, RF-07-1, RF-07-2 | 3/4 | Flujo funcional cubierto; plazo de correo del criterio sin medir. |
| [HU-005](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-25) | UR-04, UR-49 | RF-45-1, RF-08-3, RF-08-4 | 4/4 | Dashboard exclusivo cubierto; RF-45-1 compartido sigue parcial: cuatro indicadores reales y dos de módulos futuros. |
| [HU-006](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-26) | UR-46 | RF-14, RF-14-1, RF-14-2, RF-14-3, RF-14-4 | 4/4 | INCOMPLETA en interfaz: el mensaje de bienvenida se guarda pero no se muestra en los inicios actuales. |
| [HU-007](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-27) | UR-48 | RF-42, RF-42-1, RF-42-2 | 4/4 | Registro, inmutabilidad y filtros funcionales cubiertos; no se evaluaron retención, respaldos ni plazos. |
| [HU-008](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-28) | UR-04, UR-53 | RF-49-4, RF-08-3, RF-08-4 | 1/4 | Menús y diseño adaptable implementados; validación integral RNF excluida. |
| [HU-009](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-29) | UR-53 | RF-49, RF-49-3 | 2/3 | Sistema de avisos funcional implementado; plazo de un segundo no certificado. |
| [HU-010](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-30) | UR-53 | RF-49-1, RF-49-2 | 2/3 | Ayudas y errores por campo implementados; sigue pendiente registrar la revisión completa de formularios de G2-122. |
| [HU-011](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-31) | UR-54, UR-13 | RF-11, RF-11-5, RF-11-6 | 3/5 | INCOMPLETA: API permite editar al socio, interfaz solo muestra Editar al administrador. |
| [HU-012](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-32) | UR-17, UR-16 | RF-11-3, RF-11-4 | 2/4 | Listado, filtros, paginación y permisos cubiertos. Campañas: filtro preparado; gestión corresponde al Sprint 3. |
| [HU-013](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-33) | UR-01, UR-13, UR-14, UR-52 | RF-01, RF-01-1, RF-01-2, RF-01-3, RF-01-4, RF-01-5, RF-01-6, RF-47, RF-47-1, RF-47-2, RF-08-2 | 4/5 | Reglas funcionales de registro y aceptación cubiertas con aviso de prueba; tiempos no medidos. UR-22 es una vinculación errónea de la spec/RF-01. |
| [HU-014](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-34) | UR-02 | RF-02, RF-02-1, RF-02-2, RF-02-3 | 3/4 | Código, caducidad, reenvíos y bloqueo de login cubiertos; entrega real en 60 s no medida para este flujo. |
| [HU-015](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-35) | UR-07, UR-09, UR-14 | RF-05, RF-05-1, RF-05-2, RF-05-5, RF-05-6, RF-06, RF-06-1, RF-06-2, RF-06-3 | 3/4 | Vinculación, máscara, nuevo intento y bloqueo para referir cubiertos. RF-06/UR-09 no completos globalmente: canje y otros módulos son posteriores. |
| [HU-016](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-36) | UR-08, UR-44 | RF-05-3, RF-05-4, RF-39, RF-39-1, RF-39-2, RF-42 | 4/5 | Cola, antigüedad, aprobación/rechazo, notificación y contador cubiertos. Plazos y método operativo de verificar titularidad sin certificar. |

Una HU de alcance básico puede estar implementada sin completar todo su RF padre: los RF compartidos se desglosan por las historias y sprints que los implementan. No se cuenta dos veces una dependencia heredada o una función adelantada.

## Matriz de requisitos de usuario

Los requisitos compuestos se cubren por etapas; citar una UR no certifica todos sus componentes.

| UR | Fila UserReq. | Requisito de usuario | HU del Sprint 2 que contribuye | Observación |
| --- | --- | --- | --- | --- |
| UR-01 | 3 | Crear una cuenta | HU-013 | Véase evidencia y resultado de cada HU vinculada. |
| UR-02 | 4 | Confirmar el correo | HU-014 | Véase evidencia y resultado de cada HU vinculada. |
| UR-04 | 6 | Ver solo las opciones de su rol | HU-005, HU-008 | Véase evidencia y resultado de cada HU vinculada. |
| UR-05 | 7 | Recuperar el acceso | HU-004 | Véase evidencia y resultado de cada HU vinculada. |
| UR-07 | 9 | Vincular la cuenta de la Cooperativa | HU-015 | Véase evidencia y resultado de cada HU vinculada. |
| UR-08 | 10 | Verificar las cuentas vinculadas | HU-016 | Cola y resaltado implementados; la atención dentro de 2 días requiere operación humana. |
| UR-09 | 11 | Acceso según la verificación | HU-015 | Parcial de producto: canje y participación completa en módulos futuros fuera de Sprint 2. |
| UR-13 | 15 | Quedar asociado a quien invitó | HU-011, HU-013 | Véase evidencia y resultado de cada HU vinculada. |
| UR-14 | 16 | Evitar registros repetidos | HU-013, HU-015 | Véase evidencia y resultado de cada HU vinculada. |
| UR-16 | 18 | Aprobar o rechazar referidos | HU-012 | Véase evidencia y resultado de cada HU vinculada. |
| UR-17 | 19 | Atender los referidos pendientes | HU-012 | Cola y resaltado implementados; la atención dentro de 2 días requiere operación humana. |
| UR-44 | 46 | Enterarse de lo importante | HU-016 | Cobertura parcial: avisos de cuenta/referidos. Nivel, campañas y recordatorios corresponden a otros sprints. |
| UR-46 | 48 | Configurar la plataforma | HU-006 | Brecha F-02: mensaje configurable no visible; puntos por acción compartidos con HU-029. |
| UR-48 | 50 | Auditar acciones | HU-007 | Véase evidencia y resultado de cada HU vinculada. |
| UR-49 | 51 | Medir el programa | HU-005 | Parcial de producto: dashboard básico ahora, indicadores completos/reportes en Sprint 5. |
| UR-52 | 54 | Autorizar el tratamiento de datos | HU-013 | Aceptación del aviso de prueba; publicación/aprobación oficial en HU-057, Sprint 5. |
| UR-53 | 55 | Entender cada pantalla | HU-008, HU-009, HU-010 | Véase evidencia y resultado de cada HU vinculada. |
| UR-54 | 56 | Registrar referidos a mano | HU-011 | Alta manual cubierta; gestión de HU-011 incompleta por F-01. |

## Inventario de RF revisados y límites del sprint

Se revisan 65 identificadores entre RF principales/subrequisitos relacionados con estas historias y sus dependencias. No se presenta un porcentaje: incluye requisitos padres, hijos y funciones compartidas de distinto alcance. Los demás RF del Excel no se exigen por pertenecer al producto completo.

| RF | Fila en Req. Funcionales | Descripción | HU del alcance o dependencia | Resultado de revisión | Plazo incluido en el RF |
| --- | --- | --- | --- | --- | --- |
| RF-01 | 3 | Registro de cuenta en 3 pasos | HU-013 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | máximo de 3 segundos · no certificado en esta auditoría |
| RF-01-1 | 7 | Crear (Paso 1: datos) | HU-013 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-01-2 | 8 | Validar (Unicidad) | HU-013 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-01-3 | 9 | Crear (Paso 2: cuenta) | HU-013 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-01-4 | 10 | Crear (Paso 3: contraseña) | HU-013 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-01-5 | 11 | Crear (Código de referido) | HU-013 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-01-6 | 12 | Leer (Progreso) | HU-013 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-02 | 13 | Confirmación de correo | HU-014 | Regla funcional implementada; plazo incrustado en RF no medido de forma concluyente. | máximo de 60 segundos · no certificado en esta auditoría |
| RF-02-1 | 17 | Crear (Código) | HU-014 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | 10 minutos · no certificado en esta auditoría |
| RF-02-2 | 18 | Validar (Reenvío) | HU-014 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-02-3 | 19 | Validar (Activación) | HU-014 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-05 | 35 | Vinculación de la cuenta de la Cooperativa | HU-015 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | máximo de 3 segundos · no certificado en esta auditoría |
| RF-05-1 | 39 | Crear (Datos de la cuenta) | HU-015 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-05-2 | 40 | Validar (Unicidad) | HU-015 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-05-3 | 41 | Leer (Pendientes) | HU-016 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-05-4 | 42 | Actualizar (Verificación) | HU-016 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | máximo 2 segundos · no certificado en esta auditoría |
| RF-05-5 | 43 | Leer (Enmascarado) | HU-015 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-05-6 | 44 | Actualizar (Nuevo intento) | HU-015 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-06 | 45 | Acceso según la verificación de la cuenta | HU-015 | Parcial global: referir protegido; canje pendiente en Sprint 5. | máximo de 3 segundos · no certificado en esta auditoría |
| RF-06-1 | 49 | Validar (Bloqueo) | HU-015 | Parcial global: referir protegido; canje pendiente en Sprint 5. | 100 % · no certificado en esta auditoría |
| RF-06-2 | 50 | Leer (Aviso) | HU-015 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-06-3 | 51 | Leer (Funciones abiertas) | HU-015 | Regla sin bloqueo por cuenta en módulos disponibles; capacitaciones, juegos, talleres y retos completos son posteriores. | — |
| RF-07 | 52 | Recuperación de acceso | HU-004 | Regla funcional implementada; plazo incrustado en RF no medido de forma concluyente. | máximo de 60 segundos · no certificado en esta auditoría |
| RF-07-1 | 56 | Crear (Enlace) | HU-004 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | 30 minutos · no certificado en esta auditoría |
| RF-07-2 | 57 | Actualizar (Contraseña) | HU-004 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-08 | 58 | Roles y permisos | Dependencia / historia posterior | Dependencia heredada del Sprint 1; roles y auditoría con código y pruebas existentes. | máximo de 3 segundos · no certificado en esta auditoría |
| RF-08-1 | 62 | Actualizar (Rol) | Dependencia / historia posterior | Dependencia heredada del Sprint 1; roles y auditoría con código y pruebas existentes. | — |
| RF-08-2 | 63 | Crear (Rol por defecto) | HU-013 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-08-3 | 64 | Leer (Menú por rol) | HU-005, HU-008 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-08-4 | 65 | Validar (Acceso) | HU-005, HU-008 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | 100 % · no certificado en esta auditoría |
| RF-08-5 | 66 | Leer (Auditoría de roles) | Dependencia / historia posterior | Dependencia heredada del Sprint 1; roles y auditoría con código y pruebas existentes. | — |
| RF-11 | 81 | Registro y gestión de referidos | HU-011 | Registro automático/manual en API cubierto; gestión HU-011 incompleta por edición del socio ausente en UI. | máximo de 3 segundos · no certificado en esta auditoría |
| RF-11-1 | 85 | Validar (Código) | Dependencia / historia posterior | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-11-2 | 86 | Leer (Consulta propia) | Dependencia / historia posterior | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-11-3 | 87 | Leer (Listado global) | HU-012 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-11-4 | 88 | Actualizar (Dictamen) | HU-012 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | máximo 2 segundos · no certificado en esta auditoría |
| RF-11-5 | 89 | Crear (Asociación manual) | HU-011 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-11-6 | 90 | Eliminar (Baja lógica) | HU-011 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-11-7 | 91 | Crear (Exportación) | Dependencia / historia posterior | Compartido con HU-024, Sprint 3; CSV ya implementado. No se exige cierre de esa historia en Sprint 2. | máximo 10 segundos · no certificado en esta auditoría |
| RF-14 | 112 | Parámetros globales | HU-006 | Parcial: bienvenida configurada no visible en los inicios actuales. | máximo de 5 segundos · no certificado en esta auditoría |
| RF-14-1 | 116 | Validar (Tipo) | HU-006 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-14-2 | 117 | Leer (Auditoría) | HU-006 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-14-3 | 118 | Actualizar (Puntos por acción) | HU-006 | Valores configurables implementados por adelantado; uso completo compartido con HU-029/módulos posteriores. | — |
| RF-14-4 | 119 | Actualizar (Valor del punto) | HU-006 | Valores configurables implementados por adelantado; uso completo compartido con HU-029/módulos posteriores. | — |
| RF-39 | 299 | Alertas de referidos y de cuenta vinculada | HU-016 | Regla funcional implementada; plazo incrustado en RF no medido de forma concluyente. | máximo de 5 segundos · no certificado en esta auditoría |
| RF-39-1 | 303 | Crear (Privacidad) | HU-016 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-39-2 | 304 | Validar (Duplicidad) | HU-016 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | 5 minutos · no certificado en esta auditoría |
| RF-42 | 319 | Bitácora de auditoría | HU-007, HU-016 | Regla funcional implementada; plazo incrustado en RF no medido de forma concluyente. | máximo de 2 segundos · no certificado en esta auditoría |
| RF-42-1 | 323 | Crear (Registro) | HU-007 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-42-2 | 324 | Leer (Filtros) | HU-007 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | máximo 5 segundos · no certificado en esta auditoría |
| RF-45 | 338 | Tablero de indicadores | Dependencia / historia posterior | Parcial global: 4 indicadores calculados; 2 marcados como futuros (talleres/canje). HU-005 sí tiene dashboard exclusivo. | máximo de 5 segundos; máximo 24 horas · no certificado en esta auditoría |
| RF-45-1 | 342 | Leer (Indicadores) | HU-005 | Parcial global: 4 indicadores calculados; 2 marcados como futuros (talleres/canje). HU-005 sí tiene dashboard exclusivo. | — |
| RF-45-2 | 343 | Leer (Costo por captación) | Dependencia / historia posterior | Fuera de aceptación Sprint 2: reportes completos HU-054, Sprint 5. | — |
| RF-45-3 | 344 | Leer (Participación) | Dependencia / historia posterior | Fuera de aceptación Sprint 2: reportes completos HU-054, Sprint 5. | — |
| RF-45-4 | 345 | Crear (Exportación) | Dependencia / historia posterior | Fuera de aceptación Sprint 2: reportes completos HU-054, Sprint 5. | máximo 10 segundos · no certificado en esta auditoría |
| RF-47 | 353 | Autorización de tratamiento de datos | HU-013 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | máximo de 2 segundos · no certificado en esta auditoría |
| RF-47-1 | 357 | Validar (Aceptación) | HU-013 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-47-2 | 358 | Crear (Evidencia) | HU-013 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-47-3 | 359 | Leer (Conservación) | Dependencia / historia posterior | Conservación/operación diferida; no se evalúa aquí por acuerdo del usuario. | mínimo de 5 años · no certificado en esta auditoría |
| RF-47-4 | 360 | Crear (Versión del aviso) | Dependencia / historia posterior | Fuera de Sprint 2: HU-057 reprogramada al Sprint 5; código adelantado conservado. | — |
| RF-49 | 368 | Navegación, ayudas y mensajes de la interfaz | HU-009 | Reglas de mensajes implementadas; plazo incrustado en RF no medido de forma concluyente. | — |
| RF-49-1 | 372 | Leer (Ayuda en campos) | HU-010 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | 100 % · no certificado en esta auditoría |
| RF-49-2 | 373 | Leer (Campos con error) | HU-010 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |
| RF-49-3 | 374 | Leer (Mensajes) | HU-009 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | al menos 4 segundos · no certificado en esta auditoría |
| RF-49-4 | 375 | Leer (Menú) | HU-008 | Regla funcional cubierta por código y pruebas del alcance; ver matiz temporal si aplica. | — |

Matices de alcance:

- **RF-06 / UR-09:** la restricción para referir está implementada; el canje de premios (HU-045, Sprint 5) y los módulos posteriores todavía no existen completos. No es razonable exigirlos en Sprint 2, pero tampoco marcar RF-06 completo a nivel de producto.
- **RF-45-1 / UR-49:** cuatro indicadores calculados y dos anunciados para Sprint 4/5. El dashboard de HU-005 existe; tener seis tarjetas no equivale a seis indicadores reales.
- **RF-01-5, RF-11-1/2/4/7:** comportamientos compartidos o adelantados de HU-017 a HU-024. Su existencia no cierra automáticamente esas historias del Sprint 3.
- **RF-14-3/4:** configuración de puntos y valor del punto existente; uso completo compartido con HU-029 y funcionalidades posteriores. RF-14-4 permite dos decimales específicamente; no debe confundirse con los parámetros enteros de RF-14-1.
- **RF-47-1/2:** aceptación del aviso vigente y evidencia permanecen en Sprint 2. **RF-47-4 / HU-057:** gestión de versiones y textos oficiales se aceptan en Sprint 5. **RF-47-3:** conservación diferida; no se certifica.
- **RF-50:** la ausencia de integración automática con la cooperativa es una exclusión del producto, no una función faltante a programar para cerrar HU-015/016.

## Trazabilidad documental: contradicciones y enlaces incompletos

1. **UR-22 no es registro:** UserReq. fila 24 lo define como delimitar campañas. Trazabilidad fila 23 lo vincula correctamente a RF-13 / HU-025 / Sprint 3, pero RF-01 fila 3 y la spec de registro del Sprint 2 aún lo incluyen como dependencia. Se debe retirar esa vinculación incorrecta, sin borrar UR-22 del producto.
2. **UR-44 incluye cuenta vinculada:** la spec y HU-016 lo citan, pero Trazabilidad fila 45 solo lista HU-020/HU-022/HU-026 y Sprint 3. Falta añadir HU-016 y Sprint 2 como cobertura parcial de RF-39. No significa que todo UR-44 de campañas, nivel y recordatorios esté implementado.
3. **UR-52 quedó con alcance antiguo:** Trazabilidad fila 53 incluye CU-19.2 y `/api/configuracion/aviso` dentro de HU-013/Sprint 2. Tras mover HU-057, hay que distinguir aceptación en registro (Sprint 2) de gestión del aviso (Sprint 5).
4. **Estados de RF/UR compartidos:** el Excel marca UR-09, UR-46 y UR-49 como «Implementado y probado», aunque algunos componentes dependen de canje, talleres/reportes o del texto configurable que no se visualiza. Conviene registrar cobertura parcial por HU/sprint, no un estado global absoluto.
5. **Subtareas de acceso desactualizadas:** G2-123, G2-127, G2-128 y G2-131 aún hablan de resolver el criterio sin restricción de rol. La decisión ya se tomó y los padres se corrigieron; el contenido de estas subtareas necesita conciliación. La brecha de interfaz F-01 debe resolverse antes de certificar la gestión completa.
6. Los nombres antiguos de pruebas que mencionan HU-055/HU-056 son evidencia histórica de código; no cambian su planificación actual.

## RNF vinculados, sin evaluar cumplimiento

La tabla deriva los vínculos de la columna de RF relacionados de la hoja Req. No Funcionales, cruzada con los RF de cada historia. Un vínculo compartido no implica que la HU deba cerrar todo el RNF del producto ni que esté aprobado. Todos los identificadores de las specs existen en el Excel.

| HU | RNF relacionados por los RF del Excel | Evaluación |
| --- | --- | --- |
| HU-004 | RNF-03, RNF-04, RNF-14, RNF-16, RNF-22 | No evaluado, por instrucción del usuario |
| HU-005 | RNF-01, RNF-06, RNF-11, RNF-13 | No evaluado, por instrucción del usuario |
| HU-006 | RNF-12, RNF-13 | No evaluado, por instrucción del usuario |
| HU-007 | RNF-08, RNF-13 | No evaluado, por instrucción del usuario |
| HU-008 | RNF-06, RNF-10, RNF-13, RNF-15, RNF-16, RNF-17, RNF-18 | No evaluado, por instrucción del usuario |
| HU-009 | RNF-10, RNF-15, RNF-16, RNF-17, RNF-18 | No evaluado, por instrucción del usuario |
| HU-010 | RNF-10, RNF-15, RNF-16, RNF-17, RNF-18 | No evaluado, por instrucción del usuario |
| HU-011 | RNF-01, RNF-05, RNF-07, RNF-08, RNF-09, RNF-13 | No evaluado, por instrucción del usuario |
| HU-012 | RNF-01, RNF-05, RNF-07, RNF-08, RNF-09, RNF-13 | No evaluado, por instrucción del usuario |
| HU-013 | RNF-03, RNF-04, RNF-05, RNF-06, RNF-07, RNF-08, RNF-10, RNF-12, RNF-13, RNF-15, RNF-16, RNF-17, RNF-18 | No evaluado, por instrucción del usuario |
| HU-014 | RNF-03, RNF-14 | No evaluado, por instrucción del usuario |
| HU-015 | RNF-03, RNF-05, RNF-08, RNF-09, RNF-12, RNF-13, RNF-16, RNF-23, RNF-24 | No evaluado, por instrucción del usuario |
| HU-016 | RNF-03, RNF-05, RNF-08, RNF-09, RNF-12, RNF-13, RNF-16, RNF-23, RNF-24 | No evaluado, por instrucción del usuario |

Las specs ya citan RNF por funcionalidad, pero la hoja Trazabilidad del Excel se organiza UR → RF → CU → HU → Sprint y no contiene una columna explícita de RNF. La relación existe mediante la hoja de RNF y sus RF asociados; una matriz directa HU–RNF como esta evita tener que deducirla.

## Revisión de las 53 subtareas

Estado observado: **39 Listo y 14 Por hacer**. Las 13 historias padres están Listo. Esto no es una medida del porcentaje de código implementado. No se cambiaron estados durante la auditoría.

| Subtarea | Padre | Estado Jira | Resultado de auditoría |
| --- | --- | --- | --- |
| [G2-97 · Preparar el formulario de recuperación](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-97) | G2-24 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-98 · Generar y enviar el enlace temporal](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-98) | G2-24 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-99 · Restablecer la contraseña con el enlace](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-99) | G2-24 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-100 · Probar la recuperación y la entrega del correo](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-100) | G2-24 | Por hacer | Verificación/medición pendiente; separar de funciones ausentes y no declararla aprobada. |
| [G2-101 · Preparar la pantalla principal de administración](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-101) | G2-25 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-102 · Conectar los indicadores disponibles](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-102) | G2-25 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-103 · Restringir el panel a administración](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-103) | G2-25 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-104 · Verificar el dashboard](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-104) | G2-25 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-105 · Preparar el formulario de configuración general](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-105) | G2-26 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-106 · Validar los valores configurables](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-106) | G2-26 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-107 · Guardar y aplicar la configuración](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-107) | G2-26 | Listo | Guardar/persistir/auditar probado; aplicación visible de bienvenida incompleta (F-02). |
| [G2-108 · Probar y auditar las modificaciones](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-108) | G2-26 | Listo | Guardar/persistir/auditar probado; aplicación visible de bienvenida incompleta (F-02). |
| [G2-109 · Registrar las acciones operativas importantes](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-109) | G2-27 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-110 · Preparar la consulta de la bitácora](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-110) | G2-27 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-111 · Proteger el historial de actividad](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-111) | G2-27 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-112 · Verificar la trazabilidad de las operaciones](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-112) | G2-27 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-113 · Adaptar las pantallas a móvil y escritorio](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-113) | G2-28 | Por hacer | Verificación/medición pendiente; separar de funciones ausentes y no declararla aprobada. |
| [G2-114 · Preparar menús adaptables](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-114) | G2-28 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-115 · Revisar la accesibilidad de la interfaz](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-115) | G2-28 | Por hacer | Verificación/medición pendiente; separar de funciones ausentes y no declararla aprobada. |
| [G2-116 · Probar la interfaz en los navegadores previstos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-116) | G2-28 | Por hacer | Verificación/medición pendiente; separar de funciones ausentes y no declararla aprobada. |
| [G2-117 · Preparar los avisos de éxito y error](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-117) | G2-29 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-118 · Conectar los avisos con las operaciones](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-118) | G2-29 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-119 · Verificar que los avisos sean comprensibles y accesibles](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-119) | G2-29 | Por hacer | Verificación/medición pendiente; separar de funciones ausentes y no declararla aprobada. |
| [G2-120 · Añadir ayudas y ejemplos a los campos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-120) | G2-30 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-121 · Mostrar errores junto al campo correspondiente](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-121) | G2-30 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-122 · Revisar los formularios del sprint](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-122) | G2-30 | Por hacer | Revisión completa de formularios pendiente; las pruebas existentes son parciales respecto de todos los estados de formulario. |
| [G2-123 · Acordar el alcance de acceso a referidos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-123) | G2-31 | Por hacer | Texto desactualizado tras aprobar permisos; conciliar con nueva descripción del padre. No cerrar gestión completa sin resolver F-01. |
| [G2-124 · Preparar el alta y edición de referidos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-124) | G2-31 | Listo | Backend de alta/edición existe; edición del socio ausente en UI (F-01). Estado Listo no acredita ese flujo completo. |
| [G2-125 · Validar los datos y evitar duplicados](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-125) | G2-31 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-126 · Aplicar la baja lógica de referidos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-126) | G2-31 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-127 · Probar la gestión y sus permisos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-127) | G2-31 | Por hacer | Texto desactualizado tras aprobar permisos; conciliar con nueva descripción del padre. No cerrar gestión completa sin resolver F-01. |
| [G2-128 · Acordar quién puede consultar el listado global](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-128) | G2-32 | Por hacer | Texto desactualizado tras aprobar permisos; conciliar con nueva descripción del padre. No cerrar gestión completa sin resolver F-01. |
| [G2-129 · Preparar la tabla y su paginación](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-129) | G2-32 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-130 · Aplicar los filtros del listado](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-130) | G2-32 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-131 · Probar filtros y restricciones del listado](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-131) | G2-32 | Por hacer | Texto desactualizado tras aprobar permisos; conciliar con nueva descripción del padre. No cerrar gestión completa sin resolver F-01. |
| [G2-132 · Preparar el registro en tres pasos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-132) | G2-33 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-133 · Validar los datos personales y duplicados](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-133) | G2-33 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-134 · Integrar la cuenta y el código de referido opcionales](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-134) | G2-33 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-135 · Validar la contraseña y la aceptación de términos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-135) | G2-33 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-136 · Probar el alta y medir su duración](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-136) | G2-33 | Por hacer | Verificación/medición pendiente; separar de funciones ausentes y no declararla aprobada. |
| [G2-137 · Generar y enviar el código de confirmación](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-137) | G2-34 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-138 · Preparar la pantalla para confirmar el correo](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-138) | G2-34 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-139 · Controlar los reenvíos del código](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-139) | G2-34 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-140 · Probar la confirmación y la entrega del correo](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-140) | G2-34 | Por hacer | Verificación/medición pendiente; separar de funciones ausentes y no declararla aprobada. |
| [G2-141 · Preparar la vinculación en registro y cuenta personal](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-141) | G2-35 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-142 · Validar y guardar la cuenta vinculada](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-142) | G2-35 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-143 · Aplicar las restricciones por cuenta no aprobada](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-143) | G2-35 | Por hacer | Referir protegido; aceptación de canje depende de HU-045/Sprint 5. Delimitar por sprint. |
| [G2-144 · Probar vinculación y acceso a las demás funciones](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-144) | G2-35 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-145 · Preparar la cola de cuentas pendientes](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-145) | G2-36 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-146 · Identificar solicitudes atrasadas](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-146) | G2-36 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-147 · Guardar la aprobación o rechazo](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-147) | G2-36 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-148 · Notificar el resultado al titular](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-148) | G2-36 | Listo | Existe implementación y evidencia en su bloque; no certifica todos los criterios del padre. |
| [G2-149 · Probar la revisión y medir sus tiempos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-149) | G2-36 | Por hacer | Verificación/medición pendiente; separar de funciones ausentes y no declararla aprobada. |

Las 53 subtareas tienen un padre válido entre las 13 HU revisadas. Sus descripciones no incluyen una matriz explícita completa de UR/RF/RNF; la relación se hereda del padre y se consolida en las matrices anteriores. Esto es trazabilidad indirecta, no evidencia individual de cada criterio.

Clasificación de los 14 pendientes: 4 con texto de acceso desactualizado, 8 de medición/verificación, 1 de revisión completa de formularios y 1 de dependencia futura de canje. No se crean tareas nuevas ni se trasladan automáticamente.

## Evidencia y pruebas ejecutadas

| Verificación | Resultado | Límite |
| --- | --- | --- |
| Backend `npm run test:sprint` | 33/33 | Incluye pruebas de varios sprints; no mide todos los plazos ni recorre cada flujo de UI |
| Backend `npm run test:correo` | 4/4 | SMTP local y PostgreSQL aislado; no es recepción ni medición en bandeja externa |
| Frontend `npm test -- --watch=false --ts-config tsconfig.spec.json` | 18/18 | No había caso que exigiera Editar al socio ni visualizar la bienvenida guardada |
| Chromium, compilación de producto | Login admin con 2FA, 8 pantallas administrativas, alta/API/UI socio y bienvenida revisadas | Entorno y datos aislados; no se enviaron correos reales |
| Plantillas de formularios | 80 controles localizados; 5 candidatos sin app-campo o referencia de ayuda en roles, perfil futuro e invitación posterior | Revisión estática; no sustituye la revisión completa de errores por campo G2-122 |

[Resultados concretos del navegador](../.local/test-results/AUDITORIA-S2-evidencia.json). [Matriz estructurada](AUDITORIA-TRAZABILIDAD-SPRINT2-2026-11-19.json).

## Qué falta para afirmar cierre funcional

1. Corregir F-01: edición propia del socio desde la interfaz manteniendo la privacidad.
2. Corregir F-02: aplicar de forma visible el mensaje configurable en el inicio correspondiente.
3. Conciliar las cuatro subtareas de permisos y la de revisión de formularios con la evidencia real, sin convertir pendientes en aprobados por documentación.
4. Corregir los vínculos UR-22, UR-44 y UR-52 y documentar qué parte de los RF compartidos pertenece a cada sprint.
5. Mantener explícito que los plazos escritos en HU/RF no se han certificado; si se aceptan diferidos, debe constar el acuerdo sin cambiar su resultado a «cumplido». Los RNF no se evaluaron.

Esta auditoría no aplica las correcciones ni modifica Jira/Excel; identifica el trabajo necesario y sus fuentes.
