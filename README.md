# 🌟 SMART-Admin

**The World's First Complete Blockchain-Operated Business Platform**

Revolutionary hub-centric distributed architecture transforming how companies operate with complete transparency, automated compliance, and cryptographic verification of all business processes.

## 🚀 Quick Start

### Linux/macOS
```bash
./scripts/start-dev.sh
```

### Windows
```cmd
scripts\start-dev.bat
```

**Access Points:**
- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:5001

## 📋 System Requirements

- **Node.js 18+** with npm
- **Python 3.8+** with pip
- **4GB RAM minimum** (8GB recommended)
- **Network access** for node discovery

## 🛠️ Platform-Specific Setup

### 🐧 Linux / 🍎 macOS
```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Install Python packages
pip install -r smart_node_agent/requirements.txt

# Start development server
./scripts/start-dev.sh
```

### 🪟 Windows
See detailed setup guide: **[docs/Windows-Setup.md](docs/Windows-Setup.md)**

```cmd
# Quick setup
git clone https://github.com/staticx288/SMART-Admin.git
cd SMART-Admin
npm install
cd client && npm install && cd ..
python -m pip install -r smart_node_agent/requirements.txt
scripts\start-dev.bat
```

## 🏗️ Architecture Overview

SMART-Admin is built on a **hub-centric distributed architecture** with four core pillars:

| Core Element | Role | Nickname |
|--------------|------|----------|
| **Modules** | 13 specialist assistants handling monitoring | **Specialists** |
| **SmartContracts** | Define operational rules and parameters | **Governors** |
| **Ledger** | Record every action immutably | **Custodian** |
| **Access** | Control permissions, identity, and tokens | **Guardian** |

### Hub Systems (Management Layer)
- **🛡️ Vault Hub**: AI powerhouse & security authority (air-gapped)
- **💼 Business Hub**: External interface gateway (internet connected) 
- **🏭 Floor Hub**: Manufacturing coordination (air-gapped)
- **🔧 Developer Workstation**: Admin console & development (internet connected)

### Node Systems (Employee Layer)
- **🤖 Testing Nodes**: Autonomous enforcement with 13 SMART modules per node
- **📡 Discovery Protocol**: UDP broadcasts on port 8765
- **🔗 Blockchain Ledger**: Immutable audit trails

## 🎯 Revolutionary Features

### ✅ Zero-Configuration Philosophy
> *"There Is No Configuration File."*
- **Nodes don't define logic** - they enforce externally supplied SmartContract rules
- YAML-based contracts are human-readable and transparent
- Business rules evolve without code changes or downtime

### 🏢 Hub-Node Organizational Model
- **Hubs act like managers** - create policies, coordinate intelligence
- **Nodes act like employees** - follow instructions, operate autonomously
- **Clear hierarchy** - hubs deploy, nodes execute

### ⛓️ Immutable Operational Integrity
- **Every action** logged to distributed blockchain
- **Real-time enforcement** blocks non-compliant operations
- **Mathematical certainty** replaces trust-based systems
- **Impossible tampering** requires compromising all nodes

## 🚀 Development

### Project Structure
```
SMART-Admin/
├── client/                 # React frontend (Vite + TypeScript)
├── server/                 # Express backend (Node.js + TypeScript)
├── smart_node_agent/       # Python node discovery agent
├── smart_business_module/  # SMART module frameworks
├── data/                   # JSON storage and blockchain ledger
└── docs/                   # Documentation
```

### Key Technologies
- **Frontend**: React + TypeScript + Vite + TailwindCSS + Radix UI
- **Backend**: Express.js + TypeScript (ESM modules)
- **Ledger**: Python blockchain system with hash-chained immutability
- **Discovery**: UDP broadcast protocol for node detection
- **Storage**: File-based JSON with blockchain audit trails

### Development Commands
```bash
# Backend only
npm run dev

# Frontend only  
cd client && npm run dev

# Both (recommended)
./scripts/start-dev.sh     # Linux/macOS
scripts\start-dev.bat      # Windows
```

## 📊 Dashboard Tabs

1. **📊 Overview** - System health, recent activities, node status
2. **🧩 Modules** - SMART module discovery, validation, deployment
3. **🌐 Domain Ecosystems** - Domain creation, SMART-ID assignment, contract management
4. **🤖 Nodes/Hubs** - Node discovery, registration, heartbeat monitoring
5. **🚀 Deployment Engine** - SmartContract deployment pipeline
6. **⚙️ Equipment** - NDT equipment management with certification tracking

## 🤖 SMART Node Agent

Auto-discovers and registers nodes with the admin console:

```bash
# Start node agent
cd smart_node_agent
python UniversalSMARTAgent.py
```

**Features:**
- Cross-platform (Windows, Linux, macOS, Raspberry Pi)
- Hardware detection and capability reporting
- UDP broadcast discovery on port 8765
- Automatic registration with admin console
- Dual network interface support (Ethernet + WiFi)

## 🔐 Security & Compliance

### Air-Gapped Architecture
- **Vault Hub & Floor Hub**: Completely offline
- **Business Hub**: Minimal DMZ gateway
- **Cryptographic Verification**: Mathematical proof of operations
- **Immutable Audit Trails**: Blockchain-secured compliance records

### SMART-ID System
- **Identity Authority**: Generated on Vault Hub
- **Distributed Validation**: Local storage on each device
- **Zero Central Dependency**: Offline operation capability
- **Format Examples**: `MOD-xxxxx`, `USR-xxxxx`, `NOD-xxxxx`

## 🌟 World's First Achievement

**Complete Blockchain-Operated Business Ecosystem**
> While others use blockchain for payments or tracking, SMART-Admin is the world's first **complete business operating system** built natively on distributed ledger technology. Every operational process runs on blockchain infrastructure with cryptographic verification.

### Key Innovations
✅ **Hub-centric distributed architecture** ahead of industry standards  
✅ **Zero-configuration SmartContract deployment** with YAML transparency  
✅ **Mathematical compliance enforcement** vs. trust-based systems  
✅ **Real-time prevention** vs. retrospective detection  
✅ **Distributed autonomous operations** with cryptographic proof  

## 📚 Documentation

- **[Windows Setup Guide](docs/Windows-Setup.md)** - Complete Windows installation
- **[SMART Ecosystem Overview](docs/SMART-ECOSYSTEM-OVERVIEW-V2.md)** - Architecture deep-dive
- **[Node Agent Guide](smart_node_agent/README_IMPROVED.md)** - Node deployment
- **System Architecture**: 47 total SMART frameworks across all components

## 🛠️ Troubleshooting

### Common Issues

**Python Bridge Errors (Windows)**
- Solution: Install Python from python.org and add to PATH
- Verify: `python --version` works in terminal

**Node Discovery Not Working**
- Check Windows Firewall (allow Node.js)
- Ensure UDP port 8765 is open
- Verify all devices on same network

**CRUD Operations Failing**
- Check server logs for Python ledger errors
- Verify `data/ledger/` directory exists and is writable
- Test Python bridge: `python -c "print('Bridge working!')"`

**Permission Errors (Windows)**
- Run terminal as Administrator
- Check antivirus isn't blocking file creation
- Verify Node.js has write permissions to project directory

### Debug Mode
```bash
# Enable debug logging
export DEBUG=smart:*  # Linux/macOS
set DEBUG=smart:*     # Windows
npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Follow TypeScript + ESLint standards
4. Test on multiple platforms (Linux, Windows, macOS)
5. Submit pull request with detailed description

## 📄 License

This project represents revolutionary blockchain business infrastructure. See LICENSE file for details.

## 🎯 The Bottom Line

**We haven't just built software - we've built the future of business operations.**

**SMART provides mathematical certainty, cryptographic proof, and distributed resilience that transforms good intentions into guaranteed results.**

---

**🌟 Welcome to the future of business operations. Welcome to the SMART Ecosystem.**

*The blockchain revolution in enterprise operations starts here, starts now.*