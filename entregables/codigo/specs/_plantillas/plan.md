# Plan técnico · <Nombre de la funcionalidad>

Especificación: [`especificacion.md`](especificacion.md) · Estado: Borrador

## 1. Chequeo contra la constitución

| Principio | ¿Se cumple? | Nota |
| --------- | ----------- | ---- |
| II. Nada quemado | | |
| III. Seguridad por defecto | | |
| IV. Trazabilidad / bitácora | | |
| V. Prueba por criterio | | |
| VI. Accesibilidad | | |
| VII. Arquitectura | | |

## 2. Modelo de datos

Tablas o columnas nuevas, migración `backend/prisma/sprintN-<tema>.sql`, índices y restricciones.

## 3. API

| Método | Ruta | Módulo requerido | Entrada | Respuestas |
| ------ | ---- | ---------------- | ------- | ---------- |
| | `/api/...` | | | 200 · 400 · 403 · 409 |

## 4. Dominio

Reglas que van en `backend/src/dominio/<archivo>.mjs`.

## 5. Frontend

| Pantalla / componente | Ruta | Guard | Archivos |
| --------------------- | ---- | ----- | -------- |
| | | | `frontend/src/app/features/...` |

## 6. Bitácora

Acciones que se registran en `Actividad` y qué `datos` llevan.

## 7. Estrategia de pruebas

| Criterio | Tipo de prueba | Archivo |
| -------- | -------------- | ------- |
| CA-01 | Integración API | `backend/test/...` |

## 8. Decisiones y riesgos

| Decisión | Alternativas descartadas | Motivo |
| -------- | ------------------------ | ------ |

## Referencias vigentes

Actualización documental del 22 de noviembre de 2026. Consultar [la matriz de trazabilidad](../TRAZABILIDAD.md) para identificadores, épicas, sprints y modelo UML. HU-055 es duplicada de HU-023/S3; HU-056 y HU-057 se mantienen en S5. Los registros históricos conservan su fecha y las verificaciones pendientes conservan su estado.

Al crear una funcionalidad, declarar su HU, épica y sprint de BKL-G1, UR/RF/RNF de la matriz, CU y Diagram_ID del modelo vigente. Unir cada tarea con un CA y cada CA con evidencia verificable. No renumerar historias para copiar un ejemplo ni mover el sprint por una implementación adelantada.
