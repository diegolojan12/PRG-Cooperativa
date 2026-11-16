param(
    [string]$UsuarioAdmin = 'postgres',
    [switch]$SoloDiagnostico
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $raiz 'backend'
$comprobar = Join-Path $PSScriptRoot 'comprobar-postgresql.mjs'
if (-not (Test-Path -LiteralPath (Join-Path $backend '.env'))) {
    throw 'Falta backend/.env. Copia backend/.env.example a backend/.env y revisa DATABASE_URL.'
}

$adminAnterior = [Environment]::GetEnvironmentVariable('PGADMIN_URL', 'Process')
$claveSegura = $null
Push-Location -LiteralPath $backend
try {
    $salida = & node --env-file=.env $comprobar --destino
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo leer DATABASE_URL de backend/.env.' }
    $destino = ($salida -join "`n") | ConvertFrom-Json
    Write-Host "Destino: base $($destino.base), usuario $($destino.usuario), servidor $($destino.host):$($destino.puerto)."

    $salida = & node --env-file=.env $comprobar
    $estado = ($salida -join "`n") | ConvertFrom-Json
    if ($SoloDiagnostico) {
        if ($estado.ok) { Write-Host 'Conexion PostgreSQL correcta.' -ForegroundColor Green }
        else { Write-Host "PostgreSQL: $($estado.codigo) - $($estado.mensaje)" -ForegroundColor Yellow }
        return
    }

    if (-not $estado.ok) {
        if ($estado.codigo -notin @('28P01', '28000', '3D000')) {
            throw "No se puede preparar la base: $($estado.codigo) - $($estado.mensaje). Comprueba que PostgreSQL este iniciado y el host/puerto sean correctos."
        }
        Write-Host 'SUMA necesita crear su usuario/base o revisar las credenciales.' -ForegroundColor Yellow
        if (-not $adminAnterior) {
            $claveSegura = Read-Host "Contrasena de PostgreSQL del administrador $UsuarioAdmin (no es la clave de SUMA)" -AsSecureString
            if ($claveSegura.Length -eq 0) { throw 'No se ingreso la contrasena de administracion.' }
            $credencial = New-Object System.Net.NetworkCredential($UsuarioAdmin, $claveSegura)
            $claveUrl = [Uri]::EscapeDataString($credencial.Password)
            $usuarioUrl = [Uri]::EscapeDataString($UsuarioAdmin)
            $servidor = [string]$destino.host
            if ($servidor.Contains(':') -and -not $servidor.StartsWith('[')) { $servidor = "[$servidor]" }
            $env:PGADMIN_URL = "postgresql://${usuarioUrl}:${claveUrl}@${servidor}:$($destino.puerto)/postgres"
            $credencial = $null
            $claveUrl = $null
        }
        & npm.cmd run db:crear
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear el usuario/base. Revisa el error anterior y la contrasena del administrador PostgreSQL.' }
        $salida = & node --env-file=.env $comprobar
        $estado = ($salida -join "`n") | ConvertFrom-Json
        if (-not $estado.ok) {
            throw "La conexion sigue fallando: $($estado.codigo) - $($estado.mensaje). Si el usuario ya existia, su clave no se modifica automaticamente: revisa DATABASE_URL."
        }
    }
    & npm.cmd run db:init
    if ($LASTEXITCODE -ne 0) { throw 'La conexion funciona, pero fallaron las migraciones. Revisa el error anterior.' }
    Write-Host 'PostgreSQL de SUMA esta preparado.' -ForegroundColor Green
}
finally {
    if ($null -eq $adminAnterior) { Remove-Item Env:PGADMIN_URL -ErrorAction SilentlyContinue }
    else { $env:PGADMIN_URL = $adminAnterior }
    if ($null -ne $claveSegura) { $claveSegura.Dispose() }
    $credencial = $null
    $claveUrl = $null
    Pop-Location
}
