@echo off
echo.
echo ==========================================
echo   SMART-Admin Development Environment
echo   World's First Blockchain-Operated Business Platform
echo ==========================================
echo.

echo Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install from https://nodejs.org/
    pause
    exit /b 1
)

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    python3 --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Python not found. Please install from https://python.org/
        pause
        exit /b 1
    ) else (
        echo ✅ Python3 detected
    )
) else (
    echo ✅ Python detected
)

REM Check if dependencies are installed
if not exist "node_modules\" (
    echo Installing Node.js dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install Node.js dependencies
        pause
        exit /b 1
    )
)

if not exist "client\node_modules\" (
    echo Installing frontend dependencies...
    cd client
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
)

REM Create data directories if they don't exist
if not exist "data\" mkdir data
if not exist "data\ledger\" mkdir data\ledger
if not exist "data\deployments\" mkdir data\deployments
if not exist "data\domains\" mkdir data\domains

echo.
echo ✅ All prerequisites met!
echo.
echo Starting SMART-Admin services...
echo.
echo 📡 Backend API will start on: http://localhost:5001
echo 🎨 Frontend UI will start on: http://localhost:5173
echo.
echo Press Ctrl+C in either window to stop services
echo.

REM Start backend server in new window
start "SMART-Admin Backend" cmd /k "echo Starting SMART-Admin Backend Server... && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window  
start "SMART-Admin Frontend" cmd /k "echo Starting SMART-Admin Frontend... && cd client && npm run dev"

echo.
echo 🚀 SMART-Admin is starting up!
echo.
echo Both services are launching in separate windows:
echo   - Backend (Express + Python Bridge)
echo   - Frontend (React + Vite)
echo.
echo Once both are ready, open your browser to:
echo   👉 http://localhost:5173
echo.
echo To stop SMART-Admin:
echo   - Close both terminal windows, or
echo   - Press Ctrl+C in each window
echo.

pause