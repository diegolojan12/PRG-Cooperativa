param(
    [string]$ArchivoResultado
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$data = 'C:\Program Files\PostgreSQL\16\data'
$hba = Join-Path $data 'pg_hba.conf'
$pgctl = 'C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe'
$helper = Join-Path $PSScriptRoot 'recuperacion-postgresql.mjs'
if (-not $ArchivoResultado) {
    $ArchivoResultado = Join-Path $raiz '.local\recuperacion-postgresql.json'
}
$identidad = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identidad)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host 'Windows solicitara permiso de administrador para recuperar PostgreSQL.'
    $argumentos = @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $PSCommandPath + '"'),'-ArchivoResultado',('"' + $ArchivoResultado + '"'))
    try {
        $elevado = Start-Process -FilePath powershell.exe -Verb RunAs -ArgumentList $argumentos -WindowStyle Normal -PassThru -ErrorAction Stop
        $elevado.WaitForExit()
    } catch {
        throw 'No se pudo obtener permiso de administrador. Abre PowerShell como administrador y ejecuta scripts\restablecer-postgresql.ps1.'
    }
    return
}

$original = $null
$modificado = $false
$clave = $null
$confirmacion = $null
$anteriorAdmin = [Environment]::GetEnvironmentVariable('PGADMIN_URL', 'Process')
$anteriorClave = [Environment]::GetEnvironmentVariable('SUMA_POSTGRES_NUEVA_CLAVE', 'Process')
$anteriorPuerto = [Environment]::GetEnvironmentVariable('SUMA_POSTGRES_PUERTO', 'Process')
$resultado = @{ok=$false; mensaje='Recuperacion no completada.'}
try {
    Write-Host 'Recuperacion local de PostgreSQL 16 y configuracion de SUMA.'
    Write-Host 'Elige una NUEVA contrasena para postgres. La anterior no hace falta.'
    $clave = Read-Host 'Nueva contrasena (minimo 12 caracteres)' -AsSecureString
    $confirmacion = Read-Host 'Repite la nueva contrasena' -AsSecureString
    $credencial = New-Object System.Net.NetworkCredential('postgres', $clave)
    $repetida = New-Object System.Net.NetworkCredential('postgres', $confirmacion)
    if ($clave.Length -lt 12) { throw 'La nueva contrasena necesita al menos 12 caracteres.' }
    if ($credencial.Password -cne $repetida.Password) { throw 'Las contrasenas no coinciden. Vuelve a ejecutar la recuperacion.' }
    $env:SUMA_POSTGRES_NUEVA_CLAVE = $credencial.Password
    $env:SUMA_POSTGRES_PUERTO = '5432'
    $env:PGADMIN_URL = 'postgresql://postgres:' + [Uri]::EscapeDataString($credencial.Password) + '@127.0.0.1:5432/postgres'
    $credencial = $null
    $repetida = $null

    $original = [IO.File]::ReadAllBytes($hba)
    $huellaOriginal = (Get-FileHash -LiteralPath $hba -Algorithm SHA256).Hash
    $backup = Join-Path $data 'pg_hba.conf.suma-recuperacion.bak'
    if (Test-Path -LiteralPath $backup) {
        if ((Get-FileHash -LiteralPath $backup -Algorithm SHA256).Hash -ne $huellaOriginal) {
            throw 'Ya existe un respaldo distinto de pg_hba.conf. Debe revisarse antes de continuar.'
        }
    } else {
        [IO.File]::WriteAllBytes($backup, $original)
    }
    $regla = "# Recuperacion temporal SUMA: solo postgres en la base postgres desde este equipo.`r`nhost postgres postgres 127.0.0.1/32 trust`r`nhost postgres postgres ::1/128 trust`r`n"
    $bytesRegla = [Text.Encoding]::ASCII.GetBytes($regla)
    $modificado = $true
    try {
        [IO.File]::WriteAllBytes($hba, [byte[]]($bytesRegla + $original))
        & $pgctl -D $data reload
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo recargar PostgreSQL. No se cambiara la contrasena.' }
        & node $helper
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo actualizar la contrasena de postgres.' }
    }
    finally {
        [IO.File]::WriteAllBytes($hba, $original)
        & $pgctl -D $data reload
        if ($LASTEXITCODE -ne 0) { throw "Se restauro pg_hba.conf, pero fallo su recarga. Reinicia el servicio PostgreSQL. Copia de respaldo: $backup" }
        if ((Get-FileHash -LiteralPath $hba -Algorithm SHA256).Hash -ne $huellaOriginal) { throw "No se pudo verificar la restauracion de pg_hba.conf. Respaldo: $backup" }
        $modificado = $false
    }
    & node $helper --verificar
    if ($LASTEXITCODE -ne 0) { throw 'La autenticacion normal fue restaurada, pero no se pudo verificar la nueva clave.' }
    & (Join-Path $PSScriptRoot 'preparar-postgresql.ps1')
    $resultado = @{ok=$true; mensaje='Clave restablecida, autenticacion restaurada y base SUMA preparada.'}
    Write-Host $resultado.mensaje -ForegroundColor Green
    Write-Host 'Guarda tu nueva clave de postgres. Ahora puedes ejecutar INICIAR-SUMA.cmd.'
}
catch {
    $resultado = @{ok=$false; mensaje=$_.Exception.Message}
    Write-Host $resultado.mensaje -ForegroundColor Red
}
finally {
    if ($modificado -and $null -ne $original) {
        [IO.File]::WriteAllBytes($hba, $original)
        & $pgctl -D $data reload
    }
    foreach ($nombre in @('PGADMIN_URL','SUMA_POSTGRES_NUEVA_CLAVE','SUMA_POSTGRES_PUERTO')) {
        $valor = switch ($nombre) {
            'PGADMIN_URL' { $anteriorAdmin }
            'SUMA_POSTGRES_NUEVA_CLAVE' { $anteriorClave }
            'SUMA_POSTGRES_PUERTO' { $anteriorPuerto }
        }
        if ($null -eq $valor) { Remove-Item -LiteralPath "Env:$nombre" -ErrorAction SilentlyContinue }
        else { [Environment]::SetEnvironmentVariable($nombre, $valor, 'Process') }
    }
    if ($null -ne $clave) { $clave.Dispose() }
    if ($null -ne $confirmacion) { $confirmacion.Dispose() }
    if ($ArchivoResultado) {
        New-Item -ItemType Directory -Path (Split-Path -Parent $ArchivoResultado) -Force | Out-Null
        $resultado.fecha = (Get-Date).ToString('o')
        $resultado | ConvertTo-Json | Set-Content -LiteralPath $ArchivoResultado -Encoding UTF8
    }
}
Read-Host 'Pulsa Enter para cerrar'
