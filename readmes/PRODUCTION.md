# SMART-Admin Production Setup

## Quick Start

### Install PM2 (if not already installed)
```bash
npm install -g pm2
```

### Start in Production Mode
```bash
./scripts/start-production.sh
```

Or manually:
```bash
# Build frontend
npx vite build

# Start with PM2
pm2 start ecosystem.config.cjs

# Save configuration (auto-restart on reboot)
pm2 save
pm2 startup
```

### Stop Production Services
```bash
./scripts/stop-production.sh
```

Or manually:
```bash
pm2 stop all
pm2 delete all
```

## Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs                    # All logs
pm2 logs smart-admin-server # Server logs only
pm2 logs smart-node-agent   # Agent logs only

# Monitor resources
pm2 monit

# Restart services
pm2 restart all
pm2 restart smart-admin-server
pm2 restart smart-node-agent
```

## Auto-Start on System Boot

After starting PM2 for the first time, run:
```bash
pm2 startup
pm2 save
```

This will create a systemd service that automatically starts SMART-Admin when the system boots.

## Access

- Web Interface: http://localhost:5001
- UDP Discovery: Port 8765

## Logs Location

- PM2 logs: `logs/pm2-*.log`
- Agent logs: `smart_node_agent/logs/agent.log`
- Server logs: Console output via PM2

## Troubleshooting

### Services won't start
```bash
pm2 logs  # Check error logs
```

### Reset everything
```bash
pm2 kill              # Stop PM2 daemon
pm2 start ecosystem.config.cjs  # Start fresh
```

### Check if ports are in use
```bash
netstat -tln | grep 5001  # Web server
netstat -uln | grep 8765  # UDP discovery
```
