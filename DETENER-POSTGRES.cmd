@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\postgresql-local.ps1" -Detener
if errorlevel 1 pause
