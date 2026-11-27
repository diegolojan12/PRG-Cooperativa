# Guion de defensa · SUMA · Sprint 1 y 2

Duración sugerida: 12–15 minutos más preguntas. Cada integrante debe poder dar cualquier bloque, porque la defensa es individual.

---

## 1. Arquitectura (2–3 min) · diapositivas 2 a 4

**Cliente-servidor.**
«SUMA es una aplicación cliente-servidor en tres niveles. El cliente es Angular como PWA: corre en el navegador y solo presenta y valida formularios. El servidor es Node.js con Express sobre NestJS y expone una API REST bajo `/api`. Los datos están en PostgreSQL. El cliente nunca toca la base ni decide permisos: el servidor valida sesión, rol y datos en cada petición.»

**Por qué es hexagonal.**
«Dentro del servidor aplicamos puertos y adaptadores. Al centro está el dominio, en `backend/src/dominio/`: Usuario, Rol, Sesion, Referido, CodigoReferido, ConfirmacionCorreo, AcreditacionPuntos. Esas clases no importan Express ni SQL.
- Adaptador de **entrada**: la API REST (`api.mjs`), que recibe al cliente Angular y orquesta los casos de uso.
- Adaptadores de **salida**: PostgreSQL (`database.mjs`) y el correo SMTP (`infraestructura/correo.mjs`).
La API recibe la base por parámetro (`createApi(database)`) y el correo se crea con `crearCorreo()`, por eso en las pruebas inyectamos un correo falso. Si cambiamos Gmail o el motor de base, el dominio no se toca. Así cumplimos RNF-25, módulos independientes.»

> Frase clave: *«El despliegue es cliente-servidor; la organización interna del servidor es hexagonal.»*

---

## 2. Introducción y avance (2 min) · diapositivas 5 a 7

- **Sprint 1 (semanas 9–10):** HU-001 roles y permisos, HU-002 menú por rol, HU-003 sesión con 2FA, bloqueo a los 5 intentos y cierre a los 15 min. Transversal: cifrado AES-256-GCM (RNF-05) y hash con sal (RNF-04). Todo verificado.
- **Sprint 2 (semanas 11–12):** HU-004 a HU-016 en seis funcionalidades: recuperación de acceso, administración (panel, configuración, bitácora), interfaz con avisos y ayuda, referidos, registro en 3 pasos con confirmación de correo, vinculación y verificación de la cuenta de la Cooperativa.
- **Ser honestos con lo pendiente:** correo de bienvenida (HU-006), edición del socio en la interfaz (HU-011) y mediciones con usuarios (RNF-10, RNF-15, RNF-22).

---

## 3. Análisis (2 min) · diapositivas 8 y 9

Cuatro niveles, todos en `DocumentacionResumenRequisitos.xlsx` (IEEE 830, ISO/IEC 9126):

| Nivel | Cantidad | Dónde |
| --- | --- | --- |
| Requisitos de negocio | 5 necesidades de la Cooperativa | Documento de Visión: definición del problema y necesidades |
| Requisitos de usuario | UR-01 a UR-54 | Hoja *UserReq.*, cada uno con su stakeholder |
| Requisitos funcionales | RF-01 a RF-50 (229 con subrequisitos), 14 módulos | Hojas *Req. Funcionales* y *MODULOS* |
| Requisitos no funcionales | RNF-01 a RNF-26 | Hoja *Req. No Funcionales*, por atributo ISO 9126 |

Ejemplo de negocio que conviene decir: «Captar un socio cuesta cerca de 25 dólares; la meta con referidos es 5 o menos.»

---

## 4. Diseño UML (1–2 min) · diapositivas 10 y 11

«El modelo de Enterprise Architect tiene 137 diagramas: 59 de casos de uso (generales y de detalle, con «include» y «extend»), 38 de secuencia, 38 de actividades, el de clases del dominio y el de contexto. Cada caso de uso tiene valores etiquetados UR, HU, RF y Sprint.»

«Todo está en el Documento de Visión v1.2.0, **Anexo 6**: 6.1 contexto, 6.2 clases, 6.3 casos de uso generales, 6.4 de detalle y 6.5 secuencia y actividades de cada CU.»

Cómo leer cada tipo si preguntan:
- **Casos de uso:** quién (actor) hace qué con el sistema. «include» es obligatorio, «extend» es opcional.
- **Secuencia:** el orden de los mensajes entre actor → página Angular → API → dominio → PostgreSQL, en el tiempo.
- **Actividades:** el flujo del caso de uso con decisiones (rombos), caminos alternos y carriles por responsable.
- **Clases:** las entidades del dominio, sus atributos, métodos y relaciones; son las clases de `backend/src/dominio/`.

---

## 5. Trazabilidad completa (4 min) · diapositivas 12 a 14 · **el bloque más importante**

### 5.1 La cadena

> Negocio → UR → Módulo (RF) → Épica → HU → CU → Secuencia y Actividades → Clases → Código → Prueba

«La cadena se recorre en los dos sentidos: de una necesidad de negocio hasta su prueba, o de una prueba que falla hasta la necesidad que pone en riesgo.»

Dónde está cada eslabón:

| Eslabón | Archivo |
| --- | --- |
| Negocio | Documento de Visión |
| UR, RF, RNF, módulos | `DocumentacionResumenRequisitos.xlsx` (hoja *Trazabilidad*: UR → RF → CU → HU → Sprint → código) |
| Épicas e historias | `Backlog_del_producto.xlsx`, hoja BKL-G1 |
| CU, secuencia, actividades, clases | `SUMA-Diagramas_Vistas_Textos_Centrados.eapx` y Anexo 6 |
| Especificación, plan y tareas | `specs/sprint-N/NN-funcionalidad/` |
| Matriz de las 61 historias | `specs/TRAZABILIDAD.md` |
| Código y prueba | `backend/src`, `frontend/src`, `backend/test/sprint.test.mjs` (35 pruebas) |

### 5.2 Ejemplo completo: HU-013 Registrar una cuenta

Decirlo de corrido, señalando cada fila de la diapositiva 13:

1. **Negocio:** captar socios nuevos a menor costo.
2. **UR-01:** crear una cuenta, para socio o prospecto.
3. **Módulo y RF:** Gestión de usuarios y acceso · RF-01 registro en 3 pasos (RF-01-1 a RF-01-6).
4. **RNF:** RNF-04 hash y sal, RNF-05 AES-256, RNF-10 registro en 3 minutos, RNF-16 errores claros.
5. **Planificación:** épica EPI-06 «Crear mi cuenta y vincularla con la Cooperativa» → HU-013 → Sprint 2.
6. **Casos de uso:** CU-01 Registrar y activar una cuenta, con CU-01.1 y CU-01.4.
7. **Secuencia y actividades:** Anexo 6.5, CU 01. La secuencia muestra: página de registro → `POST /api/auth/register` → validación en el dominio → guardado cifrado → envío del código por correo.
8. **Clases:** `Usuario` y `ConfirmacionCorreo`.
9. **Código:** `POST /api/auth/register` y `registro.page` en Angular.
10. **Prueba:** `sprint.test.mjs`, la prueba «HU-013 / HU-014», y el smoke e2e en el navegador.

### 5.3 Segundo ejemplo, por si piden otro: HU-003 Sesión

- UR-03 Ingresar a la plataforma → RF-04 (RF-04-1 a RF-04-4) · RNF-06 segundo factor → EPI-02 → HU-003 · Sprint 1 → CU-02, CU-02.1, CU-02.2, CU-02.6 → secuencia y actividades CU 02 → clases `Sesion`, `CodigoVerificacion` → `/api/auth/login`, `/auth/2fa`, `/auth/logout` → pruebas `RF-04-1 / RNF-06`, `RF-04-2` (bloqueo), `RF-04-3`, `RF-04-4`.

### 5.4 Módulos ↔ épicas ↔ historias (requisito de la planificación)

| Módulo | RF | Épica | Historias |
| --- | --- | --- | --- |
| Administración | RF-08 | EPI-01 | HU-001, HU-002 |
| Gestión de usuarios y acceso | RF-04, RF-07 | EPI-02 | HU-003, HU-004 |
| Administración · Reportes | RF-14, RF-42, RF-45-1 | EPI-03 | HU-005 a HU-007 |
| Gestión de usuarios (interfaz) | RF-49 | EPI-04 | HU-008 a HU-010 |
| Referidos | RF-11 | EPI-05 | HU-011, HU-012 |
| Gestión de usuarios y acceso | RF-01, RF-02, RF-05, RF-06 | EPI-06 | HU-013 a HU-015 |
| Usuarios · Notificaciones | RF-05-3, RF-39 | EPI-08 | HU-016 |

«Las historias de los Sprints 3 a 5 (HU-017 a HU-061) ya tienen épica, UR, RF y CU en `specs/TRAZABILIDAD.md`.»

---

## 6. Demostración (3 min) · diapositiva 15

1. Ejecutar `INICIAR-POSTGRES.cmd` y `INICIAR-SUMA.cmd` (API en 3000, web en 4200).
2. Registro en 3 pasos → confirmar el correo.
3. Iniciar sesión con el segundo factor.
4. Mostrar que el menú del socio y el del administrador son distintos.
5. Socio: código, enlace y QR de referido.
6. Administrador: verificar una cuenta vinculada, dictaminar un referido, abrir configuración y bitácora (la acción recién hecha aparece registrada).
7. Si hay tiempo: `npm run test:sprint` en `backend`.

---

## 7. Preguntas probables y respuestas cortas

- **¿Dónde está el puerto en su hexágono?** En lo que el dominio y la API esperan recibir: la base que entra por `createApi(database)` y el correo que entrega `crearCorreo()`. Son contratos; los adaptadores concretos se pueden cambiar.
- **¿Por qué no `rol === 'ADMIN'`?** Porque la constitución prohíbe autorizar por nombre de rol: se pregunta por capacidades y los permisos viven en la tabla `RolPermiso`, así el administrador crea roles sin tocar código.
- **¿Cómo prueban que un RF está hecho?** Cada criterio de aceptación tiene una prueba que cita su RF o HU en el nombre; está hecho cuando pasan las pruebas del backend y el lint, las pruebas y el build del frontend.
- **¿Qué pasa con HU-055?** Es duplicada de HU-023 (perfil, Sprint 3); se conserva para no romper la numeración del backlog.
- **¿Qué falta?** Lo declarado: correo de bienvenida, edición del socio en la interfaz y mediciones con usuarios reales (RNF-10, RNF-15, RNF-22).
- **¿Diferencia entre caso de uso e historia?** La historia es la unidad de planificación (quién, qué y para qué, con criterios); el caso de uso es la unidad de diseño (actor, flujo principal y alternos). Una HU puede usar varios CU.

---

## Recordatorio

Enviar al correo del docente, antes de la presentación, el **Documento de Visión con los diagramas** (`Anexo_02_-_Documento_Vision_Proyecto_PRG (con diagramas).docx`).
