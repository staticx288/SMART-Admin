@echo off
REM Windows deployment script for UniversalSMARTAgent
echo ===================================
echo    SMART Agent Windows Installer
echo ===================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ from python.org
    pause
    exit /b 1
)

echo Python detected:
python --version

REM Check if pip is available
pip --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: pip is not available
    pause
    exit /b 1
)

REM Install required dependencies
echo.
echo Installing required Python packages...
pip install psutil

REM Check if installation was successful
python -c "import psutil; print('✅ psutil installed successfully')" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to install psutil
    pause
    exit /b 1
)

REM Test the agent
echo.
echo Testing Windows detection capabilities...
python test_windows_detection.py

echo.
echo ===================================
echo Installation complete! 
echo.
echo To start the agent, run:
echo   python UniversalSMARTAgent.py
echo.
echo The agent will broadcast your PC info to SMART-Admin
echo Press Ctrl+C to stop the agent
echo ===================================
pause