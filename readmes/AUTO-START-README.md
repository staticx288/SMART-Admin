# SMART-Admin Auto-Start Setup

## Current Configuration

The SMART-Admin system is configured to **automatically start on boot** and **stay running** even when VS Code is closed.

### Services Running

1. **smart-admin-server** (Port 5001)
   - Main admin console and web interface
   - UDP discovery listener on port 8765
   - Manages node registration and monitoring

2. **smart-node-agent** (Port 8765 broadcasting)
   - Broadcasts this Business Hub's presence
   - Advertises on both network interfaces:
     - 192.168.1.91 (WiFi)
     - 192.168.10.120 (Ethernet)

### Auto-Start Method

**PM2 Systemd Service** (Primary method)
- Service: `pm2-broy.service`
- Automatically resurrects saved PM2 processes on boot
- More reliable than crontab for production use

Check systemd service status:
```bash
systemctl status pm2-broy.service
```

### Process Management (PM2)

PM2 keeps the services running and automatically restarts them if they crash.

**Management Commands:**
```bash
./scripts/pm2-manage.sh status    # Check if services are running
./scripts/pm2-manage.sh logs      # View live logs
./scripts/pm2-manage.sh restart   # Restart services
./scripts/pm2-manage.sh stop      # Stop services
./scripts/pm2-manage.sh start     # Start services
./scripts/pm2-manage.sh monitor   # Open PM2 dashboard
```

**Direct PM2 Commands:**
```bash
pm2 list              # Show all processes
pm2 logs              # Show all logs
pm2 monit             # Open monitoring dashboard
pm2 restart all       # Restart all services
pm2 stop all          # Stop all services
pm2 delete all        # Remove all services from PM2
```

### How It Works

1. **On Boot:** Systemd starts `pm2-broy.service` automatically
2. **PM2 Resurrects:** PM2 restores saved processes from last `pm2 save`
3. **Services Launch:** Both server and agent start from `ecosystem.config.cjs`
4. **Auto-Restart:** If a service crashes, PM2 automatically restarts it
5. **Persistent:** Services keep running even if:
   - VS Code is closed
   - Terminal is closed
   - You log out and log back in

### Verification After Reboot

After rebooting your PC:

1. Open terminal and run:
   ```bash
   pm2 list
   ```
   You should see both services running.

2. Check the web interface:
   ```bash
   Open http://localhost:5001
   ```

3. View startup logs:
   ```bash
   cat "/media/broy/Web Projects/SMART-Admin/logs/startup.log"
   ```

### Troubleshooting

**Services not running after reboot:**
```bash
# Check PM2 systemd service
systemctl status pm2-broy.service

# Check if PM2 processes are running
pm2 list

# Manually restart PM2 processes
cd "/media/broy/Web Projects/SMART-Admin"
pm2 restart ecosystem.config.cjs
pm2 save

# View PM2 logs
pm2 logs --lines 50
```

**Reinstall PM2 startup (if needed):**
```bash
# Generate the startup command
pm2 startup

# Copy and run the command shown (requires sudo)
# Then save current process list:
pm2 save
```

**Services crash frequently:**
```bash
# View error logs
pm2 logs --err

# Check specific service logs
cat logs/pm2-error.log
cat logs/agent-error.log
```

**Remove auto-start:**
```bash
crontab -e
# Then delete the @reboot line
```

### Configuration Files

- `ecosystem.config.cjs` - PM2 process configuration
- `start-smart-admin.sh` - Boot startup script
- `scripts/pm2-manage.sh` - Convenience management script

### Requirements

- PM2 installed globally (`npm install -g pm2` - already done ✓)
- Python 3 with psutil (`python3-psutil` - already installed ✓)
- Cron service running (default on Ubuntu ✓)
