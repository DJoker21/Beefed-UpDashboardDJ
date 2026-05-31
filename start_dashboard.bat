@echo off
title Bonsmara Dashboard Launcher

echo Starting Backend...
start "Backend" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate && python -m uvicorn main:app --reload"

timeout /t 5 >nul

echo Starting Frontend...
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 10 >nul

start http://localhost:3000

echo Dashboard launched.