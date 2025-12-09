#!/bin/bash

# SMART-Admin Server Systemd Service Installer
# Installs the SMART-Admin server as a background service that starts on boot

set -e

INSTALL_DIR="$HOME/SMART-Admin"
SERVICE_NAME="smart-admin-server"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "🔧 SMART-Admin Server Service Installer"
echo "========================================"
echo ""

# Check if running from correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from SMART-Admin project directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

INSTALL_DIR="$(pwd)"
echo "✅ Project directory: $INSTALL_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js not found. Please install Node.js first."
    exit 1
fi

NODE_PATH=$(which node)
echo "✅ Node.js found: $NODE_PATH"

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Create systemd service file
echo ""
echo "📝 Creating systemd service file..."
sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=SMART-Admin Server - Hub Management & Node Discovery
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory="$INSTALL_DIR"
Environment="NODE_ENV=production"
Environment="PATH=/usr/local/bin:/usr/bin:/bin:$HOME/.local/bin"

# Start the server (runs both backend and serves frontend)
ExecStart="$NODE_PATH" "$INSTALL_DIR/dist/index.js"

# Restart policy
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=smart-admin

# Security
NoNewPrivileges=true
PrivateTmp=true

# Create log directory
RuntimeDirectory=smart-admin
LogsDirectory=smart-admin

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service file created: $SERVICE_FILE"

# Reload systemd daemon
echo ""
echo "🔄 Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable service to start on boot
echo "🚀 Enabling service to start on boot..."
sudo systemctl enable $SERVICE_NAME

# Start the service
echo "▶️  Starting SMART-Admin server service..."
sudo systemctl start $SERVICE_NAME

# Wait a moment for service to start
sleep 2

# Check service status
echo ""
echo "📊 Service Status:"
echo "=================="
sudo systemctl status $SERVICE_NAME --no-pager -l

echo ""
echo "✅ SMART-Admin server installed as system service!"
echo ""
echo "📋 Service Management Commands:"
echo "   Start:   sudo systemctl start $SERVICE_NAME"
echo "   Stop:    sudo systemctl stop $SERVICE_NAME"
echo "   Restart: sudo systemctl restart $SERVICE_NAME"
echo "   Status:  sudo systemctl status $SERVICE_NAME"
echo "   Logs:    sudo journalctl -u $SERVICE_NAME -f"
echo ""
echo "🌐 Access the admin panel at: http://localhost:5001"
echo "   (Frontend served on port 5001, backend API on same port)"
echo ""
echo "🔍 To view live logs:"
echo "   sudo journalctl -u $SERVICE_NAME -f --lines=50"
echo ""
