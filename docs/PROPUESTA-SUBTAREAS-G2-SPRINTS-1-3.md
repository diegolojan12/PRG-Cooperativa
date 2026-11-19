# Propuesta de subtareas · G2 · Sprints 1 a 3

Estado: **propuesta original**. Las subtareas de HU-001 a HU-029 ya se cargaron por autorización posterior;
consulta el [resultado verificado](RESULTADO-SUBTAREAS-G2-SPRINTS-1-3.md). El anexo HU-055 a HU-057 sigue siendo propuesta.
Fecha de consulta: 2026-11-19. Fuente principal: historias y criterios actuales de G2.

## Cómo usar la propuesta

- Cada fila es una subtarea independiente, hija de la historia indicada. El resumen será su título; la segunda columna sirve de descripción breve y resultado esperado.
- Las subtareas describen trabajo concreto; no necesitan repetir Como/Deseo/Para ni reciben nuevos números HU.
- Jira asignará sus claves G2 al crearlas. No se inventan claves, responsables, estimaciones o estados.
- Deben crearse como tipo Subtask dentro de la historia padre; no como tareas independientes del backlog.
- Se planifican con el sprint de su historia. No se propone mover historias ni iniciar/cerrar sprints.
- Es un desglose completo del alcance, no una afirmación de que todo esté pendiente. Revisar evidencia antes de marcar una subtarea terminada o reabrir una historia.
- Cuando falta una spec, se prepara para aprobación antes del código. Las pruebas se planifican desde el inicio conforme al método SDD.
- HU-003 cubre 2FA; HU-004, recuperación; HU-014, confirmación del registro. Comparten transporte SMTP, que se configura una sola vez, con pruebas de cada flujo.

## Alcance confirmado en Jira

| Sprint | ID de sprint | Historias asignadas | Subtareas propuestas |
| --- | --- | --- | --- |
| 1 | 57 | 3 | 13 |
| 2 | 58 | 13 | 53 |
| 3 | 54 | 13 | 55 |

Las 29 historias asignadas son HU-001 a HU-029. Las specs también ubican HU-055 a HU-057 en Sprint 2,
pero no aparecen asignadas a los sprints 57, 58 o 54 de Jira. Se incluyen como anexo de conciliación,
sin atribuirles una asignación que no tienen. HU-023/HU-055 se solapan: no duplicar trabajo.

## Cómo se vinculan en Jira

G2 tiene habilitado el tipo **Subtask** (subtarea). Abre la historia padre y usa **Añadir → Elemento de trabajo secundario**
(Add → Child work item; la etiqueta puede variar con idioma/interfaz). Escribe el resumen, selecciona Subtask si se solicita,
completa descripción y responsable cuando se acuerden y crea la subtarea. Debe aparecer dentro de la historia.
No es un archivo adjunto ni una nueva historia: la relación es **historia padre → subtarea hija**.

Ejemplo de padre: HU-003 corresponde a G2-23. Sus cinco subtareas se crearían dentro de G2-23, no en la épica.
Cada una se puede asignar y seguir por separado. No cambia la numeración HU-003 ni exige crear HU-062.

Fuente: [Atlassian · subtareas en proyectos gestionados por el equipo](https://support.atlassian.com/jira-software-cloud/docs/manage-subtasks-in-team-managed-projects/).

## Sprint 1

### HU-001 - Poder gestionar los roles y permisos del sistema

Historia padre: [G2-21](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-21). Sprint 1.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Preparar la gestión de roles | Mostrar roles, permisos y usuarios asignados en una pantalla administrable. |
| Guardar la asignación y retirada de permisos | Aplicar los cambios desde el servidor y conservarlos en la base de datos. |
| Crear cuentas internas y su activación | Crear cuentas de Gestor o Administrador y enviar un enlace de activación de 24 horas. |
| Verificar permisos y registrar cambios | Probar asignación, retirada, acceso denegado y activación; comprobar la bitácora. |

### HU-002 - Poder gestionar los accesos a los distintos módulos

Historia padre: [G2-22](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-22). Sprint 1.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Construir el menú según los permisos | Mostrar únicamente los módulos permitidos al usuario conectado. |
| Proteger las rutas y consultas de cada módulo | Denegar en el servidor y en la navegación el acceso sin permiso. |
| Actualizar el acceso cuando cambien los permisos | Reflejar la nueva asignación en la siguiente acción del usuario. |
| Probar la navegación de cada rol | Comprobar Administrador, Gestor y Socio, incluyendo accesos por URL directa. |

### HU-003 - Poder crear mi sesión e iniciar o cerrar de forma segura

Historia padre: [G2-23](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-23). Sprint 1.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Validar las credenciales de acceso | Aceptar correo y contraseña correctos y rechazar credenciales inválidas. |
| Gestionar el inicio y cierre de sesión | Crear y revocar la sesión de forma segura. |
| Cerrar sesiones por inactividad | Expirar la sesión después de 15 minutos sin actividad. |
| Validar el segundo factor del administrador | Enviar un código de seis dígitos por correo; exigirlo antes de abrir sesión, con cinco minutos de vigencia y un solo uso. |
| Probar el flujo completo de acceso | Comprobar inicio, cierre, inactividad y códigos incorrectos, usados o vencidos. |

## Sprint 2

### HU-004 - Poder recuperar el acceso a mi sesión

Historia padre: [G2-24](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-24). Sprint 2.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Preparar el formulario de recuperación | Permitir solicitar el enlace desde la pantalla de acceso y mostrar la respuesta correspondiente. |
| Generar y enviar el enlace temporal | Enviar al correo registrado un enlace de un solo uso que venza a los 30 minutos. |
| Restablecer la contraseña con el enlace | Validar la nueva clave, guardarla con hash y revocar sesiones y desafíos anteriores según la spec. |
| Probar la recuperación y la entrega del correo | Comprobar recepción en máximo 60 segundos y rechazo de enlaces usados o vencidos. |

### HU-005 - Poder usar un panel de administración central

Historia padre: [G2-25](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-25). Sprint 2.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Preparar la pantalla principal de administración | Construir el dashboard y los accesos a sus secciones. |
| Conectar los indicadores disponibles | Consultar datos reales y distinguir indicadores de módulos todavía no implementados. |
| Restringir el panel a administración | Comprobar permisos tanto en las pantallas como en las consultas del servidor. |
| Verificar el dashboard | Probar navegación, indicadores y denegación de acceso a usuarios sin permiso. |

### HU-006 - Poder configurar las opciones generales de la plataforma

Historia padre: [G2-26](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-26). Sprint 2.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Preparar el formulario de configuración general | Mostrar textos, límites y variables globales que el administrador puede cambiar. |
| Validar los valores configurables | Rechazar valores fuera de los límites y señalar el campo a corregir. |
| Guardar y aplicar la configuración | Conservar los cambios y hacer que rijan en las operaciones correspondientes. |
| Probar y auditar las modificaciones | Verificar persistencia y registro del valor anterior y nuevo en la bitácora. |

### HU-007 - Poder consultar el registro de actividades del sistema

Historia padre: [G2-27](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-27). Sprint 2.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Registrar las acciones operativas importantes | Guardar usuario, acción, fecha y demás datos exigidos por la spec. |
| Preparar la consulta de la bitácora | Mostrar los registros con filtros y paginación. |
| Proteger el historial de actividad | Restringir su consulta y evitar la modificación o eliminación de registros. |
| Verificar la trazabilidad de las operaciones | Ejecutar operaciones de ejemplo y comprobar que su registro sea completo y consultable. |

### HU-008 - Poder usar una interfaz visual clara y fácil de entender

Historia padre: [G2-28](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-28). Sprint 2.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Adaptar las pantallas a móvil y escritorio | Comprobar la distribución entre 360 y 1920 píxeles según las specs. |
| Preparar menús adaptables | Permitir navegar por las secciones en pantallas pequeñas y grandes. |
| Revisar la accesibilidad de la interfaz | Comprobar teclado, foco, etiquetas y contraste. |
| Probar la interfaz en los navegadores previstos | Registrar resultados y corregir problemas de navegación o visualización. |

### HU-009 - Poder interactuar con mensajes y alertas visuales

Historia padre: [G2-29](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-29). Sprint 2.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Preparar los avisos de éxito y error | Definir mensajes visibles y distinguibles por texto e icono. |
| Conectar los avisos con las operaciones | Mostrar el resultado de guardar, editar, eliminar o consultar cuando corresponda. |
| Verificar que los avisos sean comprensibles y accesibles | Comprobar su lectura, comportamiento y anuncio a tecnologías de asistencia. |

### HU-010 - Poder recibir asistencia visual en los formularios

Historia padre: [G2-30](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-30). Sprint 2.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Añadir ayudas y ejemplos a los campos | Explicar qué dato se espera en cada formulario del alcance. |
| Mostrar errores junto al campo correspondiente | Indicar la causa del error y cómo corregirlo. |
| Revisar los formularios del sprint | Probar campos vacíos, formatos incorrectos y corrección posterior. |

### HU-011 - Poder crear, modificar o inactivar registros de referidos

Historia padre: [G2-31](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-31). Sprint 2.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Acordar el alcance de acceso a referidos | Resolver con el PO la diferencia entre el criterio de Jira sin restricción de rol y los permisos y propiedad de las specs antes de modificar accesos. |
| Preparar el alta y edición de referidos | Capturar los datos y conectar las operaciones con el servidor según el alcance acordado. |
| Validar los datos y evitar duplicados | Comprobar formatos, consentimiento y existencia de un referido activo. |
| Aplicar la baja lógica de referidos | Solicitar el motivo y conservar los datos e historial exigidos por las specs. |
| Probar la gestión y sus permisos | Verificar altas, cambios, bajas y acceso a registros de otras personas según la decisión aprobada. |

### HU-012 - Poder administrar el listado completo de todos los referidos

Historia padre: [G2-32](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-32). Sprint 2.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Acordar quién puede consultar el listado global | Conciliar la frase sin restricción de rol de Jira con la vista administrativa de las specs. |
| Preparar la tabla y su paginación | Listar los referidos con la información permitida y el tamaño de página definido. |
| Aplicar los filtros del listado | Filtrar por búsqueda, estado, fechas, provincia y campaña cuando existan datos. |
| Probar filtros y restricciones del listado | Comprobar resultados, totales y protección de datos según el alcance acordado. |

### HU-013 - Poder registrarme en 3 pasos

Historia padre: [G2-33](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-33). Sprint 2.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Preparar el registro en tres pasos | Organizar datos, cuenta y acceso; conservar la información al retroceder. |
| Validar los datos personales y duplicados | No pedir cédula; validar nombre, correo, celular 09 de diez dígitos y provincia según las specs. |
| Integrar la cuenta y el código de referido opcionales | Permitir avanzar sin esos datos y validar los proporcionados, reutilizando los flujos de HU-015 y HU-019. |
| Validar la contraseña y la aceptación de términos | Exigir al menos ocho caracteres, mayúscula, número, confirmación y aceptación de la versión vigente. |
| Probar el alta y medir su duración | Comprobar creación de la cuenta sin confirmar y el registro completo en menos de tres minutos. |

### HU-014 - Poder confirmar mi correo con un código

Historia padre: [G2-34](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-34). Sprint 2.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Generar y enviar el código de confirmación | Emitir seis dígitos, enviarlos al correo registrado y fijar diez minutos de vigencia. |
| Preparar la pantalla para confirmar el correo | Validar el código, activar la cuenta e impedir acceso mientras siga sin confirmar. |
| Controlar los reenvíos del código | Permitir como máximo tres reenvíos por hora e invalidar el código anterior según las specs. |
| Probar la confirmación y la entrega del correo | Medir recepción en máximo 60 segundos y probar códigos usados, incorrectos y vencidos. |

### HU-015 - Poder vincular mi cuenta de ahorros o corriente

Historia padre: [G2-35](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-35). Sprint 2.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Preparar la vinculación en registro y cuenta personal | Permitir elegir Ahorros o Corriente e introducir diez dígitos. |
| Validar y guardar la cuenta vinculada | Impedir vincular una cuenta de otra persona, guardarla Pendiente y mostrar solo los cuatro últimos dígitos. |
| Aplicar las restricciones por cuenta no aprobada | Bloquear referidos y mostrar Vincular mi cuenta; documentar la misma condición para el canje cuando se integre su historia, sin afirmar que el canje ya existe. |
| Probar vinculación y acceso a las demás funciones | Comprobar cuenta duplicada, máscara y estado; verificar que la vinculación no bloquee otras funciones disponibles. |

### HU-016 - Poder verificar las cuentas vinculadas

Historia padre: [G2-36](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-36). Sprint 2.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Preparar la cola de cuentas pendientes | Ordenar de la más antigua a la reciente y mostrar veinte por página. |
| Identificar solicitudes atrasadas | Resaltar las que superen dos días hábiles con el calendario definido en las specs. |
| Guardar la aprobación o rechazo | Validar la solicitud, registrar la decisión y rechazar una segunda resolución de una ya atendida. |
| Notificar el resultado al titular | Mostrarlo en su bandeja y actualizar el contador de avisos no leídos. |
| Probar la revisión y medir sus tiempos | Comprobar decisión en máximo dos segundos, aviso en cinco y registro en bitácora. |

## Sprint 3

### HU-017 - Poder obtener mi enlace y código QR de referido

Historia padre: [G2-37](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-37). Sprint 3.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Generar el código único del socio | Asignar ocho caracteres al aprobar la cuenta vinculada y evitar duplicados. |
| Construir el enlace y el QR descargable | Generar el enlace de registro y un PNG de al menos 256 por 256 píxeles. |
| Condicionar la invitación a la cuenta aprobada | Mostrar Vincular mi cuenta cuando el usuario aún no cumpla la condición. |
| Probar generación, descarga y lectura del QR | Medir el máximo de tres segundos y comprobar el destino escaneando desde dispositivos. |

### HU-018 - Poder compartir mi enlace por WhatsApp o redes sociales

Historia padre: [G2-38](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-38). Sprint 3.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Preparar la copia del enlace | Copiar la URL correcta con una acción e informar el resultado. |
| Preparar el envío a WhatsApp y Facebook | Abrir la opción elegida con el enlace y un mensaje de máximo 300 caracteres. |
| Integrar el menú de compartir del dispositivo | Usarlo cuando esté disponible y ofrecer las alternativas previstas. |
| Medir y probar la acción de compartir | Comprobar los destinos y que el usuario comparta en menos de quince segundos desde que abre la plataforma. |

### HU-019 - Que mi código se llene automáticamente cuando alguien se registra con mi enlace

Historia padre: [G2-39](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-39). Sprint 3.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Leer el código desde el enlace o QR | Conservarlo y rellenar el campo del paso tres del registro. |
| Validar los códigos ingresados | Aceptar códigos válidos y rechazar inválidos; resolver y probar el escenario de código propio indicado en Jira. |
| Crear la relación de referido pendiente | Asociar la nueva cuenta al socio e impedir duplicar un referido cargado previamente. |
| Probar el registro con invitación | Verificar enlace, QR y escritura manual, y medir el máximo de tres segundos del alta asociada. |

### HU-020 - Poder ver el estado de mis referidos

Historia padre: [G2-40](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-40). Sprint 3.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Preparar el listado personal de referidos | Mostrar diez por página con nombre de pila, fecha y estado. |
| Consultar el estado actualizado | Mostrar Pendiente, Aprobado o Rechazado sin exponer datos adicionales. |
| Avisar los cambios de estado | Añadir el aviso para el socio y actualizar su bandeja. |
| Probar la privacidad y el tiempo del aviso | Comprobar acceso solo a sus referidos y notificación en máximo cinco segundos. |

### HU-021 - Poder aprobar o rechazar a los referidos

Historia padre: [G2-41](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-41). Sprint 3.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Preparar la decisión sobre un referido | Mostrar a administración las opciones de aprobación y rechazo. |
| Validar la cuenta vinculada y el estado previo | Permitir aprobar solo con cuenta aprobada e impedir dictámenes repetidos. |
| Guardar el dictamen y acreditar ambas partes | Registrar la decisión, los puntos del socio y del referido y la bitácora de forma consistente. |
| Probar permisos, concurrencia y tiempos | Comprobar que no existan dobles créditos y medir decisión y acreditación en máximo dos segundos. |

### HU-022 - Poder recibir puntos automáticamente por mis actividades

Historia padre: [G2-42](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-42). Sprint 3.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Identificar las actividades que otorgan puntos | Relacionar cada actividad del alcance con su parámetro; dejar explícitas las integraciones de sprints posteriores. |
| Acreditar puntos sin duplicar eventos | Guardar la cantidad exacta una sola vez por actividad confirmada. |
| Notificar los puntos ganados | Informar al usuario la cantidad acreditada. |
| Probar la acreditación y sus tiempos | Verificar cantidad exacta, repetición del evento, acreditación en dos segundos y notificación en cinco. |

### HU-023 - Poder actualizar mis datos o dar de baja mi cuenta

Historia padre: [G2-43](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-43). Sprint 3.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Acordar la reutilización del perfil de HU-055 | Definir qué trabajo existente cubre esta historia y evitar duplicar su implementación o contabilizarla dos veces. |
| Mostrar y actualizar los datos del perfil | Presentar los cuatro datos acordados y validar cambios de nombre, correo y celular. |
| Confirmar el correo nuevo antes de sustituirlo | Enviar y validar el código en el correo nuevo reutilizando RF-02. |
| Aplicar la baja conservando el historial | Desactivar la cuenta, cerrar sus sesiones y conservar datos e historial requeridos. |
| Probar los cambios de perfil y su duración | Verificar correo duplicado, código, baja e historial; medir la actualización en menos de dos minutos. |

### HU-024 - Poder descargar la lista de referidos pendientes

Historia padre: [G2-44](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-44). Sprint 3.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Especificar el alcance de la exportación comercial | Documentar qué registros y columnas forman el CSV y su límite de diez segundos, reutilizando el endpoint existente. |
| Consultar únicamente referidos pendientes | Excluir registros aprobados, rechazados y dados de baja, según el filtro definido. |
| Generar y descargar el CSV | Incluir nombre, correo, celular, socio referidor y fecha de registro desde la acción del administrador. |
| Probar el archivo, sus permisos y tiempo | Comprobar columnas, caracteres especiales y contenido, y medir la descarga en máximo diez segundos. |

### HU-025 - Poder crear y configurar campañas de referidos

Historia padre: [G2-45](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-45). Sprint 3.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Especificar la campaña antes de implementarla | Preparar spec, plan y tareas con fechas, provincias, puntos y regla de solapamiento para revisión. |
| Preparar el formulario y guardar campañas | Capturar título, fechas, provincias y puntos para socio y referido. |
| Validar los límites de la campaña | Título de hasta cien caracteres, fin posterior al inicio, entre una y ocho provincias y puntos entre uno y diez mil. |
| Evitar campañas activas superpuestas | Aplicar la regla de solapamiento acordada en la spec y comprobar sus casos límite. |
| Probar la creación de campañas | Verificar datos válidos e inválidos y medir su creación por el administrador en menos de quince minutos. |

### HU-026 - Poder activar, pausar o finalizar una campaña

Historia padre: [G2-46](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-46). Sprint 3.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Especificar los cambios de estado permitidos | Definir Borrador, Activa, Pausada y Finalizada, con transiciones válidas y restricciones. |
| Implementar los controles de estado | Permitir los cambios autorizados e impedir modificar una campaña finalizada. |
| Aplicar la pausa a la acreditación de puntos | Evitar acreditar por la campaña pausada según la regla aprobada. |
| Avisar la activación por provincia | Notificar a los usuarios de las provincias de la campaña por el canal definido en la spec. |
| Probar transiciones y tiempos | Comprobar pausa y finalización, cambio en máximo dos segundos y aviso de activación en sesenta. |

### HU-027 - Poder ver las campañas vigentes y sus premios

Historia padre: [G2-47](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-47). Sprint 3.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Especificar la consulta de campañas vigentes | Definir actividad, vigencia y provincia del socio, reutilizando las reglas de HU-025 y HU-026. |
| Consultar las campañas aplicables al usuario | Devolver únicamente las activas y vigentes para su provincia. |
| Mostrar premios y fecha de fin | Presentar puntos para el socio y el referido junto a la fecha de cierre. |
| Probar la visibilidad de las campañas | Comprobar provincia distinta, campaña pausada o finalizada y ausencia de campañas. |

### HU-028 - Poder consultar mi saldo y mi historial de puntos

Historia padre: [G2-48](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-48). Sprint 3.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Especificar saldos y movimientos | Definir saldo disponible, acumulado y tratamiento de movimientos antes de construir la consulta. |
| Calcular y consultar los dos saldos | Obtenerlos desde movimientos reales sin confundir disponible con acumulado. |
| Preparar el historial paginado | Mostrar veinte movimientos por página del más reciente al antiguo. |
| Probar saldos, orden y privacidad | Conciliar totales y movimientos, probar cambios de página e impedir ver puntos ajenos. |

### HU-029 - Poder configurar los puntos por acción y el valor del punto

Historia padre: [G2-49](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-49). Sprint 3.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Formalizar las reglas existentes en las specs | Documentar la reutilización de parámetros ya implementados y vincularla con esta historia. |
| Preparar los valores por acción y el valor del punto | Mostrar los parámetros y permitir su modificación desde administración. |
| Validar y aplicar las reglas de puntos | Aceptar enteros entre cero y diez mil por acción y guardar el valor monetario con dos decimales. |
| Probar y auditar cada cambio | Comprobar persistencia, aplicación de nuevos valores y registro del valor anterior y nuevo. |

## Anexo · HU-055 a HU-057 presentes en las specs de Sprint 2

Estas propuestas no autorizan moverlas de sprint ni duplicar el trabajo de perfil.

### HU-055 - Poder administrar mi perfil

Historia padre: [G2-75](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-75). Asignación de sprint pendiente de conciliación.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Conciliar esta historia con HU-023 | Delimitar el trabajo compartido y el sprint antes de crear subtareas repetidas. |
| Preparar la edición y validación del perfil | Permitir los cambios de datos previstos en la spec y validar duplicados. |
| Aplicar la confirmación del nuevo correo y la baja | Reutilizar el código de confirmación y conservar el historial al desactivar la cuenta. |
| Verificar el perfil y su trazabilidad | Probar edición, confirmación y baja; reutilizar la evidencia que también cubre HU-023. |

### HU-056 - Poder elegir qué datos son públicos

Historia padre: [G2-76](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-76). Asignación de sprint pendiente de conciliación.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Conciliar los campos públicos con la política de privacidad | Resolver la diferencia entre Jira, que permite ocultar correo/teléfono, y las specs, que impiden mostrarlos a terceros. |
| Preparar las opciones de privacidad acordadas | Presentar controles y guardar únicamente configuraciones admitidas. |
| Aplicar la privacidad en la consulta del servidor | Devolver solo los campos permitidos según la decisión aprobada y la relación entre usuarios. |
| Probar perfiles públicos y privados | Comprobar que datos protegidos no aparezcan en pantalla ni en respuestas del servidor. |

### HU-057 - Poder gestionar los acuerdos de privacidad

Historia padre: [G2-77](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-77). Asignación de sprint pendiente de conciliación.

| Resumen de la subtarea | Descripción y resultado esperado |
| --- | --- |
| Preparar la edición de términos y aviso de privacidad | Permitir que administración consulte y redacte los textos de los acuerdos. |
| Publicar una versión vigente de los acuerdos | Validar el contenido y mantener una única versión vigente según las specs. |
| Registrar qué versión acepta cada usuario | Vincular el consentimiento del registro con la versión y fecha de aceptación. |
| Probar publicación, aceptación y bitácora | Verificar rechazo de versiones inválidas y registros con términos desactualizados, y auditar la publicación. |

## Decisiones antes de una eventual carga

1. Confirmar si se cargan solo las 29 historias asignadas o también las tres del anexo, con su sprint acordado.
2. Conciliar permisos en HU-011/HU-012 y privacidad en HU-056 antes de convertir textos contradictorios en implementación.
3. Delimitar HU-023/HU-055 para reutilizar trabajo y evidencia sin contabilizar dos veces.
4. En HU-015, la condición para canjear se integra con la historia de canje posterior; en HU-022, los disparadores de módulos futuros se integran en sus propios sprints.
5. Acordar responsables, estimaciones y estado con el equipo. No asignarlos automáticamente porque la historia figure Listo.
6. Obtener autorización del usuario para crear en Jira. Este documento por sí solo no la concede.
