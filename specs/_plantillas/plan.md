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
