#!/bin/bash
# PM2 Management Script for SMART-Admin

case "$1" in
  start)
    echo "🚀 Starting SMART-Admin..."
    pm2 start ecosystem.config.cjs
    pm2 save
    ;;
  stop)
    echo "🛑 Stopping SMART-Admin..."
    pm2 stop all
    ;;
  restart)
    echo "♻️  Restarting SMART-Admin..."
    pm2 restart all
    ;;
  status)
    echo "📊 SMART-Admin Status:"
    pm2 status
    echo ""
    echo "🌐 Server: http://localhost:5001"
    echo "📻 UDP Discovery: port 8765"
    echo "🤖 SmartNode Agent: Broadcasting on all interfaces"
    echo ""
    echo "🔄 Auto-start: Configured via crontab (@reboot)"
    ;;
  logs)
    echo "📜 Following SMART-Admin logs (Ctrl+C to exit)..."
    pm2 logs
    ;;
  monitor)
    echo "📊 Opening PM2 monitor..."
    pm2 monit
    ;;
  *)
    echo "SMART-Admin PM2 Manager"
    echo ""
    echo "Usage: $0 {start|stop|restart|status|logs|monitor}"
    echo ""
    echo "Commands:"
    echo "  start    - Start the server and agent"
    echo "  stop     - Stop the server and agent"
    echo "  restart  - Restart the server and agent"
    echo "  status   - Show server status"
    echo "  logs     - Show and follow logs"
    echo "  monitor  - Open PM2 monitor dashboard"
    echo ""
    echo "Note: Services auto-start on system boot via crontab"
    exit 1
    ;;
esac
