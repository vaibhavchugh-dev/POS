@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing packages...
  call npm install
)
echo Starting Jain Dosa House POS...
call npm run desktop
