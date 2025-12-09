# 🪟 SMART-Admin Windows Setup Guide

This guide covers setting up SMART-Admin on Windows systems. The application is designed to work cross-platform, but requires specific setup steps on Windows.

## ✅ Prerequisites

### Required Software

1. **Node.js 18+ with npm**
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose "LTS" version (recommended)
   - Verify installation:
     ```cmd
     node --version
     npm --version
     ```

2. **Python 3.8+**
   - Download from [python.org](https://www.python.org/downloads/)
   - **⚠️ IMPORTANT**: Check "Add Python to PATH" during installation
   - Verify installation:
     ```cmd
     python --version
     # OR (depending on installation)
     python3 --version
     ```

3. **Git**
   - Download from [git-scm.com](https://git-scm.com/download/win)
   - Or use GitHub Desktop

## 🚀 Installation Steps

### 1. Clone the Repository

```cmd
git clone https://github.com/staticx288/SMART-Admin.git
cd SMART-Admin
```

### 2. Install Python Dependencies

The SMART-Admin system uses Python for the ledger (blockchain) system and node agent functionality.

```cmd
# Install Python packages required for SMART-Ledger
cd smart_node_agent
python -m pip install -r requirements.txt

# Go back to project root
cd ..
```

**Required Python packages:**
- `psutil` - System information and process management
- `netifaces` - Network interface detection
- `PyYAML` - YAML configuration parsing
- `requests` - HTTP client for API calls

### 3. Install Node.js Dependencies

```cmd
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 4. Initialize Data Directories

SMART-Admin needs specific directories for data storage:

```cmd
# Create data directories (Windows equivalent of mkdir -p)
mkdir data\ledger 2>nul
mkdir data\deployments 2>nul
mkdir data\domains 2>nul
```

### 5. Verify Python Bridge

Test that Node.js can communicate with Python:

```cmd
# Test Python detection
node -e "
const { spawn, spawnSync } = require('child_process');
function findPython() {
  try {
    const res = spawnSync('python3', ['--version'], { stdio: 'ignore' });
    if (res.status === 0) return 'python3';
  } catch {}
  try {
    const res = spawnSync('python', ['--version'], { stdio: 'ignore' });
    if (res.status === 0) return 'python';
  } catch {}
  return 'python3';
}
console.log('Detected Python:', findPython());
"
```

## 🎯 Running SMART-Admin

### Quick Start (Recommended)

```cmd
# Start both backend and frontend
.\start-dev.bat
```

If you don't have `start-dev.bat`, create it:

```batch
@echo off
echo Starting SMART-Admin Development Environment...
start "Backend Server" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend Vite" cmd /k "cd client && npm run dev"
echo Both services starting...
echo Backend: http://localhost:5001
echo Frontend: http://localhost:5173
```

### Manual Start

**Terminal 1 - Backend:**
```cmd
npm run dev
```

**Terminal 2 - Frontend:**
```cmd
cd client
npm run dev
```

### Access the Dashboard

- **Frontend (UI)**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **API Health**: http://localhost:5001/api/health

## 🔧 Windows-Specific Configuration

### Environment Variables (Optional)

You can override Python detection by setting environment variables:

```cmd
# Set specific Python executable (optional)
set PYTHON_CMD=python
# OR
set PYTHON_CMD=C:\Python39\python.exe

# Then start SMART-Admin
npm run dev
```

### File Permissions

Windows handles file permissions differently than Unix systems. SMART-Admin automatically detects Windows and adjusts:

- Ledger backup files use Windows ACLs instead of Unix `chmod`
- No `chattr` immutable attributes (Linux-only feature)
- Directory creation uses Windows paths (`\` instead of `/`)

### Network Configuration

For SMART Node Agent discovery:

1. **Windows Firewall**: Allow Node.js through Windows Defender Firewall
2. **Port 8765**: UDP broadcasts for node discovery
3. **Port 5001**: Express server API
4. **Port 5173**: Vite development server

## 🤖 SMART Node Agent (Windows)

The SMART Node Agent can run in two modes:

### System Tray Mode (Recommended) 🎯

Runs silently in the background with a system tray icon - **no terminal window needed!**

```cmd
cd smart_node_agent
start_tray_windows.bat
```

**Features:**
- ✅ Runs in background (no terminal window)
- ✅ System tray icon with right-click menu
- ✅ Desktop notifications
- ✅ Easy start/stop control
- ✅ Automatic log file creation
- ✅ Professional appearance

The agent will appear in your system tray (notification area). Right-click the icon for options:
- Start/Stop agent
- View status and system info
- Open log file
- Quit application

### Terminal Mode (Legacy)

For troubleshooting or if you prefer seeing console output:

```cmd
cd smart_node_agent

# Install dependencies
python -m pip install -r requirements.txt

# Start agent
python UniversalSMARTAgent.py
```

### Windows-Specific Features

- **Network Interface Detection**: Uses Windows WMI when available
- **Hardware Detection**: Detects Windows system information via registry
- **Service Installation**: Can be installed as Windows Service (advanced)

## ⚠️ Common Windows Issues

### Python Not Found

**Error:** `'python3' is not recognized as an internal or external command`

**Solution:**
1. Reinstall Python with "Add to PATH" checked
2. Or manually add Python to PATH:
   - Find Python installation (usually `C:\Python39\` or `C:\Users\[username]\AppData\Local\Programs\Python\Python39\`)
   - Add to System PATH environment variable
3. Restart command prompt/terminal

### Permission Errors

**Error:** `EACCES: permission denied, mkdir 'data'`

**Solutions:**
1. Run command prompt as Administrator
2. Check folder permissions in file properties
3. Ensure antivirus isn't blocking file creation

### Network Discovery Issues

**Error:** Node agents not appearing in dashboard

**Solutions:**
1. Check Windows Firewall settings
2. Ensure all devices are on same network
3. Verify UDP port 8765 is not blocked
4. Try disabling Windows Defender temporarily for testing

### Python Package Installation

**Error:** `pip install` fails with permission errors

**Solutions:**
```cmd
# Use --user flag for user-only installation
python -m pip install --user -r requirements.txt

# OR install with elevated privileges
# Run CMD as Administrator, then:
python -m pip install -r requirements.txt
```

## 🎨 Development Environment

### Recommended Windows Tools

1. **VS Code** with extensions:
   - TypeScript and JavaScript Language Features
   - Python
   - YAML
   - Git Graph

2. **Windows Terminal** (modern terminal experience)
3. **Git Bash** (Unix-like commands on Windows)
4. **PowerShell 7+** (modern PowerShell)

### WSL Alternative

If you encounter persistent issues, consider using WSL (Windows Subsystem for Linux):

```cmd
# Install WSL with Ubuntu
wsl --install

# Then follow Linux setup instructions inside WSL
wsl
cd /mnt/c/path/to/SMART-Admin
# Follow standard Linux setup
```

## 📊 Verification Checklist

After setup, verify everything works:

- [ ] ✅ Backend starts without errors (`npm run dev`)
- [ ] ✅ Frontend loads at http://localhost:5173
- [ ] ✅ Can create/edit/delete Nodes in UI
- [ ] ✅ Can create/edit/delete Modules in UI  
- [ ] ✅ Can create/edit/delete Domains in UI
- [ ] ✅ Can create/edit/delete Equipment in UI
- [ ] ✅ Ledger entries appear in `data/ledger/` folder
- [ ] ✅ Node agent broadcasts appear in Nodes tab
- [ ] ✅ No Python bridge errors in server logs

## 🛠️ Troubleshooting

### Enable Debug Logging

```cmd
# Set debug environment variable
set DEBUG=smart:*
npm run dev
```

### Check Ledger Bridge

Test the Python bridge manually:

```cmd
cd server
node -e "
const { spawn } = require('child_process');
const python = spawn('python', ['-c', 'print(\"Python bridge working!\")']);
python.stdout.on('data', (data) => console.log('Output:', data.toString()));
python.on('close', (code) => console.log('Exit code:', code));
"
```

### Reset Data

If data gets corrupted:

```cmd
# Backup current data
xcopy data data_backup /E /I

# Clear ledger files
del data\ledger\*.jsonl
del data\ledger\*.json

# Clear nodes/equipment data
del data\nodes-data.json
del data\equipment-data.json

# Restart SMART-Admin
npm run dev
```

## 🚀 Production Deployment

For production Windows deployment:

1. **Use PM2 for process management:**
   ```cmd
   npm install -g pm2
   pm2 start ecosystem.config.js
   ```

2. **Install as Windows Service:**
   ```cmd
   npm install -g pm2-windows-service
   pm2-service-install
   ```

3. **Configure IIS reverse proxy** (optional)
4. **Set up Windows Firewall rules**
5. **Configure automatic startup**

## 📞 Support

If you encounter issues not covered in this guide:

1. **Check GitHub Issues**: https://github.com/staticx288/SMART-Admin/issues
2. **Server Logs**: Check terminal output for error messages
3. **Browser Console**: Press F12 and check for JavaScript errors
4. **Network Tab**: Verify API calls are reaching the server

### Creating Bug Reports

Include this information:

- Windows version (`winver`)
- Node.js version (`node --version`)
- Python version (`python --version`)
- Full error message
- Steps to reproduce
- Server terminal output

---

**🌟 Welcome to the SMART Business Ecosystem on Windows!**

*The world's first complete blockchain-operated business platform now runs seamlessly on Windows, Linux, and macOS.*