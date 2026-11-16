# Casos de uso faltantes · Sprints 1 y 2

Propuesta para completar el modelo `SUMA-Diagramas_Vistas.eapx` (paquete *Vista de Escenarios › Casos de uso*), de modo
que cada requisito de usuario (UR) e historia (HU) de los Sprints 1 y 2 tenga un caso de uso y una evidencia en el código.

- **Numeración:** se conservan CU-01 a CU-15. Los casos nuevos de primer nivel continúan en **CU-16**. Los sub-casos
  nuevos continúan la numeración de su caso base (por ejemplo, CU-02.4).
- **Fuentes:** hoja `UserReq.` y `Req. Funcionales` de *DocumentacionResumenRequisitos*, hoja `BKL-G1` del *Backlog del
  producto* y el código de la rama `sprint-2`.
- **Convención UML:** `«include»` para un paso que siempre ocurre; `«extend»` para un paso opcional o condicionado
  (se indica la condición); asociación directa solo entre un actor y un caso de primer nivel.

## Resumen

| CU | Nombre | Actor | Tipo | UR | HU |
| -- | ------ | ----- | ---- | -- | -- |
| CU-01.4 | Validar que el correo y el celular no estén registrados | — | «include» de CU-01 | UR-14 | HU-013 |
| CU-02.4 | Cargar el menú y los permisos del rol | — | «include» de CU-02 | UR-04 | HU-002 |
| CU-02.5 | Restablecer la contraseña | Socio / Cliente, Gestor, Administrador | Caso propio (sigue a CU-02.3) | UR-05 | HU-004 |
| CU-02.6 | Cerrar sesión | Socio / Cliente, Gestor, Administrador | Caso propio | UR-03 | HU-003 |
| CU-05.3 | Compartir el enlace por WhatsApp o redes sociales | Socio / Cliente · *Redes sociales* | «extend» de CU-05 | UR-12 | HU-018 |
| CU-05.4 | Comprobar que la cuenta vinculada esté aprobada | — | «include» de CU-05 | UR-09 | HU-015, HU-017 |
| CU-06.4 | Acreditar los puntos al socio y al referido | — | «extend» de CU-06.2 `[dictamen = Aprobado]` | UR-19, UR-24 | HU-021, HU-022 |
| CU-06.5 | Gestionar los datos de un referido | Socio / Cliente, Administrador | «extend» de CU-06 | UR-13 ⚠ | HU-011 |
| CU-06.6 | Asociar manualmente un referido | Administrador | «extend» de CU-06 | UR-13 | HU-011, HU-012 |
| **CU-16** | Gestionar roles y permisos | Administrador | Caso de primer nivel | UR-04 | HU-001, HU-002 |
| **CU-17** | Gestionar usuarios de la plataforma | Administrador | Caso de primer nivel | UR-04 | HU-001 |
| **CU-18** | Verificar una cuenta vinculada | Administrador | Caso de primer nivel | UR-08 | HU-016 |
| **CU-19** | Configurar los parámetros de la plataforma | Administrador | Caso de primer nivel | UR-46 | HU-006 |
| **CU-20** | Consultar la bitácora de auditoría | Administrador | Caso de primer nivel | UR-48 | HU-007 |

**HU-005 (panel de administración)** no necesita un caso nuevo: se asocia a **CU-15 Consultar indicadores de captación**,
que ya modela el tablero. En el backlog conviene vincular HU-005 con **UR-49**, porque hoy no tiene requisito de usuario.

**Diagramas en el EAPX:**
- Nuevo diagrama general **04 Administración de la plataforma** con CU-16, CU-17, CU-19 y CU-20.
- **CU-18** se agrega al diagrama **01 Acceso, cuenta y referidos**, junto a CU-04.
- Un diagrama de detalle por cada caso nuevo de primer nivel (`CU-16 Detalle · …`), como los existentes.
- Los sub-casos nuevos se agregan a los diagramas de detalle de su caso base.
- El actor **Redes sociales** del diagrama de contexto se agrega como actor secundario en `CU-05 Detalle`.

---

## Casos de uso nuevos de primer nivel

### CU-16 Gestionar roles y permisos

| Campo | Contenido |
| ----- | --------- |
| Actor principal | Administrador |
| Requisitos | **UR-04** · HU-001, HU-002 · RF-08, RF-08-1, RF-08-3, RF-08-4, RF-08-5, RF-42 · RNF-13 |
| Precondición | El administrador inició sesión con segundo factor (CU-02, CU-02.2) y su rol tiene el módulo *Roles*. |
| Postcondición | Los permisos del rol quedan guardados, se aplican en la siguiente petición de cada usuario de ese rol y se registran en la bitácora. |

**Flujo básico**
1. El administrador abre *Roles y permisos*.
2. El sistema lista los roles con sus módulos permitidos y el número de usuarios de cada uno.
3. El administrador elige un rol y marca o desmarca módulos.
4. El sistema valida que el rol conserve sus módulos obligatorios.
5. El sistema guarda los permisos y registra en la bitácora el rol, los módulos anteriores y los nuevos.
6. El sistema confirma el cambio.

**Flujos alternos**
- **A1 · Crear rol:** el administrador ingresa clave, nombre, descripción, experiencia (Panel o Comunidad) y si exige
  segundo factor. El sistema rechaza una clave repetida.
- **A2 · Eliminar rol:** el sistema impide eliminar un rol del sistema o un rol que tenga usuarios asignados.
- **A3 · Acceso denegado (RF-08-4):** si quien entra no tiene el módulo o no es administrador, el sistema responde
  «No tienes permiso» y no muestra la opción.

**Sub-casos:** ninguno nuevo. El efecto en el menú se modela en **CU-02.4**.

**Evidencia en el código:** `GET/POST /api/roles`, `PUT/DELETE /api/roles/:rol` ([api.mjs:1208-1314](../backend/src/api.mjs#L1208)) ·
`roles.page.ts` · prueba «HU-001: roles y permisos se crean, editan y eliminan sin tocar el código» y «RF-08: permisos
por rol se aplican de inmediato».

> **Decisión abierta:** RF-08-1 dice «1 de 3 roles», pero HU-001 y el código permiten crear roles. Hay que corregir uno
> de los dos documentos.

### CU-17 Gestionar usuarios de la plataforma

| Campo | Contenido |
| ----- | --------- |
| Actor principal | Administrador |
| Requisitos | **UR-04** · HU-001 · RF-08, RF-08-2, RF-08-5, RF-04-4, RF-42 |
| Precondición | El administrador inició sesión y su rol tiene el módulo *Usuarios*. |
| Postcondición | El usuario queda con el rol y el estado elegidos, sus sesiones abiertas se cierran y el cambio queda en la bitácora. |

**Flujo básico**
1. El administrador abre *Usuarios*.
2. El sistema lista los usuarios, 20 por página, con buscador por nombre o correo.
3. El administrador elige un usuario y cambia su rol o lo activa o desactiva.
4. El sistema guarda el cambio, cierra las sesiones del usuario y registra en la bitácora el autor, el usuario y el rol
   nuevo (RF-08-5).
5. El sistema confirma el cambio.

**Flujos alternos**
- **A1 · Crear cuenta de Gestor o Administrador (RF-08-2):** el administrador ingresa nombre, correo y rol. El sistema
  crea la cuenta y envía al correo un enlace de activación de 24 horas para que la persona defina su contraseña.
- **A2 · Quitarse su propio acceso:** el sistema impide que el administrador se quite el rol o se desactive.
- **A3 · Último administrador:** el sistema impide dejar la plataforma sin ningún administrador activo.

**Evidencia en el código:** `GET/POST /api/usuarios`, `PATCH /api/usuarios/:id` ([api.mjs:1057-1193](../backend/src/api.mjs#L1057)) ·
`usuarios.page.ts` · pruebas «RF-08-2: solo el administrador crea cuentas de Gestor o Administrador» y «RF-04-4».

### CU-18 Verificar una cuenta vinculada

| Campo | Contenido |
| ----- | --------- |
| Actor principal | Administrador |
| Requisitos | **UR-08**, UR-14, UR-44 · HU-016 · RF-05-3, RF-05-4, RF-05-2, RF-09, RF-39, RF-42 · RNF-24 |
| Precondición | Existe al menos una solicitud de vinculación en estado Pendiente (resultado de CU-04). |
| Postcondición | La vinculación queda Aprobada o Rechazada, el usuario recibe un aviso y la decisión queda en la bitácora. Si se aprobó, el usuario tiene su código de referido. |

**Flujo básico**
1. El administrador abre *Cuentas pendientes*.
2. El sistema lista las vinculaciones Pendientes de la más antigua a la más reciente, 20 por página, con el número
   enmascarado y resaltando las que superan 2 días hábiles.
3. El administrador comprueba con la Cooperativa que la cuenta pertenece al titular.
4. El administrador elige **Aprobar**.
5. El sistema verifica que el número no esté aprobado en otra cuenta.
6. El sistema cambia el estado a Aprobado e incluye **CU-18.1**.
7. El sistema registra la decisión en la bitácora y notifica al usuario (RF-39).

**Flujos alternos**
- **A1 · Rechazar:** el administrador elige **Rechazar** y escribe el motivo, que es obligatorio. El sistema cambia el
  estado a Rechazado y notifica el motivo. El usuario puede presentar otra cuenta (RF-05-6, en CU-04).
- **A2 · Número ya aprobado en otra cuenta:** el sistema impide la aprobación.
- **A3 · Sin pendientes:** el sistema muestra «Actualmente no hay cuentas pendientes».

**Sub-casos**
- **CU-18.1 Generar el código y el enlace de referido** · «include» de CU-18 *(solo en la aprobación)*. RF-09, RF-09-1.
  Genera un código único de 8 caracteres en mayúsculas.

**Evidencia en el código:** `GET /api/usuarios/cuentas-pendientes`, `PATCH /api/usuarios/:id/cuenta`
([api.mjs:1072-1126](../backend/src/api.mjs#L1072)) · `generarCodigo()` ([api.mjs:835](../backend/src/api.mjs#L835)) ·
`usuarios.page.html` (marca de días hábiles) · prueba «HU-015 / HU-016 / RF-06».

> Como CU-18.1 ocurre solo al aprobar, en rigor es un «extend» con condición `[estado = Aprobado]`. Si el equipo prefiere
> no tener extensiones del sistema, puede quedar como paso 6 del flujo básico sin sub-caso.

### CU-19 Configurar los parámetros de la plataforma

| Campo | Contenido |
| ----- | --------- |
| Actor principal | Administrador |
| Requisitos | **UR-46** · HU-006 (y HU-029, Sprint 3) · RF-14, RF-14-1, RF-14-2, RF-14-3, RF-14-4, RF-42 |
| Precondición | El administrador inició sesión y su rol tiene el módulo *Configuración*. |
| Postcondición | Los parámetros quedan aplicados y cada cambio queda en la bitácora con el valor anterior y el nuevo. |

**Flujo básico**
1. El administrador abre *Configuración*.
2. El sistema muestra los parámetros vigentes: correo de contacto, registro abierto o cerrado, mensaje de bienvenida y
   puntos por referido.
3. El administrador cambia uno o más valores y guarda.
4. El sistema valida cada valor según su tipo: números enteros y textos de máximo 500 caracteres (RF-14-1).
5. El sistema guarda solo los valores que cambiaron y registra en la bitácora parámetro, valor anterior y valor nuevo
   (RF-14-2).
6. El sistema confirma el cambio.

**Flujos alternos**
- **A1 · Valor inválido:** el sistema marca el campo y explica la corrección. No guarda nada.

**Sub-casos**
- **CU-19.1 Definir los puntos por acción y el valor del punto** · «extend» de CU-19. RF-14-3, RF-14-4 · HU-029
  (Sprint 3, ya programado). Cada acción vale un entero entre 0 y 10 000; el valor del punto en dólares tiene 2 decimales.

**Evidencia en el código:** `GET/PUT /api/configuracion` ([api.mjs:1317-1358](../backend/src/api.mjs#L1317)) ·
`ParametroGlobal` en `dominio/administracion.mjs` · `configuracion.page.ts` · prueba «RF-14 / RF-14-2 / RF-42».

### CU-20 Consultar la bitácora de auditoría

| Campo | Contenido |
| ----- | --------- |
| Actor principal | Administrador |
| Requisitos | **UR-48** · HU-007 · RF-42, RF-42-1, RF-42-2 · RNF-13 |
| Precondición | El administrador inició sesión y su rol tiene el módulo *Actividad*. |
| Postcondición | El administrador ve quién hizo cada acción crítica, cuándo y desde qué IP. La bitácora no cambia. |

**Flujo básico**
1. El administrador abre *Actividad*.
2. El sistema muestra los registros del más reciente al más antiguo, 50 por página, con usuario, acción, IP y fecha
   (RF-42-1).
3. El administrador revisa el detalle de un registro (valores anterior y nuevo, cuando existen).

**Flujos alternos**
- **A1 · Sin resultados:** el sistema avisa que no hay registros para los filtros elegidos.

**Sub-casos**
- **CU-20.1 Filtrar la bitácora** · «extend» de CU-20. RF-42-2. Filtra por rango de fechas, usuario y tipo de acción.
  El sistema rechaza un rango con la fecha inicial posterior a la final.

**Evidencia en el código:** `GET /api/actividad`, `GET /api/actividad/opciones` ([api.mjs:1361-1402](../backend/src/api.mjs#L1361)) ·
`actividad.page.ts` · prueba «RF-14 / RF-14-2 / RF-42».

> **Pendiente:** la conservación de 5 años (RNF-13) depende de la política de respaldos, que aún no existe (auditoría G24).

---

## Sub-casos nuevos de casos existentes

### CU-01.4 Validar que el correo y el celular no estén registrados

| Campo | Contenido |
| ----- | --------- |
| Relación | «include» de CU-01 |
| Requisitos | **UR-14** · HU-013 · RF-01-2 |
| Descripción | Antes de crear la cuenta, el sistema comprueba que el correo y el celular no pertenezcan a otra cuenta. Si alguno existe, rechaza el registro y marca el campo. |
| Evidencia | Unicidad del celular ([api.mjs:541-546](../backend/src/api.mjs#L541)) y del correo por índice único ([api.mjs:1447](../backend/src/api.mjs#L1447)) · prueba «HU-013 / HU-014». |

### CU-02.4 Cargar el menú y los permisos del rol

| Campo | Contenido |
| ----- | --------- |
| Relación | «include» de CU-02 (después de CU-02.1 y, si aplica, CU-02.2) |
| Requisitos | **UR-04** · HU-002, HU-008 · RF-08-3, RF-08-4, RF-49-4 |
| Descripción | Al abrir la sesión, el sistema carga los módulos permitidos del rol y arma el menú solo con ellos. En pantallas de menos de 768 px lo muestra como menú desplegable. Toda petición a un módulo no permitido se rechaza en el servidor. |
| Evidencia | `perfil()` y `current()` ([api.mjs:242-271](../backend/src/api.mjs#L242)) · `shell.component.html`, `comunidad-shell.component.html` · prueba «RF-08-1 / RF-08-4». |

### CU-02.5 Restablecer la contraseña

| Campo | Contenido |
| ----- | --------- |
| Relación | Asociado a Socio / Cliente, Gestor de contenidos y Administrador. Se inicia desde el enlace que envía CU-02.3. |
| Requisitos | **UR-05** · HU-004 · RF-07, RF-07-1, RF-07-2 · RNF-04, RNF-22 |
| Precondición | La persona tiene un enlace de recuperación vigente (30 minutos) y no usado. |
| Flujo básico | 1. La persona abre el enlace. 2. Escribe la nueva contraseña (mínimo 8 caracteres, 1 mayúscula y 1 número) y su confirmación. 3. El sistema guarda la contraseña, invalida el enlace, cierra todas las sesiones abiertas y registra el cambio en la bitácora. |
| Alterno | El enlace venció o ya se usó: el sistema pide solicitar uno nuevo. |
| Evidencia | `POST /api/auth/reset` ([api.mjs:637](../backend/src/api.mjs#L637)) · `recuperar.page.ts` · prueba «RF-07: recuperación de un solo uso que revoca sesiones». |

> Alternativa de modelado: renombrar CU-02.3 a «Recuperar el acceso» con dos «include»: «Solicitar el enlace» y
> «Restablecer la contraseña». Cualquiera de las dos opciones cubre UR-05.

### CU-02.6 Cerrar sesión

| Campo | Contenido |
| ----- | --------- |
| Relación | Asociado a Socio / Cliente, Gestor de contenidos y Administrador |
| Requisitos | **UR-03** · HU-003 · RF-04-3, RF-04-4 |
| Flujo básico | 1. La persona elige «Cerrar sesión». 2. El sistema invalida la sesión en máximo 2 segundos, registra el cierre en la bitácora y vuelve a la pantalla de acceso. |
| Alterno | **Cierre por inactividad (RF-04-3):** si no hay acciones durante 15 minutos, el sistema invalida la sesión y avisa al volver. |
| Evidencia | `POST /api/auth/logout` ([api.mjs:428](../backend/src/api.mjs#L428)) · `inactividad.service.ts` · pruebas «RF-04-3» y «RF-04-4». |

### CU-05.3 Compartir el enlace por WhatsApp o redes sociales

| Campo | Contenido |
| ----- | --------- |
| Relación | «extend» de CU-05 `[el socio elige un canal]` · actor secundario **Redes sociales** |
| Requisitos | **UR-12** · HU-018 · RF-10, RF-10-1, RF-10-2, RF-10-3 · RNF-17, RNF-21 |
| Flujo básico | 1. El socio elige Copiar, WhatsApp, Facebook o Compartir. 2. El sistema arma el mensaje predefinido de máximo 300 caracteres con el enlace oficial. 3. El sistema copia el enlace o abre el canal elegido. |
| Alterno | El dispositivo no tiene menú nativo de compartir: el sistema copia el enlace y lo avisa. |
| Evidencia | `invitacion.component.ts` (WhatsApp, Facebook, `navigator.share`, portapapeles, recorte a 300 caracteres) · `e2e/smoke.cjs`. |
| Pendiente | Medir los 15 segundos y 3 toques con usuarios (RNF-21). |

### CU-05.4 Comprobar que la cuenta vinculada esté aprobada

| Campo | Contenido |
| ----- | --------- |
| Relación | «include» de CU-05. Se reutilizará como «include» de **CU-12 Canjear puntos por un premio** (Sprint 5). |
| Requisitos | **UR-09** · HU-015, HU-017 · RF-06, RF-06-1, RF-06-2, RF-06-3 |
| Descripción | Antes de mostrar el enlace o registrar un referido, el sistema comprueba que la cuenta vinculada esté Aprobada. Si no lo está, bloquea la acción y muestra el aviso con el acceso a «Vincular mi cuenta». Capacitaciones, talleres, juegos, retos y comunidad siguen abiertos. |
| Evidencia | `POST /api/referidos/mi-codigo` ([api.mjs:849](../backend/src/api.mjs#L849)) y `POST /api/referidos` ([api.mjs:866](../backend/src/api.mjs#L866)) · aviso en `referidos.page.html` y `feed.page.html` · prueba «HU-015 / HU-016 / RF-06». |

### CU-06.4 Acreditar los puntos al socio y al referido

| Campo | Contenido |
| ----- | --------- |
| Relación | «extend» de CU-06.2 `[dictamen = Aprobado]` |
| Requisitos | **UR-19**, **UR-24** · HU-021, HU-022 · RF-12, RF-12-1, RF-12-2, RF-38-1 · RNF-20 |
| Descripción | En la misma transacción del dictamen, el sistema acredita los puntos configurados al socio que refirió y a la persona referida, una sola vez por evento y destinatario, y notifica a cada uno el valor exacto ganado. |
| Evidencia | `acreditacion.registrar('REFERIDO', …)` ([api.mjs:948](../backend/src/api.mjs#L948)) · `AcreditacionPuntos` y `MovimientoPuntos` en `dominio/administracion.mjs` · pruebas «HU-022» y «RF-11: vinculación…». |
| Pendiente | RF-12-2 pide los puntos de la campaña activa. Hasta el Sprint 3 se usa el parámetro `puntosReferido` para ambas partes. |

### CU-06.5 Gestionar los datos de un referido

| Campo | Contenido |
| ----- | --------- |
| Relación | «extend» de CU-06 `[el actor elige registrar, editar o dar de baja]` · Socio / Cliente y Administrador |
| Requisitos | HU-011 · RF-11, RF-11-6 · RNF-12 · UR: ⚠ ver nota |
| Flujo básico | 1. El actor elige **Registrar referido**. 2. Ingresa nombres, correo, celular y confirma que la persona lo autorizó. 3. El sistema valida los datos, guarda el referido en estado Pendiente, registra la acción y notifica al socio. |
| Alternos | **A1 · Editar:** el socio solo edita sus referidos Pendientes y no vinculados a una cuenta. **A2 · Dar de baja:** con un motivo de al menos 5 caracteres, baja lógica que conserva el historial (RF-11-6). El socio solo da de baja sus Pendientes. **A3 · Sin cuenta aprobada:** el socio no puede registrar (CU-05.4). |
| Evidencia | `POST /api/referidos`, `PATCH /api/referidos/:id`, `PATCH /api/referidos/:id/baja` ([api.mjs:863-986](../backend/src/api.mjs#L863)) · `referidos.page.html` · pruebas «RF-11 / RNF-12» y «RF-11-6». |

> **Nota de trazabilidad:** ningún UR pide que el socio registre a mano los datos de otra persona. UR-11 pide justamente
> lo contrario («sin dictarle ningún dato»). Hay dos opciones: (a) agregar un UR nuevo, por ejemplo «UR-54 Registrar
> referidos a mano», o (b) dejar este registro solo para el administrador y vincularlo a UR-16. Además, el texto de
> HU-011 («independientemente del rol») y el actor «Usuario General» no coinciden con el código ni con UR-04. Conviene
> reescribir HU-011 como «Como Socio / Cliente o Administrador…».

### CU-06.6 Asociar manualmente un referido

| Campo | Contenido |
| ----- | --------- |
| Relación | «extend» de CU-06 · Administrador |
| Requisitos | **UR-13** · HU-011, HU-012 · RF-11-5 |
| Flujo básico | 1. El administrador elige **Asociar referido**. 2. El sistema lista los usuarios registrados sin código en los últimos 30 días y los socios con cuenta aprobada. 3. El administrador elige el usuario y el socio referidor. 4. El sistema crea el referido Pendiente, registra la acción y notifica al socio. |
| Alternos | Pasaron más de 30 días desde el registro; el socio no tiene cuenta aprobada; el usuario ya tiene un referido: el sistema impide la asociación. |
| Evidencia | `GET /api/referidos/asociables`, `POST /api/referidos/asociar` ([api.mjs:989-1054](../backend/src/api.mjs#L989)) · prueba «RF-11-5». |

---

## Relaciones que hay que corregir en los casos existentes

Hoy estos sub-casos están unidos directamente al actor. Deben colgar de su caso base.

| Sub-caso | Relación actual | Relación propuesta |
| -------- | --------------- | ------------------ |
| CU-01.2 Confirmar el correo con un código | Asociación con Prospecto y Socio | «include» de CU-01 |
| CU-01.3 Vincular el registro a un referido | Asociación con Prospecto | «extend» de CU-01 `[llega con un código o lo escribe]` |
| CU-03.1 Actualizar datos del perfil | Asociación con Socio | «extend» de CU-03 |
| CU-03.2 Cambiar la privacidad del perfil | Asociación con Socio | «extend» de CU-03 |
| CU-05.1 Obtener el enlace de referido | Asociación con Socio | «include» de CU-05 |
| CU-06.1 Filtrar el listado de referidos | Asociación con Administrador | «extend» de CU-06 |
| CU-06.2 Aprobar o rechazar un referido | Asociación con Administrador | «extend» de CU-06 |
| CU-06.3 Exportar referidos pendientes | Asociación con Administrador | «extend» de CU-06 |
| CU-07.1 Definir la cobertura y la vigencia | Asociación con Administrador | «include» de CU-07 |
| CU-07.2 Definir los puntos para ambas partes | Asociación con Administrador | «include» de CU-07 |
| CU-08.1 Consultar el historial de puntos | Asociación con Socio | «extend» de CU-08 |
| CU-08.2 Consultar el ranking de socios | Asociación con Socio | «extend» de CU-08 |
| CU-13.1 Comentar una publicación | Asociación con Socio | «extend» de CU-13 |
| CU-13.2 Reaccionar a una publicación | Asociación con Socio | «extend» de CU-13 |
| CU-14.1 Enviar una solicitud de soporte | Asociación con Socio | «extend» de CU-14 |
| CU-14.2 Responder una solicitud de soporte | Asociación con Administrador | «extend» de CU-14 |

**Otros ajustes del modelo**
- **CU-04 Solicitar vinculación:** agregar el flujo alterno «Nuevo intento tras un rechazo» (RF-05-6) y la nota de que el
  número se muestra enmascarado (RF-05-5).
- **CU-15:** agregar HU-005 a su trazabilidad (ver el resumen).
- **Actores:** agregar una generalización *Prospecto → Socio / Cliente*, porque la Visión define al prospecto como un
  socio / cliente sin cuenta verificada.
- **Trazabilidad dentro del EAPX:** en cada caso de uso, registrar en la pestaña *Requisitos* (o como valor etiquetado
  `UR`, `HU`, `RF`) los códigos de esta tabla, para que la trazabilidad no dependa solo de los nombres.

---

## Matriz resultante · Sprints 1 y 2

| UR | Caso de uso | HU | Código | Estado |
| -- | ----------- | -- | ------ | ------ |
| UR-01 Crear una cuenta | CU-01 | HU-013 | `POST /auth/register` · `registro.page` | ✔ |
| UR-02 Confirmar el correo | CU-01.2 | HU-014 | `ConfirmacionCorreo` · `confirmar-correo.page` | ✔ |
| UR-03 Ingresar a la plataforma | CU-02, CU-02.1, CU-02.2, **CU-02.6** | HU-003 | `/auth/login`, `/auth/2fa`, `/auth/logout` | ✔ |
| UR-04 Ver solo las opciones de su rol | **CU-02.4, CU-16, CU-17** | HU-001, HU-002, HU-008 | `/roles`, `/usuarios`, `perfil()` | ✔ con CU nuevos |
| UR-05 Recuperar el acceso | CU-02.3, **CU-02.5** | HU-004 | `/auth/forgot`, `/auth/reset` | ✔ con CU nuevo |
| UR-07 Vincular la cuenta | CU-04, CU-04.1, CU-04.2 | HU-015 | `/auth/cuenta` · `mi-cuenta.page` | ✔ |
| UR-08 Verificar las cuentas vinculadas | **CU-18, CU-18.1** | HU-016 | `/usuarios/cuentas-pendientes`, `/usuarios/:id/cuenta` | ✔ con CU nuevo |
| UR-09 Acceso según la verificación | **CU-05.4** | HU-015, HU-017 | `CuentaCooperativa.estaAprobada()` | ✔ con CU nuevo |
| UR-10 Identificarse como referidor | CU-05.1 | HU-017 | `/referidos/mi-codigo` | ✔ |
| UR-11 Invitar en persona | CU-05.2 | HU-017 | QR de 256 px | ✔ · falta prueba con cámara (RNF-19) |
| UR-12 Invitar a distancia | **CU-05.3** | HU-018 | `invitacion.component` | ✔ con CU nuevo · falta prueba de 15 s |
| UR-13 Quedar asociado a quien invitó | CU-01.3, **CU-06.6** | HU-019, HU-011 | registro con `ref`, `/referidos/asociar` | ✔ con CU nuevo |
| UR-14 Evitar registros repetidos | **CU-01.4**, CU-04.1 | HU-013, HU-015 | unicidad de correo, celular y cuenta | ✔ con CU nuevo |
| UR-15 Conocer el estado de los referidos | CU-06 | HU-020 | `GET /referidos` (10 por página) · sondeo de 3 s | ✔ |
| UR-16 Aprobar o rechazar referidos | CU-06.2 | HU-021 | `PATCH /referidos/:id/dictamen` | ✔ |
| UR-17 Atender los referidos pendientes | CU-06, CU-06.1 | HU-012 | filtros y días hábiles | ✔ |
| UR-18 Entregar la lista al equipo comercial | CU-06.3 | HU-024 (Sprint 3) | `/referidos/exportar` | ✔ adelantado |
| UR-19 Premiar a ambas partes | **CU-06.4** | HU-021 | `AcreditacionPuntos` | ✔ con CU nuevo · campañas en Sprint 3 |
| UR-24 Ganar puntos | **CU-06.4** (y CU-08 para consultar) | HU-022 | `MovimientoPuntos` | Parcial: solo referidos hasta el Sprint 4 |
| UR-46 Configurar la plataforma | **CU-19, CU-19.1** | HU-006 | `/configuracion` | ✔ con CU nuevo |
| UR-48 Auditar acciones | **CU-20, CU-20.1** | HU-007 | `/actividad` | ✔ con CU nuevo |
| UR-49 Medir el programa | CU-15 | HU-005 | `/indicadores` (6 indicadores) | ✔ · vincular HU-005 con UR-49 |
| UR-52 Autorizar el tratamiento de datos | CU-01.1 | HU-013 | `AvisoPrivacidad`, `AceptacionTerminos` | ✔ · falta RF-47-4 |
| UR-53 Entender cada pantalla | Transversal (no requiere CU) | HU-009, HU-010 | `CampoComponent`, `AvisoService` | ✔ |
| — (sin UR) | **CU-06.5** | HU-011 | `POST/PATCH /referidos` | ⚠ falta UR |
