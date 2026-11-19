# Correo transaccional de SUMA

Un remitente autenticado entrega mensajes a cualquier dominio de destinatario. El dominio de quien
se registra no determina el proveedor de SUMA. No hace falta conectar Gmail, Hotmail y Outlook a la vez.

## Desarrollo con Gmail

1. Elige una cuenta Gmail del equipo como remitente. La cuenta del administrador destinatario de este
   laboratorio es `nixx2409@gmail.com`; puede ser diferente de la remitente.
2. Habilita la verificación en dos pasos de la cuenta remitente y genera una contraseña de aplicación
   para SUMA en [Google](https://myaccount.google.com/apppasswords). Algunas cuentas administradas o con
   Protección Avanzada no permiten esta opción; en ese caso usa otro remitente o SMTP/OAuth2 externo.
3. Desde la raíz del proyecto ejecuta `./scripts/configurar-correo.ps1`. Pide el remitente y la contraseña
   de aplicación de forma oculta, guarda `backend/.env` (ignorado por Git) y verifica SMTP **sin enviar**.
   Si la verificación funciona, establece `ENABLE_DEV_RESET_LINK=false` para recibir los códigos por correo.
4. Reinicia el backend. Entra con el correo de tu cuenta administradora. Su código de 2FA debe llegar
   a ese mismo correo. En recuperación, el enlace llega a la cuenta solicitante.
5. Mientras se configura el proveedor, `ENABLE_DEV_RESET_LINK=true` permite el modo laboratorio;
   producción lo ignora. El asistente lo desactiva tras verificar SMTP; recuerda reiniciar el backend.

Configuración equivalente en `backend/.env`:

```dotenv
SMTP_SERVICE=gmail
SMTP_USER=tu-remitente@gmail.com
SMTP_PASSWORD=CONTRASENA_DE_APLICACION
SMTP_FROM="SUMA <tu-remitente@gmail.com>"
```

La contraseña del proveedor no es la de PostgreSQL ni la contraseña de acceso a SUMA.
No se necesita escribirla en el chat. `npm run mail:verify` desde `backend` comprueba conexión y
autenticación, pero no demuestra llegada a la bandeja ni la meta de 60 segundos (RNF-14).

## Otros proveedores

| Configuración | Conexión |
| --- | --- |
| `SMTP_SERVICE=gmail` | smtp.gmail.com:465, TLS implícito |
| `SMTP_SERVICE=yahoo` | smtp.mail.yahoo.com:465, TLS implícito; credencial autorizada por Yahoo |
| `SMTP_SERVICE=microsoft365` | smtp.office365.com:587, STARTTLS; SMTP AUTH debe estar habilitado y autorizado |
| `SMTP_HOST=…` sin servicio | SMTP personalizado: por defecto 587/STARTTLS obligatorio; 465 usa TLS implícito |
| localhost/127.0.0.1, puerto 1025 | Capturador local de pruebas; no entrega en Internet |

Los perfiles solo definen host, puerto y TLS. No crean cuentas ni habilitan autenticación en el proveedor.
Se admite `SMTP_AUTH_TYPE=oauth2`, `SMTP_USER` y `SMTP_ACCESS_TOKEN` para un token emitido por el proveedor;
su obtención y renovación se realizan externamente. No hay consentimiento OAuth ni renovación automática
genérica en SUMA. Si usas un host explícito, elimina las variables de un proveedor anterior que no apliquen.

`SMTP_SECURE=true` corresponde al puerto 465. En 587 se usa `false` y `SMTP_REQUIRE_TLS=true`.
No se desactiva la validación de certificados. El remitente debe estar autorizado por el proveedor;
no basta con poner un `SMTP_FROM` inventado.

## Correo de la cuenta administradora

Para cambiar de forma explícita una cuenta existente, sin redirigir mensajes de todos los usuarios:

```powershell
cd backend
$env:ADMIN_CURRENT_EMAIL='admin@suma.ec'
$env:ADMIN_EMAIL='nixx2409@gmail.com'
npm.cmd run admin:email
```

Conserva la contraseña y el estado de confirmación, actualiza el cifrado y los índices, registra el cambio
y revoca sesiones y desafíos previos. Exige que la cuenta actual tenga alcance global y no ocupa un correo
de otra persona. Es una herramienta de administración local, no un endpoint público ni un atajo al 2FA.

## Evidencia de cierre

- `npm run test:correo`: configuración/TLS/reintentos y protocolo SMTP local con API y PostgreSQL aislado.
- Verificar después con el proveedor real: 2FA (5 min), recuperación (30 min), confirmación (10 min),
  activación de cuenta interna (24 h) y cambio de correo; comprobar destinatario y un solo uso.
- Anotar hora de solicitud y recepción en bandeja, sin registrar códigos o enlaces. RNF-14 exige 60 segundos.
- Los reintentos son en memoria: hasta tres cada cinco minutos mientras el mensaje siga vigente;
  se pierden si se reinicia el backend. Un código de 2FA de cinco minutos no se reenvía vencido.

Fuentes técnicas: [SMTP de Nodemailer](https://nodemailer.com/smtp),
[OAuth2 de Nodemailer](https://nodemailer.com/smtp/oauth2),
[contraseñas de aplicación de Google](https://support.google.com/accounts/answer/185833?hl=es).
