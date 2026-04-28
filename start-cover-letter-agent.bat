@echo off
setlocal

REM One-click launcher for Cover Letter Agent MVP-1
set "APP_URL=http://127.0.0.1:5173"
set "PROJECT_DIR=%~dp0"

echo Starting Ollama server (ipex GPU)...
start "Ollama Server (IPEX GPU)" cmd /k "cd /d ""%PROJECT_DIR%"" && start-ipex-ollama-gpu.bat"

timeout /t 4 /nobreak >nul

echo Starting local export helper...
start "Cover Letter Export Helper" cmd /k "cd /d ""%PROJECT_DIR%"" && npm.cmd run export-helper"

timeout /t 2 /nobreak >nul

echo Starting Vite dev server...
start "Cover Letter Agent Dev" cmd /k "cd /d ""%PROJECT_DIR%"" && npm.cmd run dev"

timeout /t 6 /nobreak >nul

echo Opening browser: %APP_URL%
start "" "%APP_URL%"

endlocal
