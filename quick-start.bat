@echo off
setlocal EnableExtensions

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

set "PORT=5500"
set "MODE=backend"

if not "%~1"=="" (
  echo %~1| findstr /r "^[0-9][0-9]*$" >nul && (
    set "PORT=%~1"
    set "MODE=backend"
  )
  if /I "%~1"=="--file" set "MODE=file"
  if /I "%~1"=="--serve" (
    set "MODE=backend"
    if not "%~2"=="" set "PORT=%~2"
  )
)

set "URL=http://127.0.0.1:%PORT%/index.html"
set "VENV_PY=%ROOT_DIR%.venv\Scripts\python.exe"

echo [quick-start] Root: %ROOT_DIR%

if /I "%MODE%"=="file" (
  echo [quick-start] Opening local file directly...
  start "" "%ROOT_DIR%index.html"
  echo [quick-start] Tip: use "quick-start.bat --serve 5500" to enable local backend DB mode.
  goto :eof
)

echo [quick-start] Backend mode (detached) at %URL%

powershell -NoProfile -Command "if(Get-NetTCPConnection -State Listen -LocalPort %PORT% -ErrorAction SilentlyContinue){exit 0}else{exit 1}" >nul 2>nul
if %ERRORLEVEL%==0 (
  echo [quick-start] Backend already listening on port %PORT%.
  start "" "%URL%"
  goto :eof
)

if exist "%VENV_PY%" (
  powershell -NoProfile -Command "Start-Process -FilePath '%VENV_PY%' -ArgumentList @('backend\\server.py','--port','%PORT%') -WindowStyle Hidden"
  timeout /t 1 >nul
  start "" "%URL%"
  goto :eof
)

where py >nul 2>nul
if %ERRORLEVEL%==0 (
  powershell -NoProfile -Command "Start-Process -FilePath 'py' -ArgumentList @('-3','backend\\server.py','--port','%PORT%') -WindowStyle Hidden"
  timeout /t 1 >nul
  start "" "%URL%"
  goto :eof
)

where python >nul 2>nul
if %ERRORLEVEL%==0 (
  powershell -NoProfile -Command "Start-Process -FilePath 'python' -ArgumentList @('backend\\server.py','--port','%PORT%') -WindowStyle Hidden"
  timeout /t 1 >nul
  start "" "%URL%"
  goto :eof
)

echo [quick-start] Python not found. Falling back to index.html (no backend DB mode)...
start "" "%ROOT_DIR%index.html"
