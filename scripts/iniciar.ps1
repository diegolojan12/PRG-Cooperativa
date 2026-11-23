# Inicia SUMA sin Docker. Requiere Node.js 24+ y un PostgreSQL ya instalado.
#   .\scripts\iniciar.ps1                     -> backend y web en este equipo
#   .\scripts\iniciar.ps1 -Modo Backend       -> solo el backend (PC del servidor)
#   .\scripts\iniciar.ps1 -Modo Frontend -BackendUrl http://192.168.1.20:3000   -> solo la web (otra PC)
param(
    [ValidateSet('Todo', 'Backend', 'Frontend')][string]$Modo = 'Todo',
    [string]$BackendUrl = 'http://localhost:3000',
    [int]$PuertoWeb = 4200,
    [switch]$CorreoReal
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

<<<<<<< HEAD
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
=======
function Preparar-CorreoReal {
    $archivo = Join-Path $raiz 'backend/.env'
    $estado = & $node --env-file=$archivo -p 'JSON.stringify({ smtp: Boolean(process.env.SMTP_SERVICE || process.env.SMTP_HOST), demo: process.env.NODE_ENV !== ''production'' && process.env.SEED_DEMO === ''true'', destino: process.env.SUMA_ADMIN_DEMO_EMAIL?.trim() })'
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo leer la configuracion de correo.' }
    $estado = $estado | ConvertFrom-Json
    if ($estado.smtp) {
        & npm.cmd run mail:verify --prefix backend
        if ($LASTEXITCODE -ne 0) {
            $reconfigurar = Read-Host 'SMTP no verifico. Deseas volver a configurar un remitente Gmail? [s/N]'
            if ($reconfigurar -notmatch '^(s|si)$') {
                throw 'Corrige la configuracion SMTP en backend/.env y vuelve a iniciar.'
            }
            & (Join-Path $PSScriptRoot 'configurar-correo.ps1')
        }
    } else {
        & (Join-Path $PSScriptRoot 'configurar-correo.ps1')
    }
    if ($estado.demo -and -not $estado.destino) {
        $destino = (Read-Host 'Correo que recibira el codigo del administrador de prueba').Trim().ToLowerInvariant()
        if ($destino.Length -gt 254 -or $destino -notmatch '^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$' -or $destino -eq 'admin@suma.ec') {
            throw 'Ingresa un correo real para recibir el codigo; admin@suma.ec es una cuenta de prueba.'
        }
        [IO.File]::AppendAllText($archivo, "`r`nSUMA_ADMIN_DEMO_EMAIL=$destino`r`n")
    } elseif ($estado.demo -and $estado.destino -eq 'admin@suma.ec') {
        throw 'Configura SUMA_ADMIN_DEMO_EMAIL con una bandeja real; admin@suma.ec es una cuenta de prueba.'
    }
>>>>>>> cbf663aa25cbc7b3a810de68c9a3619cfa5ab168
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
            Write-Host 'Se creo backend/.env con la conexion predeterminada a PostgreSQL local.'
            if (-not $CorreoReal) { exit 1 }
        }
        Instalar-Y-Compilar 'backend'
        Write-Host 'Comprobando y preparando PostgreSQL...'
        & (Join-Path $PSScriptRoot 'preparar-postgresql.ps1')
        if ($CorreoReal) { Preparar-CorreoReal }
        & npm.cmd run admin:email --prefix backend -- --laboratorio
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar el correo del administrador local. Revisa SUMA_ADMIN_DEMO_EMAIL en backend/.env.' }
        $modoCorreoAnterior = [Environment]::GetEnvironmentVariable('ENABLE_DEV_RESET_LINK', 'Process')
        try {
            if ($CorreoReal) { $env:ENABLE_DEV_RESET_LINK = 'false' }
            $procesos += Start-Process -FilePath $node -ArgumentList '--env-file=.env', 'dist/main.js' -WorkingDirectory (Join-Path $raiz 'backend') `
                -RedirectStandardOutput (Join-Path $logs 'api.log') -RedirectStandardError (Join-Path $logs 'api-error.log') -WindowStyle Hidden -PassThru
        } finally {
            [Environment]::SetEnvironmentVariable('ENABLE_DEV_RESET_LINK', $modoCorreoAnterior, 'Process')
        }
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
<<<<<<< HEAD
    Write-Host 'Cuentas de prueba (clave Suma2026!): admin@suma.ec | gestor@suma.ec | socio@suma.ec'
    Read-Host 'Pulsa Enter para cerrar (solo se detienen los servidores iniciados por esta ventana)'
=======
    Write-Host 'Cuentas de prueba (clave inicial Suma2026!): gestor@suma.ec | socio@suma.ec'
    Write-Host 'Administrador de prueba: admin@suma.ec o el correo configurado en SUMA_ADMIN_DEMO_EMAIL.'
    Read-Host 'Pulsa Enter para detener los servidores de esta sesion'
>>>>>>> cbf663aa25cbc7b3a810de68c9a3619cfa5ab168
} finally {
    foreach ($p in $procesos) { if ($p -and -not $p.HasExited) { Stop-Process -Id $p.Id -ErrorAction SilentlyContinue } }
}
