@echo off
title WeatherGPT Launcher - SIH 2026
color 0E

echo ========================================================
echo        STARTING WEATHERGPT INTELLIGENCE WORKSPACE
echo ========================================================
echo.

:: 1. Start FastAPI Backend in background
echo [1/2] Starting FastAPI Backend (Port 8000)...
start "WeatherGPT Backend" powershell -ExecutionPolicy Bypass -NoExit -Command "cd '%~dp0backend'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload"

:: 2. Wait 2 seconds
timeout /t 2 /nobreak > nul

:: 3. Start Vite Frontend in background
echo [2/2] Starting Vite Frontend (Port 5173)...
start "WeatherGPT Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: 4. Open default browser to localhost
echo.
echo Launching WeatherGPT in default browser...
timeout /t 2 /nobreak > nul
start http://localhost:5173

echo.
echo ========================================================
echo    WeatherGPT Workspace is now running and live!
echo ========================================================