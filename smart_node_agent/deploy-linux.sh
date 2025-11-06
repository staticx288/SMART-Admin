#!/bin/bash
# Linux deployment script for SMART Node Agent

echo "============================================"
echo "    SMART Node Agent - Linux Deployment    "
echo "============================================"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found! Installing..."
    
    # Detect Linux distribution and install Python
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip
    elif command -v yum &> /dev/null; then
        sudo yum install -y python3 python3-pip
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y python3 python3-pip
    elif command -v pacman &> /dev/null; then
        sudo pacman -S python python-pip
    else
        echo "❌ Could not detect package manager. Please install Python 3 manually."
        exit 1
    fi
fi

echo "✅ Python 3 found: $(python3 --version)"

# Install requirements
echo "Installing required packages..."
if command -v pip3 &> /dev/null; then
    pip3 install -r requirements.txt
elif command -v pip &> /dev/null; then
    pip install -r requirements.txt
else
    echo "❌ pip not found! Please install pip3"
    exit 1
fi

if [ $? -ne 0 ]; then
    echo "❌ Failed to install requirements"
    exit 1
fi

echo "✅ Requirements installed"

echo ""
echo "Choose SMART Agent to run:"
echo "1. Universal Agent (Windows/Linux/macOS)"
echo "2. Android Agent (for Android devices)"
read -p "Enter choice (1-2): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting Universal SMART Agent..."
        python3 UniversalSMARTAgent.py
        ;;
    2)
        echo ""
        echo "🚀 Starting Android SMART Agent..."
        python3 AndroidSMARTAgent.py
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac