#!/bin/bash
# Auto-start script for SMART-Admin
# This should be run at boot via crontab or systemd

# Navigate to project root (parent of scripts/)
cd "$(dirname "$0")/.."

# Wait for network
sleep 10

# Start services with PM2
/usr/local/bin/pm2 start ecosystem.config.cjs

# Save PM2 list
/usr/local/bin/pm2 save
