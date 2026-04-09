@echo off
setlocal EnableExtensions

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"
set "APP_EXE_NAME=EngineeringClosureTracker"

call .\build-pythonexe.bat
if %ERRORLEVEL% neq 0 exit /b 1

set "PACKAGE_DIR=%ROOT_DIR%portable-package"
if not exist "%PACKAGE_DIR%" mkdir "%PACKAGE_DIR%" >nul 2>nul

for /f %%I in ('powershell -NoProfile -Command "(Get-Date).ToString('yyyyMMdd-HHmmss')"') do set "TS=%%I"
if not defined TS set "TS=latest"

set "ZIP_FILE=%PACKAGE_DIR%\EngineeringClosureTracker-EXE-%TS%.zip"

echo [quick-package-exe] Creating zip package...
powershell -NoProfile -Command "Compress-Archive -Path 'dist\%APP_EXE_NAME%.exe' -DestinationPath '%ZIP_FILE%' -Force"
if %ERRORLEVEL% neq 0 (
  echo [quick-package-exe] Packaging failed.
  exit /b 1
)

echo [quick-package-exe] Package ready: %ZIP_FILE%
echo [quick-package-exe] One-click run: open %APP_EXE_NAME%.exe
exit /b 0
