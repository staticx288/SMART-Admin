#!/bin/bash
# Stop SMART-Admin production services

# Navigate to project root (parent of scripts/)
cd "$(dirname "$0")/.."

echo "🛑 Stopping SMART-Admin..."

pm2 stop ecosystem.config.cjs
pm2 delete ecosystem.config.cjs

echo "✅ All services stopped"
