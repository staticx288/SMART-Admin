@echo off
echo Stopping SMART-Admin Development Server...

REM Kill backend and frontend processes
taskkill /F /IM node.exe /FI "WINDOWTITLE eq SMART-Admin-Backend*" 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq SMART-Admin-Frontend*" 2>nul

echo SMART-Admin servers stopped