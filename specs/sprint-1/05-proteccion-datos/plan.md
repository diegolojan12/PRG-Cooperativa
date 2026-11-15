# Plan técnico · Protección de datos personales en reposo

Especificación: [`especificacion.md`](especificacion.md) · Estado: Implementado

## 1. Chequeo contra la constitución

| Principio | ¿Se cumple? | Nota |
| --------- | ----------- | ---- |
| III. Seguridad | Sí | Cifrado autenticado; clave obligatoria en producción |
| VII. Arquitectura | Sí | `ProteccionDatos` en `dominio/proteccion-datos.mjs`, sin dependencias externas (`node:crypto`) |
| V. Prueba por criterio | Sí | `RNF-05: migra datos personales…` |

## 2. Diseño criptográfico

| Elemento | Decisión |
| -------- | -------- |
| Clave maestra | `SUMA_DATA_KEY`: 64 caracteres hexadecimales (32 bytes) en `backend/.env` |
| Derivación | HKDF-SHA256 → clave de cifrado (`suma:cifrado:v1`) y clave de índice (`suma:indice:v1`) |
| Cifrado | AES-256-GCM, IV aleatorio de 12 bytes, AAD = nombre del campo |
| Formato guardado | `aes:v1:` + base64(IV ‖ etiqueta ‖ texto cifrado) |
| Índice | HMAC-SHA256 del correo normalizado (minúsculas, sin espacios) → `correoIndice`; de la cuenta → `cuentaIndice` |
| Control de clave | `Configuracion.verificadorCifrado`; si no descifra: "SUMA_DATA_KEY no coincide con la clave de esta base de datos." |

## 3. Modelo de datos

`sprint1-dominio.sql`: `Usuario.correoIndice`, `Usuario.cuentaIndice`, `Referido.correoIndice`.
`Database.init()` (`backend/src/database.mjs`) cifra las filas que aún estén en claro.

## 4. Puntos de uso

`api.mjs` cifra al registrar (`/auth/register`), al crear o editar referidos, al asociar y al crear usuarios;
busca y valida duplicados por índice; descifra antes de responder y nunca devuelve `correoIndice`.

## 5. Estrategia de pruebas

| Criterio | Prueba |
| -------- | ------ |
| CA-01 a CA-06 | `RNF-05: migra datos personales y conserva acceso y unicidad por correo` (`backend/test/sprint.test.mjs`) |
| CA-07 | Sin prueba automatizada (lo controla el constructor de `ProteccionDatos`) |

## 6. Decisiones y riesgos

| Decisión | Alternativas descartadas | Motivo |
| -------- | ------------------------ | ------ |
| Cifrado en la aplicación | `pgcrypto` o cifrado de disco | La clave no viaja a la base y una copia de la base no basta para leer los datos |
| Índice HMAC determinista | Descifrar todo para buscar | Permite login, búsqueda y unicidad sin exponer el valor |
| Prefijo versionado `aes:v1:` | Sin versión | Deja la puerta abierta a rotar el algoritmo o la clave |
| Riesgo | Perder `SUMA_DATA_KEY` deja los datos ilegibles | Mitigación: custodia y respaldo de la clave (P-01) |
