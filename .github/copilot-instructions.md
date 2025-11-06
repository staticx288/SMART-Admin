# SMART-Admin AI Agent Instructions

## Architecture Overview

**SMART Business Ecosystem**: World's first complete blockchain-operated business platform using hub-centric distributed architecture. This is NOT a typical web app - it's an industrial-grade distributed system for aerospace/manufacturing operations.

### Core Philosophy: Create-Deploy-Release
1. **Hubs** (managers) - Create SmartContracts and coordinate intelligence (Vault, Business, Floor, Developer)  
2. **Nodes** (employees) - Execute operations autonomously using distributed SMART modules
3. **Zero vendor lock-in** - Nodes operate independently after SmartContract deployment

## Essential Development Patterns

### Hub-Centric Architecture
- **Vault Hub**: Air-gapped AI powerhouse (AMD Ryzen 7600, 96GB RAM) - security authority
- **Business Hub**: Internet DMZ gateway (Intel i5) - external interface  
- **Floor Hub**: Manufacturing coordination (AMD Ryzen 5600G) - production control
- **Developer Workstation**: Isolated development environment

### SMART-ID Identity System
- Everything requires SMART-ID verification: `MOD-xxxxx`, `USR-xxxxx`, `CLIENT-xxxxx`
- **Local storage only** - each device maintains authorized ID lists offline
- Created on Vault Hub, distributed to nodes - no central auth server

### Module Framework Structure
Located in `smart_business_module/` with standardized framework patterns:
- `Legacy-Module-Frameworks/`: Template frameworks (SMART-ID, SMART-QA, SMART-Safety, etc.)
- Each module follows YAML-based SmartContract configuration
- Modules are discovered, validated, configured, then deployed to nodes

## Key Development Commands

```bash
# Quick startup (recommended)
./start-dev.sh

# Manual startup
npm run dev          # Backend on port 5001  
npx vite            # Frontend on port 5173
```

### SmartContract-Driven Architecture
- No traditional databases - SmartContracts define all data structures and validation
- Immutable blockchain ledger for audit trails and compliance records
- File-based storage for hub configurations and module discovery
- Distributed autonomous execution with cryptographic verification

## Tech Stack Specifics

### Backend (`server/`)
- Express.js with TypeScript (ESM modules)
- UDP discovery server for SmartNode agents on port 8765
- File-based storage for equipment data (JSON files)
- Routes handle infrastructure management and module discovery

### Frontend (`client/`)  
- React + TypeScript with Vite
- Wouter for routing (not React Router)
- Radix UI components + Tailwind CSS
- TanStack Query for data fetching
- Dark theme as default (`smart-ui-theme`)

### Component Architecture
- `infrastructure-layout.tsx` - Main dashboard with 6 tabs
- Infrastructure tabs: Overview, Modules, Domain Ecosystems, Nodes/Hubs, Deployment Engine, Equipment
- Each tab is a separate manager component following infrastructure pattern

## Critical Integration Points

### SmartNode Agent Discovery
- Python agent (`smart_node_agent/SMARTNodeAgent.py`) auto-discovers hubs via UDP broadcast
- Hardware detection for Raspberry Pi, Jetson, Intel NUC classification
- Registers capabilities and maintains heartbeat with admin console

### Module Management Workflow
1. **Discovery**: Scan `smart_business_module/` directory for new frameworks
2. **Validation**: Verify module integrity and SMART-ID compliance  
3. **Configuration**: Set deployment parameters and SmartContract rules
4. **Deployment**: Generate domain SMART-ID and activate on target nodes

### Equipment Management
- Configurable equipment categories: testing, welding, chemical, inspection, coating, networking
- JSON-based storage with certification tracking (ASNT, AWS, API standards)
- Connectivity options: ethernet, wifi, bluetooth, serial protocols

## Domain-Specific Conventions

### SMART Framework Naming
- All modules prefixed with `SMART-` (e.g., `SMART-Vision`, `SMART-Gatekeeper`)  
- Framework types: Hub modules (create/coordinate) vs Node modules (enforce/execute)
- Status progression: discovered → validated → configured → deployed

### Aerospace/Manufacturing Focus
- NDT (Non-Destructive Testing) equipment integration
- AS9100/NADCAP compliance automation  
- Real-time safety monitoring with PPE detection
- Voice-accessible workflows ("Hey SMART" commands)

### Security-First Design
- Air-gapped production systems (Vault/Floor hubs offline)
- Cryptographic verification of all operations
- Token-based governance with competency validation
- Immutable audit trails via distributed ledger

## Development Guidelines

- **File modifications**: Use existing infrastructure patterns in `client/src/components/infrastructure/`
- **New modules**: Follow framework templates in `Legacy-Module-Frameworks/`  
- **SmartContract changes**: Update framework definitions in `smart_business_module/`
- **Equipment features**: Extend JSON configuration system in `server/routes.ts`
- **Node discovery**: Modify UDP broadcast handling in `server/index.ts`

When working on this system, remember you're building industrial blockchain infrastructure, not a typical SaaS application. Everything must be traceable, verifiable, and operable offline.