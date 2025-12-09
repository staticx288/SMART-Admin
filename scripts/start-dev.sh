#!/bin/bash

# PulseAdmin Development Startup Script

echo "🚀 Starting PulseAdmin Development Environment..."

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🔧 Starting PulseAdmin server..."
echo "📱 Application will be available at: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop the server"

npm run dev
