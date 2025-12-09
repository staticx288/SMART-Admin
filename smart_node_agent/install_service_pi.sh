#!/bin/bash
# SMART Node Agent - Systemd Service Installation Script for Raspberry Pi
# Run this script on your Raspberry Pi to install the agent as a background service

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   SMART Node Agent - Systemd Service Installation         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
INSTALL_DIR="$HOME/smart_node_agent"

# Check if running on Raspberry Pi or Linux
if [[ ! -f /etc/os-release ]]; then
    echo "❌ Error: This script is for Linux systems only"
    exit 1
fi

echo "📦 Step 1: Installing Python dependencies..."
pip3 install --user netifaces psutil || {
    echo "❌ Failed to install dependencies"
    exit 1
}
echo "✅ Dependencies installed"
echo ""

echo "📁 Step 2: Setting up installation directory..."
# Create installation directory if it doesn't exist
mkdir -p "$INSTALL_DIR/logs"

# Copy agent files
cp "$SCRIPT_DIR/UniversalSMARTAgent.py" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/requirements.txt" "$INSTALL_DIR/" 2>/dev/null || true

echo "✅ Files copied to $INSTALL_DIR"
echo ""

echo "⚙️  Step 3: Installing systemd service..."
# Create service file with correct paths
SERVICE_FILE="/tmp/smart-agent.service"
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=SMART Node Agent - Autonomous Infrastructure Discovery
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/python3 $INSTALL_DIR/UniversalSMARTAgent.py
Restart=always
RestartSec=10
StandardOutput=append:$INSTALL_DIR/logs/agent.log
StandardError=append:$INSTALL_DIR/logs/agent_error.log

# Security hardening
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Install service file (requires sudo)
sudo cp "$SERVICE_FILE" /etc/systemd/system/smart-agent.service
sudo systemctl daemon-reload

echo "✅ Service installed"
echo ""

echo "🚀 Step 4: Enabling and starting service..."
sudo systemctl enable smart-agent.service
sudo systemctl start smart-agent.service

echo "✅ Service started"
echo ""

# Wait a moment for service to start
sleep 2

# Check service status
echo "📊 Service Status:"
sudo systemctl status smart-agent.service --no-pager || true
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║              Installation Complete! 🎉                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "The SMART Node Agent is now running in the background!"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status smart-agent    # Check status"
echo "  sudo systemctl stop smart-agent      # Stop agent"
echo "  sudo systemctl start smart-agent     # Start agent"
echo "  sudo systemctl restart smart-agent   # Restart agent"
echo "  sudo journalctl -u smart-agent -f   # View live logs"
echo "  tail -f $INSTALL_DIR/logs/agent.log # View agent log file"
echo ""
echo "The agent will automatically start on boot!"
echo "You can now close this terminal - the agent runs in the background."
echo ""
