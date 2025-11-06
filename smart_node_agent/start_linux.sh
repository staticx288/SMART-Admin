#!/bin/bash
# Quick start script for Linux
echo "Starting SMART Agent on Linux..."
echo "Press Ctrl+C to stop"

# Check if psutil is installed
if ! python3 -c "import psutil" &> /dev/null; then
    echo "❌ ERROR: psutil not installed. Run install_linux.sh first"
    exit 1
fi

# Start the agent
python3 UniversalSMARTAgent.py