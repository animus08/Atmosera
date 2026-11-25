@echo off
title Atmosera Workspace Launcher
color 0B

echo ========================================================
echo        STARTING ATMOSERA INTELLIGENCE WORKSPACE
echo ========================================================
echo.

:: 1. Start FastAPI Backend in background
echo [1/2] Starting FastAPI Backend (Port 8000)...
start "Atmosera Backend" powershell -ExecutionPolicy Bypass -NoExit -Command "cd '%~dp0backend'; .\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --reload --port 8000"

:: 2. Wait 2 seconds
timeout /t 2 /nobreak > nul

:: 3. Start Vite Frontend in background
echo [2/2] Starting Vite Frontend (Port 5173)...
start "Atmosera Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: 4. Open default browser to localhost
echo.
echo Launching Atmosera in default browser...
timeout /t 2 /nobreak > nul
start http://localhost:5173

echo.
echo ========================================================
echo     Atmosera Workspace is now running and live!
echo ========================================================
