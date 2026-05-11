@echo off
echo ==========================================
echo     STARTING SALONFLOW ENTERPRISE
echo ==========================================
echo.
echo Installing root dependencies...
call npm install
echo.
echo Launching Backend and Frontend...
npm start
pause
