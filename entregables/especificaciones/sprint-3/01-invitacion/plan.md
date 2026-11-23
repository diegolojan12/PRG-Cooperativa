# Plan técnico · Enlace, QR, compartir y alta por enlace

Especificación: [`especificacion.md`](especificacion.md) · Estado: Implementado

## 1. Chequeo contra la constitución

| Principio | ¿Se cumple? | Nota |
| --------- | ----------- | ---- |
| II. Nada quemado | Sí | El socio dueño del código se busca entre roles de experiencia Comunidad (`ROLES_PARTICIPANTES`) |
| III. Seguridad | Sí | Código único con bloqueo; enlace validado contra el dominio oficial |
| IV. Trazabilidad | Sí | `Referido asociado por código` con `objetivoId` y `datos.socioId` |
| V. Prueba por criterio | Sí | Ver §7 |
| VI. Accesibilidad | Sí | Botones con texto, QR con `alt`, enlace en un campo de solo lectura para copiar a mano |
| VII. Arquitectura | Sí | `CodigoReferido` en `dominio/referidos.mjs`; dependencia `qrcode` ya declarada en `backend/package.json` |

## 2. Modelo de datos

Sin migración nueva: `Usuario.codigoReferido` (Sprint 1, índice único) y `Referido.usuarioId`.

## 3. API

| Método | Ruta | Acceso | Respuestas |
| ------ | ---- | ------ | ---------- |
| POST | `/api/referidos/mi-codigo` | módulo `referidos` + rol participante + cuenta Aprobada | 200 `{codigo, enlace, qr}` (`qr` = PNG 256 px en data URL) · 403 |
| POST | `/api/auth/register` | público | `codigoReferido` opcional: 400 si no existe, es de un socio sin cuenta Aprobada o es el propio |
| PATCH | `/api/usuarios/:id/cuenta` | administración | al aprobar, `generarCodigo()` asigna el código (CA-01) |

## 4. Dominio

`CodigoReferido` — valida `^[A-Z0-9]{8}$`, `generar()` con `crypto.randomInt`, `enlace(origen)` → `origen/registro?ref=CODIGO`.
`generarCodigo()` en `api.mjs` reintenta hasta 5 veces ante colisión, bajo `pg_advisory_xact_lock`.

## 5. Frontend

| Pieza | Dónde | Archivos |
| ----- | ----- | -------- |
| `InvitacionComponent` (copiar, WhatsApp, Facebook, menú nativo, descargar QR; modo `compacta`) | — | `features/referidos/invitacion.component.ts` |
| Bloque «Invita y gana» o aviso «Vincular mi cuenta» | Inicio del socio `/panel` | `features/comunidad/feed.page.html` |
| QR visible y código | `/panel/mi-cuenta` | `features/resumen/mi-cuenta.page.ts` |
| Invitación en Referidos | `/panel/referidos` | `features/referidos/referidos.page.html` |
| Código precargado desde `?ref=` en el paso 3 | `/registro` | `features/publico/registro.page.ts` |

## 6. Bitácora

`Referido asociado por código` (lo registra el nuevo usuario; `datos.socioId`).

## 7. Estrategia de pruebas

| Criterio | Prueba |
| -------- | ------ |
| CA-01 a CA-04, CA-10, CA-12 | `RF-11: vinculación, código, registro asociado y exportación privada` |
| CA-05 a CA-08 | Revisión de la pantalla; `e2e/smoke.cjs` (descarga del QR y destino de WhatsApp) |
| CA-09 | `e2e/smoke.cjs` (el código del enlace aparece en el paso 3) |
| CA-11, CA-13 | Regla en `/auth/register`; sin prueba propia |

## 8. Decisiones y riesgos

| Decisión | Alternativas descartadas | Motivo |
| -------- | ------------------------ | ------ |
| QR generado en el servidor | Librería de QR en el navegador | Un solo origen para el enlace oficial; sin dependencias nuevas en el frontend |
| Código al aprobar la cuenta (y al primer acceso para cuentas antiguas) | Código al registrarse | RF-09 lo condiciona a la cuenta Aprobada |
| Invitación en el inicio | Solo en Referidos | RNF-21: compartir en 15 s y 3 toques desde que se abre la plataforma |

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
