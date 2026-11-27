# Guion de defensa · SUMA · 12 minutos

**Idea que el profesor debe llevarse:** *cada historia de los Sprints 1 y 2 nace de un requisito de usuario, se especifica en RF y RNF medibles, se diseña en UML, se implementa en una clase del dominio y se comprueba con una prueba que cita su requisito. Es la misma información en cinco formas, no documentación hecha al final.*

| Bloque | Diapositivas | Tiempo | Acumulado |
| --- | --- | --- | --- |
| Portada | 1 | 0:20 | 0:20 |
| Arquitectura | 2–4 | 2:10 | 2:30 |
| Método y matriz | 5–7 | 1:45 | 4:15 |
| Caso 1 · Roles y permisos (S1) | 8–10 | 1:40 | 5:55 |
| Caso 2 · Sesión segura (S1 y S2) | 11–13 | 1:40 | 7:35 |
| Caso 3 · Registro y confirmación (S2) | 14–16 | 1:40 | 9:15 |
| Caso 4 · Referidos (S2) | 17–19 | 1:40 | 10:55 |
| Clases y cierre | 20–21 | 1:00 | 11:55 |

Patrón de cada caso, siempre igual para que el profesor lo siga: **ficha (qué pide) → diagramas (cómo se diseñó) → código (dónde está y cómo se prueba).**

---

## 1. Portada · 0:20

«Buenos días. Somos el equipo de SUMA, la plataforma de referidos y fidelización de la Cooperativa Padre Julián Lorente. En doce minutos vamos a demostrar dos cosas: que la arquitectura es correcta, y que cada requisito de los Sprints 1 y 2 se puede seguir hasta su código y su prueba.»

## 2. Arquitectura · 2:10

**Cliente-servidor (0:50).**
«SUMA es cliente-servidor en tres niveles. El cliente es Angular: corre en el navegador y solo presenta. El servidor es Node.js con Express sobre NestJS y expone una API REST en `/api`. Los datos están en PostgreSQL. El cliente nunca toca la base y nunca decide permisos: el servidor valida sesión, rol y datos en cada petición.»

**Hexagonal (0:50).**
«Dentro del servidor separamos el negocio de la tecnología. Al centro, el dominio: `backend/src/dominio/` con Usuario, Rol, Sesion, Referido, ConfirmacionCorreo. Esas clases no importan Express ni SQL. En el borde, los adaptadores: de entrada la API REST (`api.mjs`), de salida PostgreSQL (`database.mjs`) y el correo (`infraestructura/correo.mjs`).»

> **Frase clave:** *«El despliegue es cliente-servidor; la organización del servidor es hexagonal. No se contradicen: una dice dónde corre cada parte y la otra cómo se ordena el código dentro del servidor.»*

**Por qué es correcto (0:30).**
«Las dependencias apuntan hacia el dominio. La API recibe la base por parámetro, `createApi(database)`, y el correo con `crearCorreo()`: en las pruebas inyectamos un correo falso. Eso cumple el RNF-25, módulos independientes.»

## 3. Método y matriz · 1:45

**Cadena (0:40).** «Así leemos cada caso: Negocio → UR → Módulo y RF → Épica → HU → Caso de uso → Secuencia y Actividades → Clases → Código → Prueba. Se recorre en los dos sentidos.»

**Matriz (1:05).** «Estas son las 16 historias de los Sprints 1 y 2. Ninguna está huérfana: cada una tiene su épica, su UR, sus RF y RNF y su caso de uso. Las filas resaltadas son los cuatro casos que vamos a recorrer completos. Las 16 tienen especificación, plan y tareas en `specs/`, y al menos una prueba automatizada que cita su requisito.»

---

## 4. Caso 1 · Roles y permisos · HU-001, HU-002 · Sprint 1 · 1:40

**Ficha.** UR-04 *Ver solo las opciones de su rol* → RF-08 con 08-1 tres roles base, 08-2 rol por defecto, 08-3 menú por rol, 08-4 rechazo en servidor, 08-5 auditoría → RNF-13 bitácora 5 años, RNF-25 → EPI-01 → HU-001, HU-002 → CU-16, CU-17, CU-02.4.

**Diagramas (Fig. 29, 101, 102).** «La secuencia tiene un *break* cuando la operación o los permisos no son válidos: se rechaza el cambio. Si son válidos, se guarda el rol, se registra en bitácora y los permisos rigen desde la siguiente petición. Las líneas de vida son las capas del hexágono: UI Sistema es Angular, Sistema es la API con su dominio, Base de Datos es el adaptador de salida.»

**Código.** «La regla vive en `Rol.validarPermisos()` (`dominio/acceso.mjs`): valida que el módulo exista, esté disponible y se conserven los obligatorios. La ruta `PUT /api/roles/:rol` solo orquesta: exige administrador, delega al dominio, guarda en `RolPermiso` y registra la bitácora (RF-08-5). En Angular, `moduloGuard` redirige a acceso denegado, pero el servidor rechaza igual.»

> **Para convencer:** *«Nunca escribimos `rol === 'ADMIN'`. Preguntamos por capacidades. Por eso la prueba se llama "roles y permisos se crean, editan y eliminan sin tocar el código".»*

## 5. Caso 2 · Sesión segura · HU-003 (S1), HU-004 (S2) · 1:40

**Ficha.** UR-03, UR-05 → RF-04 con 04-1 sesión en 3 s, 04-2 bloqueo 15 min tras 5 intentos, 04-3 vence a 15 min, 04-4 cierre · RF-07 enlace de un uso, 30 min → RNF-04 hash con sal, RNF-06 segundo factor, RNF-12, RNF-14, RNF-22 → EPI-02 → CU-02 y subcasos.

**Diagramas (Fig. 12, 67, 68).** «Credenciales y estado; si fallan, *break* que deniega. Un fragmento *opt*: si el rol exige segundo factor, se envía y valida el código. Solo al final se cargan permisos, se crea la sesión y se muestra el menú autorizado. Actividades con las mismas tres decisiones.»

**Código.** «`Sesion.INACTIVIDAD_MS = 15 * 60_000` es el RF-04-3. En `POST /auth/login`, `BLOQUEO_MS` y `MAX_INTENTOS = 5` son el RF-04-2 y responden 423. El segundo factor va por `POST /auth/2fa` (RNF-06). Y el RNF-04 está en `database.mjs`: scrypt con sal aleatoria y comparación en tiempo constante.»

> **Para convencer:** *«Cada número del requisito vive en una sola constante comentada con su RF, y tiene su propia prueba: la del RF-04-2 hace cinco intentos fallidos y comprueba el bloqueo.»*

## 6. Caso 3 · Registro y confirmación · HU-013, HU-014 · Sprint 2 · 1:40

**Ficha.** UR-01, UR-02, UR-14, UR-52 → RF-01 registro en 3 pasos (01-1 a 01-6), RF-02 código de 6 dígitos, 10 min, 3 reenvíos por hora, RF-47 términos → RNF-04, RNF-05 AES-256, RNF-10 registro en 3 min, RNF-14, RNF-16 → EPI-06 → CU-01, CU-01.1, 01.2, 01.4.

**Diagramas (Fig. 11, 63, 64).** «Dos *break*: registro cerrado, y términos no aceptados o datos duplicados. Un *opt*: si viene código de referido, se valida y se asocia. Al final se envía el código por correo.»

**Código.** «Mire la correspondencia: el primer *break* es `if (setting?.valor !== 'true') fail(…, 403)`; el *opt* es `req.body.codigoReferido ? new CodigoReferido(…) : null`. En el dominio, `ConfirmacionCorreo.emitir()` genera el código de 6 dígitos con vencimiento a 10 minutos (RF-02-1) y en la base solo se guarda su huella.»

> **Para convencer:** *«El diagrama de secuencia no es un dibujo aparte: sus fragmentos son condiciones reales del código.»*

## 7. Caso 4 · Referidos · HU-011, HU-012 · Sprint 2 · 1:40

**Ficha.** UR-13, UR-16, UR-17, UR-54 → RF-11 con 11-3 listado de 20, 11-4 dictamen solo con cuenta Aprobada, 11-5 asociación en 30 días, 11-6 baja lógica → RNF-12, RNF-05, RNF-23 (no guarda saldos ni movimientos) → EPI-05 → depende de HU-015/016 → CU-06, CU-18.

**Diagramas (Fig. 18, 83, 84).** «*Break* si el referido ya fue dictaminado. Si aprueba, en una transacción se aprueba y se acredita a ambas partes una sola vez, y se notifica. Si rechaza, se guarda sin puntos. Siempre se registra auditoría.»

**Código.** «La regla más importante del negocio está en `Referido.#dictaminar()`: si no está Pendiente, 409; si se aprueba sin cuenta vinculada Aprobada, 409. La ruta `PATCH /api/referidos/:id/dictamen` abre una transacción, pide el dictamen al dominio, acredita puntos, registra la bitácora y notifica.»

> **Para convencer:** *«Aunque alguien llame a la API saltándose la pantalla, el dominio impide aprobar un referido sin cuenta verificada. Eso es lo que gana la arquitectura hexagonal: la regla no depende de la interfaz.»*

---

## 8. Clases y cierre · 1:00

**Clases (0:40).** «El diagrama de clases del Anexo 6.2 se implementa en `dominio/`: Rol y Modulo, Sesion y CodigoVerificacion, Usuario y AceptacionTerminos, ConfirmacionCorreo, Referido, CodigoReferido y CuentaCooperativa. Cuando encontramos diferencias, como el Rol con nombres fijos, corregimos el diseño para que los roles vivan en la base.»

**Cierre (0:20).** «Cada historia nace de un requisito de usuario, se especifica en RF y RNF medibles, se diseña en UML, se implementa en el dominio y se prueba con un test que cita su requisito. Podemos abrir cualquier archivo o ejecutar las pruebas ahora mismo. Gracias.»

---

## Preguntas probables

| Pregunta | Respuesta corta |
| --- | --- |
| ¿No es contradictorio decir cliente-servidor y hexagonal? | No. Cliente-servidor es la distribución física; hexagonal es la organización del servidor. |
| ¿Dónde están los puertos? | En lo que el dominio y la API reciben: la base en `createApi(database)` y el correo de `crearCorreo()`. Son contratos; el adaptador concreto se cambia sin tocar el dominio. |
| ¿Por qué la regla no está en el controlador? | Porque así no depende de la pantalla ni del framework, y se prueba aislada. El controlador solo orquesta. |
| ¿Cómo sé que una HU está terminada? | Cuando pasan las pruebas que citan su RF o HU (`npm run test:sprint`) y el lint, las pruebas y el build del frontend. |
| ¿Historia vs caso de uso? | La HU planifica (quién, qué, para qué y criterios); el CU diseña (actor, flujo principal y alternos). Una HU puede usar varios CU. |
| ¿Qué falta? | Correo de bienvenida (HU-006), edición del socio en la interfaz (HU-011) y mediciones con usuarios (RNF-10, RNF-15, RNF-22). Está documentado. |

## Antes de entrar

- Tener abiertos: `backend/src/dominio/referidos.mjs`, `backend/src/api.mjs` y Enterprise Architect con CU-06.
- Tener PostgreSQL y SUMA iniciados (`INICIAR-POSTGRES.cmd`, `INICIAR-SUMA.cmd`) por si piden ver algo funcionando.
- Probar una vez `npm run test:sprint` en `backend` para poder ejecutarlo en vivo.
- Enviar al docente el Documento de Visión con diagramas antes de la presentación.
