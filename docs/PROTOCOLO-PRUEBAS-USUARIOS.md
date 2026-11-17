# Protocolo de pruebas con usuarios y dispositivos

Estas mediciones no se pueden automatizar: necesitan personas, teléfonos reales o el servidor de producción. Cada una
cierra un requisito no funcional de los Sprints 1 y 2. Registra los resultados en la tabla del final y adjunta las
grabaciones o capturas a la carpeta del sprint.

## Preparación

- Servidor con HTTPS (RNF-03), SMTP real configurado y la versión vigente de los términos publicada.
- 10 participantes que no hayan usado SUMA: al menos 5 menores de 30 años y 2 mayores de 50.
- Dos teléfonos Android y dos iPhone con las 2 últimas versiones del sistema; Chrome, Edge, Firefox y Safari actualizados.
- Cronómetro y una hoja por participante. Quien observa no ayuda ni explica la pantalla.

## Pruebas

| # | Requisito | Tarea para el participante | Se cumple si |
| - | --------- | -------------------------- | ------------ |
| 1 | RNF-10 · HU-013 | Crear una cuenta desde la portada, sin vincular cuenta de la Cooperativa | 9 de 10 terminan en 3 minutos o menos, sin ayuda |
| 2 | RNF-22 · HU-003 | Iniciar sesión con la cuenta recién creada | 9 de 10 entran en 30 segundos o menos |
| 3 | RNF-22 · HU-004 | Recuperar la contraseña desde «¿Olvidaste tu contraseña?» | 9 de 10 terminan en 5 minutos o menos |
| 4 | RNF-21 · HU-018 | Con un socio verificado, compartir el enlace por WhatsApp desde que abre SUMA | 9 de 10 lo hacen en 15 segundos y 3 toques o menos |
| 5 | RNF-19 · HU-017 | Escanear 20 veces el QR descargado con la cámara nativa (10 Android, 10 iPhone) | 19 de 20 lecturas abren el registro en 5 segundos o menos |
| 6 | RNF-14 · HU-014 | Registrar 20 cuentas con correos de 3 proveedores distintos y medir la llegada del código | 19 de 20 correos llegan en 60 segundos o menos |
| 7 | RNF-17, RNF-18 | Repetir las tareas 1 y 4 en cada navegador y en anchos de 360, 768 y 1 920 px | Ninguna función falla y no hay desplazamiento horizontal |
| 8 | RNF-15 | Revisar registro, inicio, referidos y *Mi cuenta* con axe o WAVE, y recorrerlas solo con el teclado | 0 errores de nivel A o AA y todo se alcanza con el teclado |
| 9 | RNF-01, RNF-02 | Prueba de carga (por ejemplo, k6) con 500 y 1 000 usuarios concurrentes sobre consultas e inicio de sesión | 95 % de consultas en 3 s o menos con 500; menos de 1 % de fallos con 1 000 |

## Registro de resultados

| # | Fecha | Participantes o muestras | Resultado | ¿Cumple? | Evidencia |
| - | ----- | ------------------------ | --------- | -------- | --------- |
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |
| 6 | | | | | |
| 7 | | | | | |
| 8 | | | | | |
| 9 | | | | | |
