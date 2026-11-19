# Configura Gmail en el .env local sin mostrar ni guardar la clave en el historial.
param([string]$Remitente)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
if (-not $Remitente) { $Remitente = Read-Host 'Cuenta Gmail que enviara los correos de SUMA' }
if ($Remitente -notmatch '^[a-zA-Z0-9._+-]+@gmail\.com$') { throw 'Ingresa una cuenta Gmail valida para este asistente.' }
$clave = Read-Host 'Contrasena de aplicacion de Google (oculta)' -AsSecureString
if ($clave.Length -eq 0) { throw 'No se ingreso la contrasena de aplicacion.' }
$archivo = Join-Path $raiz 'backend/.env'
if (-not (Test-Path -LiteralPath $archivo)) { throw 'Falta backend/.env.' }
Push-Location -LiteralPath (Join-Path $raiz 'backend')
try {
    $credencial = New-Object System.Net.NetworkCredential($Remitente, $clave)
    $valorClave = $credencial.Password.Replace(' ', '')
    if ($valorClave -notmatch '^[a-zA-Z0-9]{16}$') { throw 'La contrasena de aplicacion debe tener 16 caracteres (sin espacios).' }
    $contenido = [IO.File]::ReadAllText($archivo)
    $cambios = [ordered]@{
        SMTP_SERVICE = 'gmail'; SMTP_HOST = ''; SMTP_PORT = '465'; SMTP_SECURE = 'true';
        SMTP_REQUIRE_TLS = 'true'; SMTP_AUTH_TYPE = 'login'; SMTP_ACCESS_TOKEN = '';
        SMTP_USER = $Remitente.ToLowerInvariant(); SMTP_PASSWORD = $valorClave;
        SMTP_FROM = "SUMA <$($Remitente.ToLowerInvariant())>"
    }
    foreach ($nombre in $cambios.Keys) {
        $linea = $nombre + '="' + $cambios[$nombre] + '"'
        $patron = '(?m)^' + [regex]::Escape($nombre) + '=.*\r?$'
        if ([regex]::IsMatch($contenido, $patron)) { $contenido = [regex]::Replace($contenido, $patron, $linea) }
        else { $contenido += "`r`n$linea" }
    }
    [IO.File]::WriteAllText($archivo, $contenido, [Text.UTF8Encoding]::new($false))
    Write-Host 'Configuracion local guardada. Verificando SMTP sin enviar mensajes...'
    & npm.cmd run mail:verify
    if ($LASTEXITCODE -ne 0) { throw 'La configuracion quedo guardada, pero SMTP no verifico. Revisa las credenciales y vuelve a ejecutar.' }
    $contenido = [IO.File]::ReadAllText($archivo)
    if ($contenido -match '(?m)^ENABLE_DEV_RESET_LINK=') {
        $contenido = [regex]::Replace($contenido, '(?m)^ENABLE_DEV_RESET_LINK=.*\r?$', 'ENABLE_DEV_RESET_LINK=false')
    } else { $contenido += "`r`nENABLE_DEV_RESET_LINK=false" }
    [IO.File]::WriteAllText($archivo, $contenido, [Text.UTF8Encoding]::new($false))
    Write-Host 'SMTP verificado; los codigos ya no se mostraran en pantalla. Reinicia el backend y prueba desde la web.'
} finally {
    $credencial = $null
    $valorClave = $null
    $clave.Dispose()
    Pop-Location
}
