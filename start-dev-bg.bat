@echo off
echo Starting SMART-Admin Development Server...

REM Kill any existing processes
taskkill /F /IM node.exe /FI "WINDOWTITLE eq SMART-Admin-Backend*" 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq SMART-Admin-Frontend*" 2>nul

REM Start backend server in background (hidden window)
start /MIN /B "SMART-Admin-Backend" cmd /c "npm run dev > logs\backend.log 2>&1"

REM Wait a moment for backend to start
timeout /t 2 /nobreak > nul

REM Start frontend server in background (hidden window) 
start /MIN /B "SMART-Admin-Frontend" cmd /c "cd client && npx vite > ..\logs\frontend.log 2>&1"

echo SMART-Admin servers started in background
echo Backend logs: logs\backend.log
echo Frontend logs: logs\frontend.log
echo.
echo Use 'stop-dev.bat' to stop servers
echo Use 'tail -f logs\backend.log' to monitor backend
echo Use 'tail -f logs\frontend.log' to monitor frontend