@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing packages...
  call npm install
)
echo Starting Spice Counter POS...
call npm run desktop
