#!/bin/bash
# SMART Node Agent - System Tray Launcher for macOS
# Starts the agent in background with system tray icon

echo ""
echo "=========================================="
echo "  SMART Node Agent - System Tray Mode"
echo "=========================================="
echo ""

# Find Python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo "❌ Error: Python not found!"
    echo "Please install Python 3.8+ from python.org or Homebrew"
    exit 1
fi

echo "✅ Using Python: $PYTHON_CMD"

# Check if dependencies are installed
echo "Checking dependencies..."
$PYTHON_CMD -c "import pystray, PIL" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 Installing system tray dependencies..."
    $PYTHON_CMD -m pip install pystray pillow --user
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Failed to install dependencies."
        echo "Please run manually: pip3 install pystray pillow"
        exit 1
    fi
fi

echo "🚀 Starting SMART Node Agent in system tray mode..."
echo ""
echo "The agent will appear in your menu bar."
echo "Click the icon for options."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start the tray application
cd "$SCRIPT_DIR"
$PYTHON_CMD SMARTAgentTray.py &

echo "✅ Agent started! Look for the SMART icon in your menu bar."
echo ""
echo "Note: This window can be closed - the agent runs in the background."
echo ""

sleep 2
