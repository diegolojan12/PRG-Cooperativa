# Inicia SUMA sin Docker. Requiere Node.js 24+ y un PostgreSQL ya instalado.
#   .\scripts\iniciar.ps1                     -> backend y web en este equipo
#   .\scripts\iniciar.ps1 -Modo Backend       -> solo el backend (PC del servidor)
#   .\scripts\iniciar.ps1 -Modo Frontend -BackendUrl http://192.168.1.20:3000   -> solo la web (otra PC)
param(
    [ValidateSet('Todo', 'Backend', 'Frontend')][string]$Modo = 'Todo',
    [string]$BackendUrl = 'http://localhost:3000',
    [int]$PuertoWeb = 4200
)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $raiz

function Instalar-Y-Compilar([string]$parte) {
    if (-not (Test-Path -LiteralPath "$parte/node_modules")) {
        Write-Host "Instalando dependencias de $parte..."
        & npm.cmd ci --prefix $parte
        if ($LASTEXITCODE -ne 0) { throw "No se pudieron instalar las dependencias de $parte." }
    }
    Write-Host "Compilando $parte..."
    & npm.cmd run build --prefix $parte
    if ($LASTEXITCODE -ne 0) { throw "La compilacion de $parte fallo. Revisa el mensaje anterior." }
}

$procesos = @()
try {
    $node = (Get-Command node -ErrorAction Stop).Source
    if ([int]((& $node --version).TrimStart('v').Split('.')[0]) -lt 24) { throw 'SUMA necesita Node.js 24 o superior.' }
    $logs = Join-Path $raiz '.local'
    New-Item -ItemType Directory -Path $logs -Force | Out-Null

    if ($Modo -in 'Todo', 'Backend') {
        if (-not (Test-Path -LiteralPath 'backend/.env')) {
            Copy-Item -LiteralPath 'backend/.env.example' -Destination 'backend/.env'
            Write-Host 'Se creo backend/.env. Revisa DATABASE_URL (PostgreSQL) y vuelve a ejecutar.'
            exit 1
        }
        Instalar-Y-Compilar 'backend'
        Write-Host 'Comprobando y preparando PostgreSQL...'
        & (Join-Path $PSScriptRoot 'preparar-postgresql.ps1')
        $procesos += Start-Process -FilePath $node -ArgumentList '--env-file=.env', 'dist/main.js' -WorkingDirectory (Join-Path $raiz 'backend') `
            -RedirectStandardOutput (Join-Path $logs 'api.log') -RedirectStandardError (Join-Path $logs 'api-error.log') -WindowStyle Hidden -PassThru
    }
    if ($Modo -in 'Todo', 'Frontend') {
        Instalar-Y-Compilar 'frontend'
        $env:PORT = "$PuertoWeb"; $env:BACKEND_URL = $BackendUrl
        $procesos += Start-Process -FilePath $node -ArgumentList 'servidor.mjs' -WorkingDirectory (Join-Path $raiz 'frontend') `
            -RedirectStandardOutput (Join-Path $logs 'web.log') -RedirectStandardError (Join-Path $logs 'web-error.log') -WindowStyle Hidden -PassThru
    }

    Write-Host 'Esperando a los servidores...'
    $url = "http://127.0.0.1:$PuertoWeb/api/health"
    if ($Modo -eq 'Backend') { $url = 'http://127.0.0.1:3000/api/health' }
    $listo = $false
    for ($i = 0; $i -lt 90; $i++) {
        if ($procesos | Where-Object { $_.HasExited }) { throw 'Un servidor no pudo iniciar. Revisa los archivos de la carpeta .local.' }
        try { if ((Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200) { $listo = $true; break } } catch {}
        Start-Sleep -Seconds 1
    }
    if (-not $listo) { throw 'El inicio tarda mas de lo esperado. Revisa .local/api-error.log y .local/web-error.log.' }

    if ($Modo -ne 'Backend') { Start-Process "http://localhost:$PuertoWeb" }
    Write-Host "SUMA esta lista ($Modo)."
    if ($Modo -ne 'Backend') { Write-Host "Web: http://localhost:$PuertoWeb" }
    Write-Host 'Cuentas de prueba (clave Suma2026!): admin@suma.ec | gestor@suma.ec | socio@suma.ec'
    Read-Host 'Pulsa Enter para detener los servidores de esta sesion'
} finally {
    foreach ($p in $procesos) { if ($p -and -not $p.HasExited) { Stop-Process -Id $p.Id -ErrorAction SilentlyContinue } }
}
