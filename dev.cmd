@echo off
rem Double-click to preview the site. Leave this window open while you work;
rem the browser page refreshes itself when you save a file. Close the window to stop.
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
if not exist node_modules (
  echo Installing packages for the first time...
  call npm install
)
start "" "http://localhost:4321/"
call npm run dev
pause
