# Validación automática de asociados y referidos

Revisión de requisitos del 26 de noviembre de 2026, a partir de la primera auditoría. Esta revisión sustituye la aprobación manual de cuentas y referidos y la exclusión anterior de RF-50. Conserva los identificadores de requisitos e historias. La automatización queda pendiente de implementación y verificación; las pruebas del flujo manual son evidencia histórica.

## Alcance y fuente de datos

La validación se realiza en el servidor contra la base institucional autorizada de la Cooperativa, directamente mediante acceso de solo lectura o a través de una réplica autorizada con origen y vigencia verificables. Una cuenta declarada en SUMA no demuestra por sí sola su existencia ni titularidad. El administrador consulta resultados, incidencias y reportes; no aprueba ni rechaza asociados, cuentas o referidos.

El cotejo comprueba identificador institucional del titular, tipo y número de cuenta y condición habilitada. La Cooperativa debe proporcionar el diccionario de datos y el mecanismo que relaciona de forma verificable el usuario de SUMA con ese titular. No se considera suficiente coincidir solo por nombre. La confirmación del correo (RF-02) se conserva y no sustituye ese cotejo.

Esta revisión incorpora el acceso mínimo a datos institucionales necesario para validar. Sustituye las exclusiones de verificación automática presentes en el acta y el documento de visión anteriores. No incorpora consulta de saldos ni movimientos financieros, ni operaciones sobre cuentas de la Cooperativa.

## Flujo y estados

| Evento | Comprobación automática | Resultado |
| --- | --- | --- |
| Registro con cuenta o vinculación desde el perfil | Formato, unicidad, existencia institucional, titularidad y condición habilitada | Aprobado si todo coincide; Rechazado con causa si existe incumplimiento confirmado |
| Fuente inaccesible, respuesta incompleta o información sin vigencia | Registrar incidencia e intento, conservar solicitud y programar reintento cada 5 minutos | Pendiente; nunca aprobación ni rechazo por una falla técnica |
| Registro sin cuenta, correo aún sin confirmar o prospecto aún sin condición de asociado | Esperar a que se complete el requisito; reevaluar al cambiar ese dato | Referido Pendiente, sin puntos por conversión |
| Cuenta aprobada automáticamente y registro activo | Comprobar código, referidor habilitado, ausencia de autorreferencia y relación única | Referido Aprobado automáticamente; incumplimiento confirmado: Rechazado con causa |
| Asociación manual dentro de los primeros 30 días | Aplicar las mismas reglas automáticas | Vincular al referidor no equivale a aprobar |
| Corrección de cuenta Rechazada | Crear nuevo intento con datos corregidos y conservar decisiones anteriores | Nueva validación automática |
| Reintento, evento repetido o solicitudes simultáneas | Restricciones de unicidad y clave por evento y destinatario | Sin duplicados de relación, puntos ni notificaciones |

Pendiente expresa espera de datos o procesamiento automático. Se elimina la espera de decisión humana y el plazo de 2 días hábiles para revisión administrativa. Los listados y exportaciones de pendientes se mantienen para consulta, incidencias y contacto comercial.

## Requisitos afectados

| Tipo | Identificadores revisados |
| --- | --- |
| Usuario | UR-07, UR-08, UR-09, UR-14, UR-15, UR-16, UR-17, UR-18, UR-19, UR-40, UR-44, UR-48, UR-54 |
| Funcionales | RF-01 (flujo y dependencias), RF-05 y subrequisitos afectados, RF-06 y avisos, RF-09, RF-11 y subrequisitos afectados, RF-12-2, RF-39 y RF-39-2, RF-42 y RF-42-1, RF-50, RF-50-1 y RF-50-2 |
| No funcionales | RNF-01, RNF-02, RNF-03, RNF-05, RNF-07, RNF-08, RNF-09, RNF-11, RNF-12, RNF-13, RNF-16, RNF-20, RNF-23, RNF-24 |
| Historias | HU-015, HU-016, HU-017, HU-020, HU-021 y HU-024; impacto transversal en HU-011, HU-012, HU-013, HU-019, HU-022, HU-045 y HU-007 |

La redacción completa figura en `entregables/DocumentacionResumenRequisitos (1) (1).xlsx`. El backlog vigente es `entregables/Backlog_del_producto (3).xlsx`. RF-50 y sus subrequisitos pasan de «No tendrá» a «Debe tener». RNF-24 pasa a «Debe tener». Las estimaciones de RF-05, RF-11 y RF-50 quedan por reestimar; se conservan los sprints de referencia y no se acredita un nuevo cierre.

## Integridad y tiempos verificables

La base de datos garantiza unicidad de cuenta vinculada y relación de referido, integridad referencial y procesamiento transaccional. Al aprobar automáticamente un referido, el cambio de estado, los movimientos para ambas partes y los eventos de notificación se confirman juntos. Si falla la transacción, se revierte toda la operación. Los puntos y avisos usan claves únicas por evento y destinatario, incluso después de reinicios.

Con la fuente disponible y vigente, RF-50 devuelve el resultado completo en máximo 5 segundos. RF-05-4 persiste la decisión en máximo 2 segundos desde la respuesta, dentro de ese plazo total. RF-11-4 resuelve el referido en máximo 2 segundos tras cumplir todos los requisitos; RF-12-2 acredita a ambas partes en máximo 2 segundos desde la aprobación, con confirmación transaccional conjunta. RF-39 muestra el aviso en máximo 5 segundos desde la confirmación. No se suman plazos para justificar superar el límite total de RF-50.

Se conservan los objetivos de 500 usuarios concurrentes para rendimiento y 1,000 para capacidad. Las pruebas incluyen registros simultáneos, caída y recuperación de la fuente, eventos repetidos y reinicio del procesador. Los rechazos de negocio se distinguen de fallos internos en las mediciones.

Cada intento deja evidencia inmutable: origen Sistema, fecha, registro afectado, resultado, causa, estado anterior y nuevo, intento, versión de regla y referencia y fecha de la fuente. Los identificadores personales se protegen; no se registran saldos ni movimientos financieros. Los respaldos incluyen reintentos y claves de idempotencia.

## Aceptación de la revisión

| Caso | Resultado exigido |
| --- | --- |
| Cuenta existente, habilitada y del titular correcto | Aprobación automática sin acción administrativa |
| Cuenta inexistente, de otro titular o inhabilitada, confirmado por fuente vigente | Rechazo con causa y posibilidad de corrección |
| Sin cuenta, correo no confirmado o prospecto aún no asociado | Referido Pendiente; sin premio de conversión |
| Fuente caída, incompleta o desactualizada | Pendiente con reintento automático cada 5 minutos; sin decisión manual |
| Registro por enlace, alta manual o asociación corregida | Mismas reglas automáticas para todos los caminos |
| Cuenta o evento duplicado, incluso concurrente | Una vinculación y una relación; un crédito y un aviso por evento y destinatario |
| Falla entre los créditos de ambas partes | Reversión completa, sin aprobación ni crédito parcial |
| Intento de cambiar estado desde navegador o cuenta administrativa | Operación denegada; solo el servicio interno determina el resultado |
| Cambio de estado de cuenta válido | Habilita beneficios y genera código; reevaluación automática de referido asociado |
| Consulta administrativa o comercial | Permite seguimiento sin botones ni API de aprobación o rechazo |

## Dependencias de implementación

Se debe concretar con la Cooperativa el acceso autorizado, esquema institucional, vínculo de identidad y regla de condición habilitada, así como frecuencia de sincronización y umbral de vigencia si se usa réplica. Estas dependencias no alteran la decisión de automatizar ni justifican mantener aprobación manual. No se inventan registros institucionales para aprobar cuentas.

El modelo vigente para casos de uso y clases es `entregables/SUMA-Diagramas_Vistas.eapx`, actualizado el 26 de noviembre de 2026 con base en el ejemplo AUTOSYS de clase. La vista principal incluye 16 generales, uno por cada módulo de la columna Nombre (módulo) de Req. Funcionales, con RF-01 a RF-50 y 50 diagramas hijos con los 179 subrequisitos exactos de la matriz corregida. Cada RF es compuesto y abre su hijo. Las 59 vistas CU anteriores quedan como complemento. El diagrama principal de clases reúne los 56 elementos en una sola vista, conservando las 37 clases originales, incorporando cinco clases existentes en el código y justificando 14 propuestas por CRC. Son 19 clases con código confirmado, 23 originales pendientes y 14 propuestas, entre ellas una interfaz. Las tarjetas están en `entregables/SUMA-CRC-Clases.docx` y la lámina en `entregables/SUMA-Clases-Unificado.pdf`; seis recortes anteriores se conservan como complementarios. CU-18 y CU-06.2 representan validación automática; CU-04.2 registra la solicitud y CU-06.4 acredita a ambas partes una sola vez. El administrador no decide los resultados. La revisión se exporta a `entregables/SUMA-Casos-de-uso-y-clases-Auditoria1.pdf` y a SVG en `entregables/diagramas/Revision-auditoria-1/`. Las secuencias y actividades afectadas se conservan como HISTÓRICO y requieren adaptación. Los otros EAPX, las ilustraciones anteriores de Word y la guía PDF anterior conservan el diseño previo. La implementación del código sigue pendiente.
