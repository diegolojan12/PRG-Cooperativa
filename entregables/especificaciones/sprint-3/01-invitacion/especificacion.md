# Especificación · Enlace, QR, compartir y alta por enlace

| Campo | Valor |
| ----- | ----- |
| Sprint | 3 (HU-017 a HU-019; implementada por adelantado durante el Sprint 2) |
| Historias | HU-017 · HU-018 · HU-019 |
| Épica | EPI-07 · Invitar personas con mi enlace |
| Requisitos de usuario | UR-10 · UR-11 · UR-12 · UR-13 |
| Requisitos funcionales | RF-09 (RF-09-1 a RF-09-3) · RF-10 (RF-10-1 a RF-10-3) · RF-01-5 · RF-11 · RF-11-1 |
| No funcionales | RNF-17 · RNF-18 · RNF-19 · RNF-21 |
| Casos de uso (EAPX) | CU-05 Invitar nuevos socios · CU-05.1 Obtener el enlace de referido · CU-05.2 Descargar el código QR de invitación (extend) · CU-05.3 Compartir el enlace por WhatsApp o redes sociales (extend, actor secundario Redes sociales) · CU-05.4 Comprobar que la cuenta vinculada esté aprobada (include) · CU-01.3 Vincular el registro a un referido (extend) |
| Clases (EAPX) | `CodigoReferido` (`codigo`; `generar()`, `enlace()`) · `Usuario 1 — 0..1 CodigoReferido` · `Referido 0..1 — 0..1 Usuario` («se registra como») |
| Estado | Implementada · Verificada |

## 1. Problema y objetivo

Hoy los referidos se hacen de boca en boca, sin registro ni premio (Documento de Visión). El objetivo es que cada socio
verificado tenga un enlace único y un QR, los comparta en menos de 15 segundos, y que quien se registre con ellos
quede automáticamente como su referido.

## 2. Actores

| Actor | Qué hace |
| ----- | -------- |
| Socio / Cliente con cuenta Aprobada | Obtiene su código, enlace y QR; los copia o comparte. |
| Prospecto invitado | Abre el enlace o escanea el QR y se registra con el código ya escrito. |

## 3. Historias de usuario (backlog `BKL-G1`)

- **HU-017** — Como socio/cliente, deseo obtener mi enlace y código QR de referido para invitar a mis conocidos.
- **HU-018** — Como socio/cliente, deseo compartir mi enlace por WhatsApp o redes sociales para invitar a mis conocidos en pocos segundos.
- **HU-019** — Como socio/cliente, deseo que mi código se llene automáticamente cuando alguien se registra con mi enlace para que la persona invitada quede registrada como mi referida.

## 4. Criterios de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | HU-017 · RF-09-1 | la cuenta vinculada de un socio | pasa a Aprobada | se le asigna un código alfanumérico de 8 caracteres en mayúsculas, único entre socios |
| CA-02 | HU-017 · RF-09 | un socio con código | pide su invitación varias veces | recibe siempre el mismo código y su enlace oficial (`/registro?ref=CODIGO`) |
| CA-03 | HU-017 · RF-09-2 · RF-09-3 | la invitación | se muestra | incluye un QR PNG de al menos 256 x 256 px que se descarga con 1 acción |
| CA-04 | HU-017 · RF-06-2 | un socio sin cuenta Aprobada | abre su invitación | ve el aviso «Vincular mi cuenta» y no obtiene enlace |
| CA-05 | HU-018 · RF-10-1 | la invitación | pulsa «Copiar enlace» | se copia exactamente 1 URL oficial y se avisa que se copió |
| CA-06 | HU-018 · RF-10-2 | la invitación | pulsa WhatsApp | se abre WhatsApp con un mensaje de máximo 300 caracteres que incluye el enlace |
| CA-07 | HU-018 · RF-10-3 | la invitación | se muestra | ofrece al menos WhatsApp, Facebook y el menú de compartir del dispositivo |
| CA-08 | HU-018 · RNF-21 | un socio que abre la plataforma | quiere compartir | lo logra desde el inicio sin navegar a otra pantalla (bloque «Invita y gana») |
| CA-09 | HU-019 · RF-01-5 | un visitante que abre el enlace o escanea el QR | llega al paso 3 del registro | el código del socio aparece ya escrito; puede borrarlo o escribirlo a mano |
| CA-10 | HU-019 · RF-11-1 | un código que no existe o de un socio sin cuenta Aprobada | se registra con él | se rechaza indicando el campo y puede continuar sin código |
| CA-11 | HU-019 · RF-11-1 | el código del propio usuario | se usa | se rechaza |
| CA-12 | HU-019 · RF-11 | un registro con código válido | se crea la cuenta | queda un referido **Pendiente** del socio, enlazado a la nueva cuenta, y el socio recibe un aviso con el nombre de pila |
| CA-13 | HU-019 · RF-11 | un referido Pendiente que el socio ya había cargado a mano con ese correo | la persona se registra con su código | se enlaza a ese mismo referido, sin duplicarlo |

## 5. Reglas de negocio

1. El enlace se arma con `FRONTEND_URL` (dominio oficial); un enlace con usuario/clave o de más de 300 caracteres se rechaza.
2. El código se genera una sola vez y no cambia.
3. Si el correo ya tiene un referido activo de **otro** socio, o ya dictaminado, el registro con código se rechaza.

## 6. Fuera de alcance

- Probar la lectura del QR con la cámara nativa de Android e iOS (RNF-19: 20 pruebas en dispositivos).
- Cronometrar los 15 s con 10 participantes (RNF-21).
- Campañas que cambien los puntos del enlace (HU-025 a HU-027 · Sprint 3).

## 7. Preguntas abiertas

| # | Pregunta | Para | Estado |
| - | -------- | ---- | ------ |
| P-01 | ¿Cuál es el dominio oficial de producción para el enlace? | TI | Abierta |
| P-02 | ¿Texto definitivo del mensaje de WhatsApp? Hoy: «Te invito a sumarte a la comunidad SUMA.» + enlace. | Jefatura de Marketing | Abierta |

## 8. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11-10 | Primera implementación en la rama `sprint-2` | Equipo |
| 2026-11-14 | Integrada en `main`; bloque «Invita y gana» en el inicio del socio y QR visible en *Mi cuenta* | Equipo |
| 2026-11-16 | Pasa a `sprint-3/` (HU-017 a HU-019 son del Sprint 3 según la columna *Sprint* del backlog). El referido hereda la provincia de quien se registra; casos de uso CU-05.3 y CU-05.4 | Equipo |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 3 |
| Historias | HU-017 · HU-018 · HU-019 |
| Épicas de BKL-G1 | EPI-07 |
| Requisitos de usuario | UR-10 · UR-11 · UR-12 · UR-13 |
| Requisitos funcionales | RF-09 (RF-09-1 a RF-09-3) · RF-10 (RF-10-1 a RF-10-3) · RF-01-5 · RF-11 · RF-11-1 |
| Requisitos no funcionales | RNF-17 · RNF-18 · RNF-19 · RNF-21 |
| Casos de uso | CU-05 Invitar nuevos socios · CU-05.1 Obtener el enlace de referido · CU-05.2 Descargar el código QR de invitación (extend) · CU-05.3 Compartir el enlace por WhatsApp o redes sociales (extend, actor secundario Redes sociales) · CU-05.4 Comprobar que la cuenta vinculada esté aprobada (include) · CU-01.3 Vincular el registro a un referido (extend) |
| Diagram_ID de comportamiento | 31 Sequence; 32 Activity; 101 Sequence; 102 Activity |
| Modelo UML vigente | [SUMA-Diagramas_Vistas_Textos_Centrados.eapx](../../../SUMA-Diagramas_Vistas_Textos_Centrados.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
