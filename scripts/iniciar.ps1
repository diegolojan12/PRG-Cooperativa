$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
try {
    $nodeCommand = (Get-Command node -ErrorAction Stop).Source
    $major = [int]((& $nodeCommand --version).TrimStart('v').Split('.')[0])
    if ($major -lt 24) { throw 'SUMA necesita Node.js 24 o superior.' }
    if (-not (Test-Path -LiteralPath 'backend/.env')) { Copy-Item -LiteralPath 'backend/.env.example' -Destination 'backend/.env' }
    foreach ($part in @('backend', 'frontend')) {
        if (-not (Test-Path -LiteralPath "$part/node_modules")) {
            Write-Host "Instalando dependencias de $part..."
            & npm.cmd ci --prefix $part
            if ($LASTEXITCODE -ne 0) { throw "No se pudieron instalar las dependencias de $part." }
        }
    }
    Write-Host 'Compilando SUMA...'
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'La compilacion fallo. Revisa el mensaje anterior.' }
    $logRoot = Join-Path $projectRoot '.local'
    New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
    foreach ($service in @(@{Port=3000;Name='API'}, @{Port=4200;Name='Web'})) {
        $probe = [Net.Sockets.TcpClient]::new()
        try { $probe.Connect('127.0.0.1', $service.Port); throw "El puerto $($service.Port) ya esta en uso. Cierra la instancia anterior de SUMA antes de iniciar." }
        catch [Net.Sockets.SocketException] {} finally { $probe.Dispose() }
    }
    $apiProcess = Start-Process -FilePath $nodeCommand -ArgumentList '--env-file=.env', 'dist/main.js' -WorkingDirectory (Join-Path $projectRoot 'backend') -RedirectStandardOutput (Join-Path $logRoot 'api.log') -RedirectStandardError (Join-Path $logRoot 'api-error.log') -WindowStyle Hidden -PassThru
    $webProcess = Start-Process -FilePath $nodeCommand -ArgumentList 'node_modules/@angular/cli/bin/ng.js', 'serve', '--host', '127.0.0.1', '--port', '4200' -WorkingDirectory (Join-Path $projectRoot 'frontend') -RedirectStandardOutput (Join-Path $logRoot 'web.log') -RedirectStandardError (Join-Path $logRoot 'web-error.log') -WindowStyle Hidden -PassThru
    Write-Host 'Esperando al servidor...'
    $ready = $false
    for ($attempt=0; $attempt -lt 60; $attempt++) {
        if ($apiProcess.HasExited -or $webProcess.HasExited) { throw 'Un servidor no pudo iniciar. Revisa los archivos de .local.' }
        try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:4200/api/health' -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -eq 200) { $ready=$true; break } } catch {}
        Start-Sleep -Seconds 1
    }
    if (-not $ready) { throw 'El inicio esta tardando mas de lo esperado. Revisa .local/web.log y .local/api-error.log.' }
    Start-Process 'http://localhost:4200/internas/iniciar-sesion.html'
    Write-Host 'SUMA esta lista en http://localhost:4200'
    Write-Host 'Administrador: admin@suma.ec | Socio: socio@suma.ec'
    Write-Host 'Clave de prueba: Suma2026!'
    Read-Host 'Pulsa Enter para detener los servidores de esta sesion'
} finally {
    if ($webProcess -and -not $webProcess.HasExited) { Stop-Process -Id $webProcess.Id -ErrorAction SilentlyContinue }
    if ($apiProcess -and -not $apiProcess.HasExited) { Stop-Process -Id $apiProcess.Id -ErrorAction SilentlyContinue }
}
