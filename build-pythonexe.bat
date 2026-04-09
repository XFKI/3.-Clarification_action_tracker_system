@echo off
setlocal EnableExtensions

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"
set "APP_EXE_NAME=EngineeringClosureTracker"
set "ICON_DIR=%ROOT_DIR%assets\icons"
set "ICON_PATH=%ICON_DIR%\engineering_closure_tracker.ico"
set "ICON_GEN_SCRIPT=%ROOT_DIR%scripts\generate-exe-icon.ps1"

set "VENV_PY=%ROOT_DIR%.venv\Scripts\python.exe"
if exist "%VENV_PY%" (
  set "PY_CMD=%VENV_PY%"
) else (
  set "PY_CMD=python"
)

echo [build-pythonexe] Using Python: %PY_CMD%

"%PY_CMD%" -m pip show pyinstaller >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [build-pythonexe] Installing PyInstaller...
  "%PY_CMD%" -m pip install pyinstaller
  if %ERRORLEVEL% neq 0 (
    echo [build-pythonexe] Failed to install PyInstaller.
    exit /b 1
  )
)

if not exist "%ICON_DIR%" mkdir "%ICON_DIR%" >nul 2>nul
if not exist "%ICON_PATH%" (
  echo [build-pythonexe] Generating EXE icon: %ICON_PATH%
  powershell -NoProfile -ExecutionPolicy Bypass -File "%ICON_GEN_SCRIPT%" -OutputPath "%ICON_PATH%"
  if %ERRORLEVEL% neq 0 (
    echo [build-pythonexe] Failed to generate icon.
    exit /b 1
  )
)

if exist "dist\%APP_EXE_NAME%.exe" del /q "dist\%APP_EXE_NAME%.exe" >nul 2>nul

echo [build-pythonexe] Building one-file executable...
"%PY_CMD%" -m PyInstaller --noconfirm --clean --onefile --name "%APP_EXE_NAME%" --icon "%ICON_PATH%" --hidden-import sqlite3 --hidden-import _sqlite3 --hidden-import fitz --collect-all pymupdf --add-data "index.html;." --add-data "assets;assets" --add-data "backend;backend" app_launcher.py
if %ERRORLEVEL% neq 0 (
  echo [build-pythonexe] Build failed.
  exit /b 1
)

echo [build-pythonexe] Build success: %ROOT_DIR%dist\%APP_EXE_NAME%.exe
echo [build-pythonexe] Run it directly by double-clicking EXE.
exit /b 0
