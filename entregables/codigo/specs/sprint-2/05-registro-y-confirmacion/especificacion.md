# Especificación · Registro en 3 pasos y confirmación del correo

| Campo | Valor |
| ----- | ----- |
| Sprint | 2 |
| Historias | HU-013 · HU-014 |
| Épica | EPI-06 · Crear mi cuenta y vincularla con la Cooperativa |
| Requisitos de usuario | UR-01 · UR-02 · UR-13 · UR-14 · UR-22 · UR-52 |
| Requisitos funcionales | RF-01 (RF-01-1 a RF-01-6, con provincia) · RF-02 (RF-02-1 a RF-02-3) · RF-47 (RF-47-1, RF-47-2, RF-47-4) · RF-08-2 · RF-14 |
| No funcionales | RNF-04 · RNF-05 · RNF-10 · RNF-12 · RNF-14 · RNF-16 |
| Casos de uso (EAPX) | CU-01 Registrar y activar una cuenta · CU-01.1 Aceptar términos y aviso de privacidad (include) · CU-01.2 Confirmar el correo con un código (include) · CU-01.3 Vincular el registro a un referido (extend) · CU-01.4 Validar que el correo y el celular no estén registrados (include) · CU-19.2 Publicar una nueva versión de los términos (extend de CU-19) |
| Clases (EAPX) | `Usuario` · `AvisoPrivacidad` · `AceptacionTerminos` · `ConfirmacionCorreo` · `CodigoVerificacion` |
| Estado | Implementada · Verificada |

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
| CA-17 | RF-47-4 | el administrador en Configuración | publica una versión mayor que la vigente con términos y aviso de 20 caracteres o más | queda como la única vigente y la bitácora guarda la versión anterior y la nueva |
| CA-18 | RF-47-4 | una versión igual o menor que la vigente, o un número mal escrito | se publica | se rechaza |
| CA-19 | RF-47-1 · RF-47-4 | una persona que aceptó una versión que ya no es la vigente | envía el registro | se rechaza y debe abrir y aceptar la versión nueva |
| CA-20 | RF-01 · RF-14 | el registro cerrado por configuración | un visitante intenta registrarse | se rechaza (antes `sprint-1/02` · CA-16) |
| CA-21 | RF-01 · RF-05-1 | un visitante que da su cuenta de la Cooperativa | el número no tiene 10 dígitos | se rechaza con mensaje en el campo (antes `sprint-1/02` · CA-15) |

## 5. Reglas de negocio

1. Datos del paso 1: nombres y apellidos (3–100 caracteres, al menos 2 palabras), correo, celular `09XXXXXXXX` y
   provincia. La misma regla del nombre vale para las cuentas que crea el administrador.
2. El celular y el correo son únicos entre todas las cuentas (se comparan por su índice HMAC, RNF-05).
3. Los textos de términos y aviso de privacidad tienen versión numerada; siempre hay exactamente 1 vigente. Las variables
   `SUMA_AVISO_VERSION`, `SUMA_TERMINOS` y `SUMA_PRIVACIDAD` solo definen la primera; las siguientes las publica el
   administrador desde Configuración.
4. Las cuentas creadas antes del Sprint 2 se consideran confirmadas (no se les bloquea el acceso).
5. El código de confirmación se guarda solo como huella firmada; el enlace de reanudación vence a las 24 h.
6. La provincia del usuario la hereda su referido; sirve para el filtro de referidos y para las campañas por provincia (Sprint 3).

## 6. Fuera de alcance

- Cambio de correo desde el perfil con confirmación (HU-023 · Sprint 3).
- Medir con usuarios el objetivo de 3 minutos (RNF-10): requiere una prueba de usabilidad con 10 participantes.

## 7. Preguntas abiertas

| # | Pregunta | Para | Estado |
| - | -------- | ---- | ------ |
| P-01 | ¿Cuáles son los textos oficiales de términos y aviso de privacidad (versión 1.0)? Hoy hay textos de prueba (versión 0.1); ya se pueden publicar desde Configuración. | Cooperativa / PO | Abierta |
| P-03 | ¿La provincia es obligatoria en el registro? | PO | Propuesta aplicada: sí (RF-01 y RF-01-1 de la ERS). Falta confirmación del PO |
| P-02 | ¿Qué proveedor SMTP se usará en producción? | TI | Abierta |

## 8. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11-10 | Primera implementación en la rama `sprint-2` | Equipo |
| 2026-11-14 | Integrada en `main` sobre los roles dinámicos del Sprint 1; sin SQLite; spec SDD | Equipo |
| 2026-11-16 | Provincia en el paso 1 (CA-16), publicación de versiones del aviso (CA-17 a CA-19, RF-47-4), criterios de registro traídos de la spec de sesión (CA-20, CA-21), CA-15 con prueba; carpeta renumerada a `05-registro-y-confirmacion`; casos de uso CU-01.4 y CU-19.2 | Equipo |
