@echo off
REM Quick start script for Windows
echo Starting SMART Agent on Windows...
echo Press Ctrl+C to stop

REM Check if psutil is installed
python -c "import psutil" >nul 2>&1
if errorlevel 1 (
    echo ERROR: psutil not installed. Run install_windows.bat first
    pause
    exit /b 1
)

REM Start the agent
python UniversalSMARTAgent.py