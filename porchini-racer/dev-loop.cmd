@echo off
REM Double-click friendly launcher — keeps the window open.
cd /d "%~dp0"
title Porchini Racer Dev Loop
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev-loop.ps1"
echo.
pause
