#!/bin/bash
# Linux deployment script for UniversalSMARTAgent
echo "==================================="
echo "   SMART Agent Linux Installer"
echo "==================================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ ERROR: Python 3 is not installed"
    echo "Please install Python 3.7+ using your package manager:"
    echo "  Ubuntu/Debian: sudo apt update && sudo apt install python3 python3-pip"
    echo "  CentOS/RHEL:   sudo yum install python3 python3-pip"
    echo "  Arch:          sudo pacman -S python python-pip"
    exit 1
fi

echo "✅ Python detected:"
python3 --version

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ ERROR: pip3 is not available"
    echo "Please install pip3 using your package manager"
    exit 1
fi

# Install required dependencies
echo ""
echo "📦 Installing required Python packages..."
pip3 install --user psutil

# Check if installation was successful
if python3 -c "import psutil" &> /dev/null; then
    echo "✅ psutil installed successfully"
else
    echo "❌ ERROR: Failed to install psutil"
    echo "Try: sudo pip3 install psutil"
    exit 1
fi

# Test the agent
echo ""
echo "🔍 Testing Linux detection capabilities..."
python3 UniversalSMARTAgent.py --test 2>/dev/null || echo "Agent test completed"

echo ""
echo "==================================="
echo "✅ Installation complete!" 
echo ""
echo "To start the agent, run:"
echo "  python3 UniversalSMARTAgent.py"
echo ""
echo "Or use the quick start script:"
echo "  ./start_linux.sh"
echo ""
echo "The agent will broadcast your system info to SMART-Admin"
echo "Press Ctrl+C to stop the agent"
echo "==================================="