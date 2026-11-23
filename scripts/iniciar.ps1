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

# Reutiliza SUMA si ya esta activa; nunca detiene un proceso ajeno.
function Test-SumaActiva([int]$puerto) {
    $cliente = New-Object System.Net.Sockets.TcpClient
    try {
        $conexion = $cliente.ConnectAsync('127.0.0.1', $puerto)
        try { $conectado = $conexion.Wait(2000) -and $cliente.Connected } catch { $conectado = $false }
        if (-not $conectado) { return $false }
    } finally { $cliente.Dispose() }
    try {
        $salud = Invoke-RestMethod -Uri "http://127.0.0.1:$puerto/api/health" -TimeoutSec 5
        if ($salud.status -eq 'ok' -and $salud.app -eq 'SUMA' -and $salud.database -eq 'PostgreSQL') { return $true }
    } catch {}
    throw "El puerto $puerto esta ocupado, pero no responde como SUMA saludable. Revisa la aplicacion que usa ese puerto antes de volver a iniciar."
}

$procesos = @()
try {
    $node = (Get-Command node -ErrorAction Stop).Source
    if ([int]((& $node --version).TrimStart('v').Split('.')[0]) -lt 24) { throw 'SUMA necesita Node.js 24 o superior.' }
    $logs = Join-Path $raiz '.local'
    New-Item -ItemType Directory -Path $logs -Force | Out-Null

    $backendActivo = $false
    $frontendActivo = $false
    if ($Modo -in 'Todo', 'Backend') { $backendActivo = Test-SumaActiva 3000 }
    if ($Modo -in 'Todo', 'Frontend') { $frontendActivo = Test-SumaActiva $PuertoWeb }
    if ($backendActivo) { Write-Host 'El backend SUMA ya esta activo en el puerto 3000; se reutiliza.' }
    if ($frontendActivo) { Write-Host "La web SUMA ya esta activa en el puerto $PuertoWeb; se reutiliza." }

    if (($Modo -in 'Todo', 'Backend') -and -not $backendActivo) {
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
    if (($Modo -in 'Todo', 'Frontend') -and -not $frontendActivo) {
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
    Read-Host 'Pulsa Enter para cerrar (solo se detienen los servidores iniciados por esta ventana)'
} finally {
    foreach ($p in $procesos) { if ($p -and -not $p.HasExited) { Stop-Process -Id $p.Id -ErrorAction SilentlyContinue } }
}
