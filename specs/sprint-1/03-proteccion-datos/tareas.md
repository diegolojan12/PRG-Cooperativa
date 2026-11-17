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
