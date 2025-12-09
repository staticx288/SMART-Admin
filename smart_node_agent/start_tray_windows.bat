@echo off
REM SMART Node Agent - System Tray Launcher for Windows
REM Starts the agent in background with system tray icon

echo.
echo ==========================================
echo   SMART Node Agent - System Tray Mode
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    python3 --version >nul 2>&1
    if errorlevel 1 (
        echo Error: Python not found!
        echo Please install Python from https://python.org/
        pause
        exit /b 1
    )
    set PYTHON_CMD=python3
) else (
    set PYTHON_CMD=python
)

REM Check if dependencies are installed
echo Checking dependencies...
%PYTHON_CMD% -c "import pystray, PIL" >nul 2>&1
if errorlevel 1 (
    echo Installing system tray dependencies...
    %PYTHON_CMD% -m pip install pystray pillow
    if errorlevel 1 (
        echo.
        echo Failed to install dependencies.
        echo Please run manually: pip install pystray pillow
        pause
        exit /b 1
    )
)

echo Starting SMART Node Agent in system tray mode...
echo.
echo The agent will appear in your system tray (notification area).
echo Right-click the icon for options.
echo.

REM Start the tray application (use pythonw to hide console on Windows)
start "SMART Node Agent" pythonw SMARTAgentTray.py

echo.
echo Agent started! Look for the SMART icon in your system tray.
echo Close this window - the agent will continue running in the background.
echo.
timeout /t 3 /nobreak >nul
