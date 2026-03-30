@echo off
setlocal EnableExtensions

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

set "MODE=prod"

if /I "%~1"=="--help" goto :help
if /I "%~1"=="-h" goto :help
if /I "%~1"=="--preview" set "MODE=preview"

where npx >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [quick-deploy-vercel] npx not found. Please install Node.js first.
  exit /b 1
)

echo [quick-deploy-vercel] Root: %ROOT_DIR%

if /I "%MODE%"=="preview" (
  echo [quick-deploy-vercel] Deploying preview...
  if defined VERCEL_TOKEN (
    call npx vercel --yes --token "%VERCEL_TOKEN%"
  ) else (
    call npx vercel --yes
  )
) else (
  echo [quick-deploy-vercel] Deploying production...
  if defined VERCEL_TOKEN (
    call npx vercel --prod --yes --token "%VERCEL_TOKEN%"
  ) else (
    call npx vercel --prod --yes
  )
)

exit /b %ERRORLEVEL%

:help
echo Usage: quick-deploy-vercel.bat [--preview]
echo   --preview   Deploy preview instead of production
echo.
echo Optional env:
echo   VERCEL_TOKEN   Use token-based auth (CI/headless)
exit /b 0
