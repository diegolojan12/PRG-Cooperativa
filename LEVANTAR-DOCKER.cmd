@echo off
cd /d "%~dp0"
docker compose -p prg-cooperativa -f docker-compose.yml -f docker-compose.local.yml up -d --build
if errorlevel 1 (
  echo No se pudo levantar SUMA. Revisa que Docker Desktop este abierto.
  pause
  exit /b 1
)
echo.
echo SUMA en Docker: http://localhost:8080/internas/iniciar-sesion.html
echo Administrador: admin@suma.ec - Socio: socio@suma.ec
echo Clave de prueba: Suma2026!
start "" "http://localhost:8080/internas/iniciar-sesion.html"
pause
