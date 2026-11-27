# Especificación · Registro en 3 pasos y confirmación del correo

> Revisión de auditoría 2026-11-26: la validación de cuentas y referidos es automática contra la base institucional autorizada. El administrador solo consulta. La implementación y las pruebas de esta revisión están pendientes; la evidencia del flujo manual es histórica. Véase [validación automática](../../validacion-automatica.md).

| Campo | Valor |
| ----- | ----- |
| Sprint | 2 |
| Historias | HU-013 · HU-014 |
| Épica | EPI-06 · Crear mi cuenta y vincularla con la Cooperativa |
| Requisitos de usuario | UR-01 · UR-02 · UR-13 · UR-14 · UR-52 |
| Requisitos funcionales | RF-01 (RF-01-1 a RF-01-6, con provincia) · RF-02 (RF-02-1 a RF-02-3) · RF-47 (RF-47-1, RF-47-2) · RF-08-2 · RF-14 |
| No funcionales | RNF-04 · RNF-05 · RNF-10 · RNF-12 · RNF-14 · RNF-16 |
| Casos de uso (EAPX) | CU-01 Registrar y activar una cuenta · CU-01.1 Aceptar términos y aviso de privacidad (include) · CU-01.2 Confirmar el correo con un código (include) · CU-01.3 Vincular el registro a un referido (extend) · CU-01.4 Validar que el correo y el celular no estén registrados (include) |
| Clases de la implementación anterior | `Usuario` · `AvisoPrivacidad` · `AceptacionTerminos` · `ConfirmacionCorreo` · `CodigoVerificacion` |
| Estado | Base anterior implementada en el alcance indicado; integración automática revisada pendiente de implementación y verificación |

## 1. Problema y objetivo

Hoy una persona tiene que ir a una agencia para unirse. El objetivo es que socios y prospectos creen su cuenta
solos, en 3 pasos y en menos de 3 minutos (UR-01), con su correo confirmado (UR-02) y con la autorización
expresa del tratamiento de sus datos (UR-52).

## 2. Actores

| Actor | Qué hace |
| ----- | -------- |
| Prospecto | Crea su cuenta (con o sin el código de un socio) y confirma su correo. |
| Socio / Cliente | Igual que el prospecto; además puede vincular su cuenta de la Cooperativa en el paso 2. |
| Sistema | Envía el código, valida la aceptación y registra la evidencia. |

## 3. Historias de usuario (backlog `BKL-G1`)

- **HU-013** — Como socio/cliente, deseo registrarme en 3 pasos para crear mi cuenta sin acudir a una agencia.
- **HU-014** — Como socio/cliente, deseo confirmar mi correo con un código para activar mi cuenta.

## 4. Criterios de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | HU-013 · RF-01 · RF-01-6 | un visitante en `/registro` | avanza por el formulario | ve 3 pasos (datos, cuenta, acceso) con su porcentaje y, al volver atrás, conserva lo escrito |
| CA-02 | HU-013 · RF-01-1 | el paso 1 | escribe nombres y apellidos, correo, celular y provincia | se exigen nombres de 3 a 100 caracteres (nombre y apellido), correo válido, celular de 10 dígitos que empiece con 09 y 1 de las 24 provincias del Ecuador; **no** se pide cédula |
| CA-03 | HU-013 · RF-01-2 · UR-14 | un correo o un celular ya registrados | se intenta crear la cuenta | se rechaza indicando el campo |
| CA-04 | HU-013 · RF-01-3 | el paso 2 | elige «No, aún no» | puede continuar sin vincular cuenta |
| CA-05 | HU-013 · RF-01-4 | el paso 3 | escribe la contraseña | se exigen 8+ caracteres, 1 mayúscula, 1 número, y que la confirmación coincida |
| CA-06 | HU-013 · RF-47-1 | la casilla de términos sin marcar o una versión de aviso distinta de la vigente | se envía | se rechaza y no se crea la cuenta |
| CA-07 | RF-47-2 | una cuenta creada | se guarda | queda la evidencia: usuario, versión del aviso y fecha y hora |
| CA-08 | RF-08-2 | una cuenta creada desde el registro | se guarda | tiene el rol por defecto *Socio / Cliente* y estado «sin confirmar» |
| CA-09 | HU-014 · RF-02-1 | una cuenta recién creada | termina el registro | recibe por correo un código de 6 dígitos que vence a los 10 minutos |
| CA-10 | HU-014 · RF-02 | un código válido | lo escribe en `/confirmar-correo` | la cuenta queda activa; el código no sirve una segunda vez |
| CA-11 | HU-014 · RF-02 | un código vencido, incorrecto o con 5 intentos fallidos | se usa | se rechaza y se ofrece pedir otro |
| CA-12 | HU-014 · RF-02-2 | 3 reenvíos en la última hora | pide un cuarto | se rechaza hasta que pase la hora |
| CA-13 | HU-014 · RF-02-3 | una cuenta sin confirmar | inicia sesión con la contraseña correcta | no recibe sesión; se le lleva a confirmar su correo |
| CA-14 | RF-01-5 | un visitante que abre el enlace o el QR de un socio | llega al paso 3 | el código del socio ya está escrito (ver `sprint-3/01-invitacion`) |
| CA-15 | RNF-12 · RNF-14 | producción sin correo configurado | alguien intenta registrarse | se rechaza y no se crea la cuenta; nunca se muestra el código en pantalla |
| CA-16 | RF-01-1 · T-01 | el paso 1 sin provincia o con una que no existe | se envía | se rechaza indicando el campo `provincia` |
| CA-20 | RF-01 · RF-14 | el registro cerrado por configuración | un visitante intenta registrarse | se rechaza (antes `sprint-1/02` · CA-16) |
| CA-21 | RF-01 · RF-05-1 | un visitante que da su cuenta de la Cooperativa | el número no tiene 10 dígitos | se rechaza con mensaje en el campo (antes `sprint-1/02` · CA-15) |

## 5. Reglas de negocio

Al declarar una cuenta se inicia RF-50. La creación del registro y la confirmación del correo se conservan; confirmar correo no acredita titularidad institucional. La activación del registro y el resultado automático de cuenta disparan la reevaluación del referido. Nunca se requiere aprobación administrativa.


1. Datos del paso 1: nombres y apellidos (3–100 caracteres, al menos 2 palabras), correo, celular `09XXXXXXXX` y
   provincia. La misma regla del nombre vale para las cuentas que crea el administrador.
2. El celular y el correo son únicos entre todas las cuentas (se comparan por su índice HMAC, RNF-05).
3. Los textos de términos y aviso de privacidad tienen versión numerada; siempre hay exactamente 1 vigente. Las variables
   `SUMA_AVISO_VERSION`, `SUMA_TERMINOS` y `SUMA_PRIVACIDAD` permiten configurar la primera. En desarrollo se conserva la versión de prueba existente. La gestión de versiones y aprobación de textos corresponde al Sprint 5.
4. Las cuentas creadas antes del Sprint 2 se consideran confirmadas (no se les bloquea el acceso).
5. El código de confirmación se guarda solo como huella firmada; el enlace de reanudación vence a las 24 h.
6. La provincia del usuario la hereda su referido; sirve para el filtro de referidos y para las campañas por provincia (Sprint 3).

## 6. Fuera de alcance

- Cambio de correo desde el perfil con confirmación (HU-023 · Sprint 3).
- Medir con usuarios el objetivo de 3 minutos (RNF-10): requiere una prueba de usabilidad con 10 participantes.

## 7. Preguntas abiertas

| # | Pregunta | Para | Estado |
| - | -------- | ---- | ------ |
| P-01 | Textos oficiales y publicación de acuerdos | Cooperativa / PO | Trasladada a Sprint 5, HU-057; registro sigue usando textos de prueba |
| P-03 | ¿La provincia es obligatoria en el registro? | PO | Propuesta aplicada: sí (RF-01 y RF-01-1 de la ERS). Falta confirmación del PO |
| P-02 | ¿Qué proveedor SMTP se usará en producción? | TI | Abierta |

## 8. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11-10 | Primera implementación en la rama `sprint-2` | Equipo |
| 2026-11-14 | Integrada en `main` sobre los roles dinámicos del Sprint 1; sin SQLite; spec SDD | Equipo |
| 2026-11-16 | Provincia en el paso 1 (CA-16), publicación de versiones del aviso (CA-17 a CA-19, RF-47-4), criterios de registro traídos de la spec de sesión (CA-20, CA-21), CA-15 con prueba; carpeta renumerada a `05-registro-y-confirmacion`; casos de uso CU-01.4 y CU-19.2 | Equipo |

## Reprogramación · 2026-11-19

CA-17 a CA-19 se trasladan a [HU-057 · Sprint 5](../../sprint-5/04-privacidad-y-acuerdos/especificacion.md); no se renumeran los criterios restantes. La aceptación del aviso vigente durante el registro (RF-47-1 y RF-47-2) permanece en Sprint 2. No se publican nuevos textos ni se consideran oficiales los ejemplos existentes.

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad revisada al 26 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 2 |
| Historias | HU-013 · HU-014 |
| Épicas de BKL-G1 | EPI-06 |
| Requisitos de usuario | UR-01 · UR-02 · UR-13 · UR-14 · UR-52 |
| Requisitos funcionales | RF-01 (RF-01-1 a RF-01-6, con provincia) · RF-02 (RF-02-1 a RF-02-3) · RF-47 (RF-47-1, RF-47-2) · RF-08-2 · RF-14 |
| Requisitos no funcionales | RNF-04 · RNF-05 · RNF-10 · RNF-12 · RNF-14 · RNF-16 |
| Casos de uso | CU-01 Registrar y activar una cuenta · CU-01.1 Aceptar términos y aviso de privacidad (include) · CU-01.2 Confirmar el correo con un código (include) · CU-01.3 Vincular el registro a un referido (extend) · CU-01.4 Validar que el correo y el celular no estén registrados (include) |
| Diagram_ID de comportamiento | 31 Sequence; 32 Activity; 37 Sequence; 38 Activity |
| Modelo UML revisado: casos de uso y clases | [SUMA-Diagramas_Vistas.eapx](../../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
