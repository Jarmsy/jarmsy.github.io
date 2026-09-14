@echo off
rem Double-click to check the whole site for mistakes. Read the last lines:
rem if something is wrong, the message names the file and what to fix.
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
if not exist node_modules (
  echo Installing packages for the first time...
  call npm install
)
call npm run doctor
echo.
if errorlevel 1 (
  echo ============================================================
  echo   Something needs fixing - see the message above.
  echo ============================================================
) else (
  echo ============================================================
  echo   All good. Every page built without errors.
  echo ============================================================
)
pause
