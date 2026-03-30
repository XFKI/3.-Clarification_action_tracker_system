@echo off
setlocal EnableExtensions

set "PORT=5500"
if not "%~1"=="" set "PORT=%~1"

echo [quick-stop] Stopping backend on port %PORT% ...
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$c=Get-NetTCPConnection -State Listen -LocalPort %PORT% -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess; if($c){$c}"`) do set "PID=%%P"

if not defined PID (
  echo [quick-stop] No listening process found on port %PORT%.
  goto :eof
)

taskkill /PID %PID% /F >nul 2>nul
if %ERRORLEVEL%==0 (
  echo [quick-stop] Stopped PID %PID% on port %PORT%.
) else (
  echo [quick-stop] Failed to stop PID %PID%. Try running as a user with permission.
)
