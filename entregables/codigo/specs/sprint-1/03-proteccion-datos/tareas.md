# Tareas · Protección de datos personales en reposo

Plan: [`plan.md`](plan.md) · Estado: Completado

- [x] T01 — Columnas `correoIndice` y `cuentaIndice` (`sprint1-dominio.sql`) (CA-04)
- [x] T02 — Prueba `RNF-05: migra datos personales…` (CA-01 a CA-06)
- [x] T03 — Clase `ProteccionDatos`: HKDF, AES-256-GCM, HMAC (CA-01)
- [x] T04 — Cifrado de las filas existentes en `Database.init()` (CA-02)
- [x] T05 — Login, búsqueda y unicidad por índice (CA-03, CA-04)
- [x] T06 — Quitar el índice de todas las respuestas (CA-05)
- [x] T07 — Verificador de clave en `Configuracion` (CA-06)
- [x] T08 — Error al arrancar en producción sin clave (CA-07)
- [x] T09 — Prueba automatizada de CA-07 (2026-11-16)
- [ ] T10 — Definir custodia y respaldo de `SUMA_DATA_KEY` (P-01)

## Verificación

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01 a CA-06 | `RNF-05: migra datos personales y conserva acceso y unicidad por correo` | Sí |
| CA-07 | `RNF-05: producción no arranca sin SUMA_DATA_KEY` | Sí |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 1 |
| Historias | Sin HU propia; RNF-05 transversal |
| Épicas de BKL-G1 | Transversal, sin épica propia |
| Requisitos de usuario | Transversal; véase requisito aplicable |
| Requisitos funcionales | Sin RF exclusivo; protección transversal |
| Requisitos no funcionales | RNF-05 |
| Casos de uso | Transversal; no requiere CU independiente |
| Diagram_ID de comportamiento | Sin diagrama de comportamiento propio; requisito transversal |
| Modelo UML vigente | [SUMA-Diagramas_Vistas_Textos_Centrados.eapx](../../../../SUMA-Diagramas_Vistas_Textos_Centrados.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
