# SMART Node Agents - Cross-Platform Deployment

Complete solution for detecting and broadcasting device information to SMART-Admin across Windows, Linux, macOS, and Android platforms.

## 🚀 Quick Start

### Windows
```bash
# Download and run
cd smart_node_agent
deploy-windows.bat
```

### Linux/macOS
```bash
# Make executable and run
chmod +x deploy-linux.sh
./deploy-linux.sh
```

### Android (Termux)
```bash
# Install Termux, then:
pkg install python python-pip
pip install psutil
python AndroidSMARTAgent.py
```

## 📋 Available Agents

### 1. UniversalSMARTAgent.py
**Cross-platform agent for Windows, Linux, and macOS**

**Features:**
- 🔍 Auto-detects OS version (Windows 11, Ubuntu 22.04, macOS Sonoma, etc.)
- 🏭 Hardware model detection (Dell XPS, ThinkPad, MacBook, etc.) 
- 💻 Comprehensive system specs (CPU, RAM, Storage)
- 📡 UDP broadcasting to SMART-Admin

**Platform Support:**
- ✅ Windows 10/11 (with winreg registry detection)
- ✅ Linux (Ubuntu, CentOS, Debian, Arch, etc.)
- ✅ macOS (Intel and Apple Silicon)
- ✅ Raspberry Pi (auto-detected)

### 2. AndroidSMARTAgent.py
**Optimized for Android devices via Termux**

**Features:**
- 📱 Android version detection (Android 14, 16, etc.)
- 🔧 Device model detection (Samsung Galaxy, etc.)
- 💾 Android-specific storage/memory detection
- 🔌 Termux SSH port support (8022)

## 📊 Broadcast Data Format

Each agent broadcasts rich platform information:

```json
{
  "system_info": {
    "os": "Windows 11 Pro (Build 22621)",
    "platform": "windows",
    "architecture": "AMD64",
    "hostname": "DESKTOP-PC"
  },
  "device_info": {
    "model": "Dell XPS 13 9320",
    "os": "Windows 11 Pro"
  },
  "resources": {
    "cpu_cores": 8,
    "memory_gb": 16.0,
    "storage_gb": 512
  }
}
```

## 🔧 Installation Requirements

### All Platforms
```bash
pip install psutil>=5.8.0
```

### Platform-Specific
- **Windows:** Built-in winreg module
- **Linux:** DMI/sysfs support (usually built-in)
- **Android:** Termux with `getprop` command
- **macOS:** Built-in system commands

## 🌐 Network Configuration

**Port:** UDP 8765 (SMART-Admin discovery)  
**Broadcast:** Every 10 seconds  
**Protocol:** JSON over UDP broadcast

### Firewall Settings
Ensure UDP port 8765 is open for outbound broadcast:

```bash
# Linux (ufw)
sudo ufw allow out 8765/udp

# Windows Firewall
# Allow Python.exe through Windows Defender Firewall
```

## 📈 Platform Detection Results

The agents detect and display:

| Platform | OS Detection | Device Model | Architecture |
|----------|-------------|--------------|--------------|
| Windows | ✅ Win 10/11 + Build | ✅ WMI Query | ✅ x64/x86 |
| Linux | ✅ /etc/os-release | ✅ DMI/Pi Model | ✅ x64/arm64 |
| macOS | ✅ sw_vers | ✅ hw.model | ✅ x64/arm64 |
| Android | ✅ getprop | ✅ ro.product.model | ✅ arm64 |

## 🔍 Troubleshooting

### Agent Not Appearing in SMART-Admin

1. **Check Network:** Ensure UDP broadcast is working
```bash
# Test UDP broadcast
python -c "import socket; s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM); s.setsockopt(socket.SOL_SOCKET,socket.SO_BROADCAST,1); print('UDP OK')"
```

2. **Check Firewall:** Allow UDP 8765 outbound

3. **Check Backend:** Verify SMART-Admin server is listening on UDP 8765

### Platform Detection Issues

1. **Windows Model Detection Fails:**
   - Run as Administrator for WMI access
   - Check if `wmic` command is available

2. **Linux DMI Access Denied:**
   - Some systems require sudo for `/sys/class/dmi/`
   - Agent falls back to hostname if DMI unavailable

3. **Android getprop Fails:**
   - Ensure running in Termux environment
   - Install Termux from F-Droid (not Google Play)

## 🚀 Advanced Usage

### Custom Platform Detection
Extend the `detect_platform_info()` method:

```python
def detect_custom_hardware(self):
    # Add your custom detection logic
    if os.path.exists('/custom/hardware/path'):
        return "Custom Device Type"
    return None
```

### Enterprise Deployment
For large-scale deployment:

1. **Create installer packages** (MSI, DEB, RPM)
2. **Use configuration management** (Ansible, SCCM)
3. **Deploy via group policy** (Windows AD)

## 📝 Logs and Debugging

All agents provide detailed logging:

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
python UniversalSMARTAgent.py
```

**Log Locations:**
- Windows: Agent console output
- Linux: stdout/journalctl if systemd service
- Android: Termux session output

## 🔄 Updates and Maintenance

### Updating Platform Info for Existing Nodes
```bash
node update-platform-info.cjs
```

This script backfills platform information for nodes registered before agent deployment.

## 🛡️ Security Considerations

- **UDP Broadcasts:** Visible on local network
- **System Info:** Hardware specs broadcast (consider privacy)
- **SSH Ports:** Agents advertise SSH access ports
- **Firewall:** Configure appropriate network restrictions

For production environments, consider VPN or network segmentation.

## 📞 Support

- **Platform Issues:** Check OS-specific detection methods
- **Network Issues:** Verify UDP broadcast capability  
- **Performance:** Monitor broadcast frequency (10s default)
- **Integration:** Ensure SMART-Admin server compatibility

---

## 🎯 Next Steps

1. **Deploy agents** on all target devices
2. **Verify detection** in SMART-Admin platform column
3. **Configure modules** for specific device types
4. **Monitor performance** via SMART-Admin dashboard

Your infrastructure will now have comprehensive platform visibility! 🚀