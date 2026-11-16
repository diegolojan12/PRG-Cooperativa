@echo off
setlocal
title Recuperar PostgreSQL y preparar SUMA
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0restablecer-postgresql.ps1"
if errorlevel 1 (
    echo.
    echo No se pudo completar la recuperacion. Revisa el mensaje anterior.
    pause
)
endlocal
