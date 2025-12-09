#!/bin/bash
# Production startup script for SMART-Admin

set -e

# Navigate to project root (parent of scripts/)
cd "$(dirname "$0")/.."

echo "🚀 Starting SMART-Admin in Production Mode"
echo "=========================================="

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# Check if logs directory exists
mkdir -p logs

# Stop any existing instances
echo "🛑 Stopping existing instances..."
pm2 stop ecosystem.config.cjs 2>/dev/null || true
pm2 delete ecosystem.config.cjs 2>/dev/null || true

# Build frontend for production
echo "📦 Building frontend..."
npx vite build

# Start services with PM2
echo "🚀 Starting services..."
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Show status
echo ""
echo "✅ SMART-Admin started successfully!"
echo ""
pm2 status
echo ""
echo "📊 View logs:"
echo "   pm2 logs smart-admin-server"
echo "   pm2 logs smart-node-agent"
echo ""
echo "🌐 Access at: http://localhost:5001"
echo ""
echo "⚙️  Manage services:"
echo "   pm2 status              - View status"
echo "   pm2 restart all         - Restart all services"
echo "   pm2 stop all            - Stop all services"
echo "   pm2 logs                - View all logs"
echo "   pm2 monit               - Monitor resources"
