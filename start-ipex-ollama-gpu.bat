@echo off
setlocal

REM Force using ipex-llm bundled Ollama GPU runtime.
set "IPEX_OLLAMA_DIR=D:\AI\ollama-ipex-llm-2.3.0b20250725-win"
set "IPEX_OLLAMA_EXE=%IPEX_OLLAMA_DIR%\ollama.exe"

if not exist "%IPEX_OLLAMA_EXE%" (
  echo [ERROR] ipex-llm ollama.exe not found:
  echo         %IPEX_OLLAMA_EXE%
  exit /b 1
)

echo [INFO] Stopping existing ollama.exe processes...
taskkill /IM ollama.exe /F >nul 2>&1
taskkill /IM ollama-lib.exe /F >nul 2>&1

echo [INFO] Starting ipex-llm Ollama with Intel GPU settings...
set OLLAMA_INTEL_GPU=true
set OLLAMA_NUM_GPU=999
set OLLAMA_HOST=127.0.0.1:11434
set OLLAMA_KEEP_ALIVE=10m
set OLLAMA_NUM_PARALLEL=2
set no_proxy=localhost,127.0.0.1
set ZES_ENABLE_SYSMAN=1
set ONEAPI_DEVICE_SELECTOR=level_zero:0

cd /d "%IPEX_OLLAMA_DIR%"
"%IPEX_OLLAMA_EXE%" serve
