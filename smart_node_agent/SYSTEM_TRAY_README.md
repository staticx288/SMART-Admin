# 🎯 SMART Node Agent - System Tray Application

Run the SMART Node Agent silently in the background with a convenient system tray icon - no terminal window needed!

## ✨ Features

- **🖥️ System Tray Icon**: Lives in your notification area (Windows), system tray (Linux), or menu bar (macOS)
- **🚫 No Terminal Window**: Runs completely in the background
- **📝 Log File**: All output saved to `logs/smart_agent.log`
- **🎛️ Easy Control**: Right-click menu to start/stop, view status, and access logs
- **🔔 Notifications**: Desktop notifications for important events
- **💻 Cross-Platform**: Works on Windows, Linux, and macOS

## 🚀 Quick Start

### Windows
Double-click `start_tray_windows.bat` or run in Command Prompt:
```cmd
start_tray_windows.bat
```

### Linux
```bash
./start_tray_linux.sh
```

### macOS
```bash
./start_tray_macos.sh
```

## 📦 Installation

### Install Dependencies
```bash
# Install system tray support
pip install pystray pillow

# Or install all requirements
pip install -r requirements.txt
```

### Manual Start
```bash
# System tray mode (default)
python SMARTAgentTray.py

# Console mode (fallback if tray not available)
python SMARTAgentTray.py --console
```

## 🎛️ System Tray Menu

Right-click the SMART icon in your system tray to access:

- **SMART Node Agent** - Click to show quick status notification
- **Status** - View current running status
- **Start/Stop Agent** - Toggle the agent on/off
- **Show Info** - Display detailed system information
- **Open Log** - Open the log file in your default text editor
- **Quit** - Stop the agent and exit

## 📊 Log Files

All agent activity is logged to:
```
smart_node_agent/logs/smart_agent.log
```

The log file includes:
- Agent start/stop events
- Network interface detection
- Broadcasting activity
- Error messages and warnings
- System information

## 🔧 Console Mode

If system tray support is not available or you prefer console mode:

```bash
python SMARTAgentTray.py --console
```

**Console Commands:**
- `start` - Start the agent
- `stop` - Stop the agent
- `status` - Show agent status
- `info` - Display detailed information
- `quit` - Exit the application

## 🐧 Linux System Integration

### Create Desktop Entry (Ubuntu/GNOME)

Create `~/.local/share/applications/smart-agent.desktop`:
```ini
[Desktop Entry]
Name=SMART Node Agent
Comment=Distributed blockchain node agent
Exec=/path/to/smart_node_agent/start_tray_linux.sh
Icon=/path/to/icon.png
Terminal=false
Type=Application
Categories=Network;System;
StartupNotify=false
```

### Auto-Start on Login

**Method 1: GNOME Startup Applications**
1. Open "Startup Applications"
2. Click "Add"
3. Name: "SMART Node Agent"
4. Command: `/path/to/start_tray_linux.sh`
5. Click "Add"

**Method 2: Systemd User Service**

Create `~/.config/systemd/user/smart-agent.service`:
```ini
[Unit]
Description=SMART Node Agent
After=network.target

[Service]
Type=simple
ExecStart=/path/to/smart_node_agent/SMARTAgentTray.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
```

Enable and start:
```bash
systemctl --user enable smart-agent.service
systemctl --user start smart-agent.service
```

## 🪟 Windows System Integration

### Create Desktop Shortcut

1. Right-click `start_tray_windows.bat`
2. Select "Create shortcut"
3. Move shortcut to Desktop or Start Menu

### Auto-Start on Login

**Method 1: Startup Folder**
1. Press `Win + R`
2. Type: `shell:startup`
3. Copy shortcut to this folder

**Method 2: Task Scheduler**
1. Open Task Scheduler
2. Create Basic Task
3. Name: "SMART Node Agent"
4. Trigger: "When I log on"
5. Action: "Start a program"
6. Program: `pythonw.exe`
7. Arguments: `SMARTAgentTray.py`
8. Start in: `/path/to/smart_node_agent/`

## 🍎 macOS System Integration

### Create Application Bundle

Create `SMART Agent.app/Contents/MacOS/launcher`:
```bash
#!/bin/bash
cd "$(dirname "$0")/../../.."
python3 SMARTAgentTray.py
```

### Auto-Start on Login

1. Open **System Preferences** → **Users & Groups**
2. Select your user
3. Click **Login Items** tab
4. Click **+** and add the launcher script
5. Check "Hide" to run in background

## 🔍 Troubleshooting

### System Tray Icon Not Appearing

**Linux:**
- Install required system packages:
  ```bash
  # Ubuntu/Debian
  sudo apt install python3-tk libappindicator3-1
  
  # Fedora
  sudo dnf install python3-tkinter libappindicator-gtk3
  ```
- Try running in console mode to check for errors:
  ```bash
  python SMARTAgentTray.py --console
  ```

**Windows:**
- Ensure Python is installed with tkinter support
- Check Windows notification area settings
- Run `start_tray_windows.bat` as Administrator

**macOS:**
- Grant Python accessibility permissions in System Preferences
- Check Console.app for error messages

### Dependencies Not Installing

```bash
# Use user installation if permission denied
pip install --user pystray pillow

# Or use virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### Agent Not Broadcasting

1. Check the log file: `logs/smart_agent.log`
2. Verify network interfaces are detected
3. Check firewall settings (UDP port 8765)
4. Ensure SMART-Admin server is running

### High CPU Usage

- Normal: 0-1% CPU when idle, 2-5% when broadcasting
- Check log file for errors or excessive logging
- Reduce logging level in code if needed

## 📚 Advanced Usage

### Custom Icon

Replace the icon generation in `SMARTAgentTray.py`:
```python
def create_icon_image(self):
    # Load custom icon
    return Image.open('path/to/icon.png')
```

### Custom Notification Messages

Modify notification text in the `SMARTAgentTray` class methods:
```python
self.icon.notify("Title", "Custom message")
```

### Environment Variables

```bash
# Custom log location
export SMART_AGENT_LOG_DIR=/var/log/smart-agent

# Custom broadcast port
export SMART_AGENT_PORT=8765
```

## 🎯 Comparison: Terminal vs System Tray

| Feature | Terminal Mode | System Tray Mode |
|---------|---------------|------------------|
| Runs in background | ❌ (window visible) | ✅ (hidden) |
| Easy start/stop | ❌ (kill process) | ✅ (menu control) |
| Visual feedback | ✅ (console output) | ✅ (notifications) |
| Log file | ❌ (terminal only) | ✅ (automatic) |
| Auto-start | ⚠️ (complex) | ✅ (easy) |
| Clean desktop | ❌ | ✅ |
| Status check | ❌ (check terminal) | ✅ (click icon) |

## 🚀 Production Deployment

For production deployments, consider:

1. **Service Installation**: Use systemd (Linux), Windows Service, or launchd (macOS)
2. **Automatic Restart**: Configure service to restart on failure
3. **Log Rotation**: Implement log rotation to prevent disk space issues
4. **Monitoring**: Add health checks and alerting
5. **Security**: Run with minimal permissions

## 📞 Support

For issues or questions:
1. Check the log file first: `logs/smart_agent.log`
2. Review this README for common solutions
3. Check SMART-Admin documentation
4. Report issues with log file attached

---

**🎯 Enjoy running SMART Node Agent silently in the background!**

*World's First Blockchain-Operated Business Platform - Now with System Tray Convenience*