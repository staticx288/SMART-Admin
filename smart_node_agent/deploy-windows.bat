@echo off
REM Windows deployment script for SMART Node Agent
echo ============================================
echo    SMART Node Agent - Windows Deployment    
echo ============================================

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python from https://python.org
    pause
    exit /b 1
)

echo ✅ Python found

echo Installing required packages...
pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ Failed to install requirements
    pause
    exit /b 1
)

echo ✅ Requirements installed

echo.
echo Choose SMART Agent to run:
echo 1. Universal Agent (Windows/Linux/macOS)
echo 2. Android Agent (for Android devices)
set /p choice="Enter choice (1-2): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Starting Universal SMART Agent...
    python UniversalSMARTAgent.py
) else if "%choice%"=="2" (
    echo.
    echo 🚀 Starting Android SMART Agent...
    python AndroidSMARTAgent.py
) else (
    echo Invalid choice
    pause
    exit /b 1
)

pause