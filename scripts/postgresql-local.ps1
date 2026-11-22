param([switch]$Detener)
$ErrorActionPreference = 'Stop'
$pgRoot = Join-Path (Split-Path -Parent $PSScriptRoot) '.local\postgresql'
$pgCtl = Join-Path $pgRoot 'pgsql\bin\pg_ctl.exe'
$data = Join-Path $pgRoot 'data'
if (-not (Test-Path -LiteralPath $pgCtl) -or -not (Test-Path -LiteralPath (Join-Path $data 'PG_VERSION'))) {
    throw 'No se encuentra la instalacion local de PostgreSQL en .local\postgresql.'
}
if ($Detener) {
    & $pgCtl -D $data -m fast -w stop
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo detener PostgreSQL.' }
    return
}
# Comprueba la conexion, tambien desde procesos con acceso limitado al sistema.
& (Join-Path $pgRoot 'pgsql\bin\pg_isready.exe') -h localhost -p 5432 -t 3 *> $null
$activo = $LASTEXITCODE -eq 0
if (-not $activo) {
    $argsPg = @('-D', ('"' + $data + '"'), '-l', ('"' + (Join-Path $pgRoot 'postgresql.log') + '"'), '-w', 'start')
    $proceso = Start-Process -FilePath $pgCtl -ArgumentList $argsPg -WindowStyle Hidden -PassThru
    $proceso.WaitForExit()
    if ($proceso.ExitCode -ne 0) { throw 'No se pudo iniciar PostgreSQL. Revisa .local\postgresql\postgresql.log.' }
}
Write-Host 'PostgreSQL local disponible en localhost:5432.'