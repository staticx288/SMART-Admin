import type { Express } from "express";
import { createServer, type Server } from "http";
import { SettingsManager } from "./settings";
import { registerInfrastructureRoutes } from "./infrastructure-express-routes";
import { setupAuthRoutes } from "./auth-routes";
import { setupLedgerRoutes } from "./ledger-routes";
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Helper function to update node status based on last seen
export function updateNodeStatuses(nodes: any[]): any[] {
  const now = new Date();
  const offlineThreshold = 90000; // 90 seconds - allow for 30s broadcast + 60s tolerance
  
  return nodes.map(node => {
    const lastSeen = new Date(node.lastSeen);
    const timeSinceLastSeen = now.getTime() - lastSeen.getTime();
    
    // Update status based on last seen time
    const newStatus = timeSinceLastSeen > offlineThreshold ? 'offline' : 'online';
    
    return {
      ...node,
      status: newStatus
    };
  });
}

// Network monitoring function for equipment
async function pingHost(ip: string): Promise<{ online: boolean; responseTime?: number; error?: string }> {
  try {
    // Use ping with timeout and single packet
    const isWindows = process.platform === 'win32';
    const pingCmd = isWindows 
      ? `ping -n 1 -w 3000 ${ip}` 
      : `ping -c 1 -W 3 ${ip}`;
    
    const startTime = Date.now();
    const { stdout } = await execAsync(pingCmd);
    const responseTime = Date.now() - startTime;
    
    // Check if ping was successful (basic check for "ttl" or "TTL" in output)
    const isOnline = stdout.toLowerCase().includes('ttl');
    
    return {
      online: isOnline,
      responseTime: isOnline ? responseTime : undefined
    };
  } catch (error) {
    return {
      online: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Network monitoring service
async function updateNetworkStatuses(): Promise<void> {
  try {
    const equipmentFile = path.resolve(process.cwd(), 'data/equipment-data.json');
    
    if (!fs.existsSync(equipmentFile)) {
      return;
    }
    
    const data = fs.readFileSync(equipmentFile, 'utf8');
    let equipment = JSON.parse(data) || [];
    
    let updated = false;
    
    // Update network status for equipment with monitoring enabled
    for (const item of equipment) {
      if (item.category === 'networking' && 
          item.network_info?.monitor_enabled && 
          item.network_info?.ip_address) {
        
        const pingResult = await pingHost(item.network_info.ip_address);
        
        // Update network status
        item.network_status = {
          online: pingResult.online,
          response_time: pingResult.responseTime,
          last_ping: new Date().toISOString(),
          packet_loss: pingResult.online ? 0 : 100
        };
        
        updated = true;
        console.log(`📡 Network status updated for ${item.name} (${item.network_info.ip_address}): ${pingResult.online ? 'ONLINE' : 'OFFLINE'}`);
      }
    }
    
    // Write back updated equipment if any changes were made
    if (updated) {
      fs.writeFileSync(equipmentFile, JSON.stringify(equipment, null, 2));
    }
  } catch (error) {
    console.error('❌ Error updating network statuses:', error);
  }
}

// Start network monitoring service
let networkMonitoringInterval: NodeJS.Timeout | null = null;
function startNetworkMonitoring(): void {
  if (networkMonitoringInterval) {
    clearInterval(networkMonitoringInterval);
  }
  
  console.log('🌐 Starting network equipment monitoring service...');
  
  // Run initial check
  updateNetworkStatuses();
  
  // Schedule regular checks every 30 seconds
  networkMonitoringInterval = setInterval(() => {
    updateNetworkStatuses();
  }, 30000);
}

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('🎨 Minimal dashboard-only server starting...');
  
  // Register authentication routes first
  setupAuthRoutes(app);
  
  // Register ledger routes (Custodian system)
  setupLedgerRoutes(app);
  
  // Register infrastructure routes (modules, domains, etc.)
  await registerInfrastructureRoutes(app);
  
  // Start network equipment monitoring service
  startNetworkMonitoring();
  
  // Basic health endpoint for dashboard
  app.get("/api/health", async (req, res) => {
    res.json({ 
      status: "healthy", 
      message: "Dashboard ready - Revolutionary system coming soon",
      timestamp: new Date().toISOString()
    });
  });



  // Node management endpoints for SMART-Node agents
  app.get("/api/nodes", async (req, res) => {
    try {
      const nodesFile = path.resolve(process.cwd(), 'data/nodes-data.json');
      
      if (fs.existsSync(nodesFile)) {
        const data = fs.readFileSync(nodesFile, 'utf8');
        let nodes = JSON.parse(data) || [];
        
        // Update node statuses based on last seen
        nodes = updateNodeStatuses(nodes);
        
        // Write back updated statuses to file
        fs.writeFileSync(nodesFile, JSON.stringify(nodes, null, 2));
        
        res.json(nodes);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error('Error loading nodes:', error);
      res.status(500).json({ error: 'Failed to load nodes' });
    }
  });

  // Node Discovery - Listen for UDP broadcasts from SmartNode agents
  app.post("/api/nodes/discover", async (req, res) => {
    try {
      console.log("🔍 Retrieving discovered agents from UDP broadcasts...");
      
      // Get discovered agents from the global store (set by UDP server)
      const discoveredAgents = (global as any).discoveredAgents as Map<string, any>;
      
      if (!discoveredAgents) {
        return res.status(500).json({
          success: false,
          error: "UDP discovery server not available",
          details: "Discovery service may not be running"
        });
      }
      
      // Convert Map to array and group by hostname to combine interfaces
      const agents: any[] = Array.from(discoveredAgents.values());
      
      // Group agents by hostname - combine multiple interfaces from same device
      const agentsByHostname = new Map<string, any>();
      
      agents.forEach(agent => {
        const hostname = agent.hostname || agent.system_info?.hostname;
        
        if (!hostname) {
          console.error('Agent missing hostname, skipping:', agent);
          return; // Skip agents without valid hostname
        }
        
        if (!agent.interface) {
          console.error('Agent missing interface name, skipping:', agent);
          return; // Skip agents without valid interface
        }
        
        if (!agent.interface_type) {
          console.error('Agent missing interface type, skipping:', agent);
          return; // Skip agents without interface type
        }
        
        if (agentsByHostname.has(hostname)) {
          // Add this interface to existing agent
          const existing = agentsByHostname.get(hostname);
          if (!existing.interfaces) {
            if (!existing.interface) {
              throw new Error(`Existing agent for ${hostname} missing interface data`);
            }
            existing.interfaces = [{
              name: existing.interface,
              ip: existing.ip,
              broadcast: existing.broadcast,
              type: existing.interface_type
            }];
          }
          existing.interfaces.push({
            name: agent.interface,
            ip: agent.ip,
            broadcast: agent.broadcast,
            type: agent.interface_type
          });
        } else {
          // First time seeing this hostname
          agentsByHostname.set(hostname, {
            ...agent,
            interfaces: [{
              name: agent.interface,
              ip: agent.ip,
              broadcast: agent.broadcast,
              type: agent.interface_type
            }]
          });
        }
      });
      
      // Convert back to array
      const groupedAgents = Array.from(agentsByHostname.values());
      
      // Get existing nodes to filter
      const nodesFile = path.resolve(process.cwd(), 'data/nodes-data.json');
      let existingNodes: any[] = [];
      
      if (fs.existsSync(nodesFile)) {
        const data = fs.readFileSync(nodesFile, 'utf8');
        existingNodes = JSON.parse(data) || [];
      }
      
      // Filter out already registered agents by hostname OR IP address
      const newAgents = groupedAgents.filter(agent => {
        const agentHostname = (agent.hostname || agent.system_info?.hostname || '').toLowerCase();
        const agentIps = agent.interfaces?.map((i: any) => i.ip) || [agent.ip];
        
        // Check if any registered node matches this agent's hostname or IP
        const isAlreadyRegistered = existingNodes.some((node: any) => {
          const nodeHostname = (node.name || node.platformInfo?.hostname || '').toLowerCase();
          const nodeIp = node.ipAddress;
          
          // Match by hostname (if names match) or by IP address
          return (agentHostname && nodeHostname === agentHostname) || 
                 agentIps.includes(nodeIp);
        });
        
        return !isAlreadyRegistered;
      });
      
      console.log(`Found ${agents.length} broadcasts from ${groupedAgents.length} unique devices, ${newAgents.length} new`);
      
      res.json({
        success: true,
        discovered_agents: newAgents,
        stats: {
          packets_received: agents.length,
          unique_agents: groupedAgents.length,
          already_registered: groupedAgents.length - newAgents.length,
          all_broadcasting: agents.map((a: any) => ({
            ip: a.ip,
            hostname: a.hostname,
            interface: a.interface
          }))
        },
        message: "Retrieved broadcasting agents from UDP discovery (grouped by device)",
        discovery_time: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Node discovery error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve broadcasting agents",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Node Agent Registration - for auto-registration from SMARTNodeAgent
  app.post("/api/nodes/register", async (req, res) => {
    try {
      console.log("🤖 Node agent registration attempt:", req.body);
      
      const agentData = req.body;
      const nodesFile = path.resolve(process.cwd(), 'data/nodes-data.json');
      
      let nodes = [];
      if (fs.existsSync(nodesFile)) {
        const data = fs.readFileSync(nodesFile, 'utf8');
        nodes = JSON.parse(data) || [];
      }
      
      // Generate SMART-ID for nodes
      const { SmartIdGenerator } = await import('./smart-id-generator');
      const generateSmartId = () => {
        return SmartIdGenerator.generateNodeId();
      };

      // Get platform info from discovered agents if available
      const discoveredAgents = (global as any).discoveredAgents as Map<string, any>;
      let platformInfo = null;
      
      if (discoveredAgents) {
        // Find the agent data for this IP
        discoveredAgents.forEach((agent, key) => {
          if (agent.ip === agentData.ipAddress) {
            // Extract platform information from the broadcast data - require all fields
            const os = agent.system_info?.os || agent.device_info?.os;
            const architecture = agent.system_info?.architecture;
            const platform = agent.system_info?.platform;
            
            if (!os || !architecture || !platform) {
              throw new Error(`Agent ${agent.hostname} missing required platform info: os=${os}, arch=${architecture}, platform=${platform}`);
            }
            
            platformInfo = {
              os,
              architecture,
              platform,
              deviceModel: agent.device_info?.model || agent.system_info?.hostname,
              version: agent.device_info?.android_version || agent.system_info?.version
            };
          }
        });
      }

      // Create node from agent registration data
      const newNode = {
        id: Date.now().toString(),
        name: agentData.name || `Node-${Date.now()}`,
        type: agentData.type || 'smart_station_node',
        ipAddress: agentData.ipAddress || '127.0.0.1',
        sshPort: agentData.sshPort || 22,
        capabilities: agentData.capabilities || ['auto-discovered'],
        resources: agentData.resources || { cpuCores: 1, ramGb: 1, storageGb: 32 },
        status: agentData.status || 'online',
        smartId: generateSmartId(), // Auto-assigned SMART-ID
        platformInfo: platformInfo, // Store the rich platform data
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      nodes.push(newNode);
      fs.writeFileSync(nodesFile, JSON.stringify(nodes, null, 2));
      
      console.log(`✅ Registered agent: ${newNode.name} (${newNode.ipAddress})`);
      
            // Activity logging now handled by SMART-Ledger system
      
      res.json({
        success: true,
        id: newNode.id,
        node: newNode,
        message: "Node registered successfully",
        smart_id: newNode.smartId
      });
    } catch (error) {
      console.error('Error registering node agent:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to register node agent',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create/Register new node (manual registration from UI)
  app.post("/api/nodes", async (req, res) => {
    try {
      const nodeData = req.body;
      const nodesFile = path.resolve(process.cwd(), 'data/nodes-data.json');
      
      let nodes = [];
      if (fs.existsSync(nodesFile)) {
        const data = fs.readFileSync(nodesFile, 'utf8');
        nodes = JSON.parse(data) || [];
      }
      
      // Generate proper Node SMART-ID 
      const { SmartIdGenerator } = await import('./smart-id-generator');
      const generateSmartId = () => {
        return SmartIdGenerator.generateNodeId();
      };

      // Get platform info from discovered agents if available
      const discoveredAgents = (global as any).discoveredAgents as Map<string, any>;
      let platformInfo = null;
      
      if (discoveredAgents) {
        discoveredAgents.forEach((agent, key) => {
          if (agent.ip === nodeData.ipAddress) {
            // Require all platform fields
            const os = agent.system_info?.os || agent.device_info?.os;
            const architecture = agent.system_info?.architecture;
            const platform = agent.system_info?.platform;
            
            if (!os || !architecture || !platform) {
              throw new Error(`Agent ${agent.hostname} missing required platform info: os=${os}, arch=${architecture}, platform=${platform}`);
            }
            
            platformInfo = {
              os,
              architecture,
              platform,
              deviceModel: agent.device_info?.model || agent.system_info?.hostname,
              version: agent.device_info?.android_version || agent.system_info?.version
            };
          }
        });
      }

      // Add node with generated data
      const newNode = {
        id: Date.now().toString(),
        name: nodeData.name,
        type: nodeData.type,
        ipAddress: nodeData.ipAddress,
        sshPort: nodeData.sshPort || 22,
        capabilities: nodeData.capabilities || ['registered'],
        resources: nodeData.resources || { cpuCores: 1, ramGb: 1, storageGb: 1 },
        networkInterfaces: nodeData.networkInterfaces || [],
        status: 'online',
        smartId: nodeData.smartId || generateSmartId(), // Auto-assigned fake SMART-ID
        platformInfo: platformInfo, // Include platform data
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      nodes.push(newNode);
      fs.writeFileSync(nodesFile, JSON.stringify(nodes, null, 2));
      
      // Activity logging now handled by SMART-Ledger system
      
      res.json({
        success: true,
        node: newNode,
        message: "Node registered successfully"
      });
    } catch (error) {
      console.error('Error creating node:', error);
      res.status(500).json({ error: 'Failed to create node' });
    }
  });

  // Update node
  app.put("/api/nodes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const nodesFile = path.resolve(process.cwd(), 'data/nodes-data.json');
      
      if (fs.existsSync(nodesFile)) {
        const data = fs.readFileSync(nodesFile, 'utf8');
        let nodes = JSON.parse(data) || [];
        
        const nodeIndex = nodes.findIndex((node: any) => node.id === id);
        if (nodeIndex === -1) {
          return res.status(404).json({ error: 'Node not found' });
        }
        
        nodes[nodeIndex] = {
          ...nodes[nodeIndex],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(nodesFile, JSON.stringify(nodes, null, 2));
        
        res.json({
          success: true,
          node: nodes[nodeIndex],
          message: 'Node updated successfully'
        });
      } else {
        res.status(404).json({ error: 'Node not found' });
      }
    } catch (error) {
      console.error('Error updating node:', error);
      res.status(500).json({ error: 'Failed to update node' });
    }
  });

  // Delete node
  app.delete("/api/nodes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const nodesFile = path.resolve(process.cwd(), 'data/nodes-data.json');
      
      if (fs.existsSync(nodesFile)) {
        const data = fs.readFileSync(nodesFile, 'utf8');
        let nodes = JSON.parse(data) || [];
        
        // Find the node before deleting for activity log
        const deletedNode = nodes.find((node: any) => node.id === id);
        
        nodes = nodes.filter((node: any) => node.id !== id);
        fs.writeFileSync(nodesFile, JSON.stringify(nodes, null, 2));
        
        // Activity logging now handled by SMART-Ledger system
        
        res.json({
          success: true,
          message: 'Node deleted successfully'
        });
      } else {
        res.status(404).json({ error: 'Node not found' });
      }
    } catch (error) {
      console.error('Error deleting node:', error);
      res.status(500).json({ error: 'Failed to delete node' });
    }
  });

  // Node heartbeat - from SMARTNodeAgent
  app.post("/api/nodes/:id/heartbeat", async (req, res) => {
    try {
      const { id } = req.params;
      const heartbeatData = req.body;
      const nodesFile = path.resolve(process.cwd(), 'data/nodes-data.json');
      
      if (fs.existsSync(nodesFile)) {
        const data = fs.readFileSync(nodesFile, 'utf8');
        let nodes = JSON.parse(data) || [];
        
        const nodeIndex = nodes.findIndex((node: any) => node.id === id);
        if (nodeIndex === -1) {
          return res.status(404).json({ error: 'Node not found' });
        }
        
        // Update node with heartbeat data
        nodes[nodeIndex] = {
          ...nodes[nodeIndex],
          status: 'online',
          lastSeen: new Date().toISOString(),
          lastHeartbeat: heartbeatData.timestamp || Date.now()
        };
        
        // Update status if provided
        if (heartbeatData.status) {
          nodes[nodeIndex].currentStatus = heartbeatData.status;
        }
        
        fs.writeFileSync(nodesFile, JSON.stringify(nodes, null, 2));
        
        res.json({
          success: true,
          message: 'Heartbeat received'
        });
      } else {
        res.status(404).json({ error: 'Node not found' });
      }
    } catch (error) {
      console.error('Error processing heartbeat:', error);
      res.status(500).json({ error: 'Failed to process heartbeat' });
    }
  });

  app.get("/api/infrastructure/deployments", async (req, res) => {
    res.json([]);
  });

  app.get("/api/infrastructure/domains", async (req, res) => {
    res.json([]);
  });

  // Equipment settings endpoints
  app.get("/api/equipment/settings", async (req, res) => {
    try {
      const settingsFile = path.resolve(process.cwd(), 'equipment-settings.json');
      
      if (fs.existsSync(settingsFile)) {
        const data = fs.readFileSync(settingsFile, 'utf8');
        const settings = JSON.parse(data);
        res.json({ settings });
      } else {
        // Return default NDT settings
        const defaultSettings = {
          categories: {
            testing: {
              name: "Testing Equipment",
              description: "Non-destructive testing equipment and instruments",
              types: ["ultrasonic", "radiographic", "magnetic_particle", "dye_penetrant", "eddy_current", "visual"]
            },
            welding: {
              name: "Welding Equipment", 
              description: "Welding machines, torches, and related equipment",
              types: ["arc_welder", "mig_welder", "tig_welder", "plasma_cutter", "torch", "electrodes"]
            },
            chemical: {
              name: "Chemical Processing",
              description: "Chemical processing tanks, mixers, and equipment",
              types: ["mixing_tank", "storage_tank", "reactor", "pump", "valve", "filter"]
            },
            inspection: {
              name: "Inspection Tools",
              description: "Visual and measurement inspection equipment",
              types: ["borescope", "caliper", "gauge", "microscope", "camera", "probe"]
            },
            coating: {
              name: "Coating Equipment",
              description: "Surface coating and treatment equipment", 
              types: ["spray_gun", "oven", "booth", "blaster", "cleaner", "applicator"]
            },
            networking: {
              name: "Network Infrastructure",
              description: "Networking and communication equipment",
              types: ["router", "switch", "gateway", "antenna", "cable", "modem"]
            },
            measurement: {
              name: "Measurement Tools",
              description: "Precision measurement and calibration equipment",
              types: ["multimeter", "oscilloscope", "pressure_gauge", "flow_meter", "scale", "sensor"]
            },
            safety: {
              name: "Safety Equipment",
              description: "Safety and protective equipment",
              types: ["gas_detector", "alarm", "barrier", "ventilation", "emergency_stop", "ppe"]
            }
          },
          certifications: [
            "ASNT Level I", "ASNT Level II", "ASNT Level III",
            "AWS Certified", "API 510", "API 570", "API 653",
            "NACE Certified", "ISO 9712", "EN 473",
            "SNT-TC-1A", "CGSB-48", "ACCP"
          ],
          connectivityOptions: [
            "ethernet", "wifi", "bluetooth", "usb", "serial", "rs485"
          ],
          statusOptions: ["operational", "maintenance", "offline", "error"]
        };
        res.json({ settings: defaultSettings });
      }
    } catch (error) {
      console.error('Error loading equipment settings:', error);
      res.status(500).json({ error: 'Failed to load equipment settings' });
    }
  });

  app.post("/api/equipment/settings", async (req, res) => {
    try {
      const { settings } = req.body;
      const settingsFile = path.resolve(process.cwd(), 'equipment-settings.json');
      
      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
      
      res.json({ 
        success: true, 
        message: 'Equipment settings saved successfully' 
      });
    } catch (error) {
      console.error('Error saving equipment settings:', error);
      res.status(500).json({ error: 'Failed to save equipment settings' });
    }
  });

  // Equipment CRUD endpoints
  app.get("/api/equipment", async (req, res) => {
    try {
      const equipmentFile = path.resolve(process.cwd(), 'data/equipment-data.json');
      
      if (fs.existsSync(equipmentFile)) {
        const data = fs.readFileSync(equipmentFile, 'utf8');
        const equipment = JSON.parse(data);
        res.json(equipment || []);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
      res.status(500).json({ error: 'Failed to load equipment' });
    }
  });

  app.post("/api/equipment", async (req, res) => {
    try {
      const newEquipment = req.body;
      const equipmentFile = path.resolve(process.cwd(), 'data/equipment-data.json');
      
      let equipment = [];
      if (fs.existsSync(equipmentFile)) {
        const data = fs.readFileSync(equipmentFile, 'utf8');
        equipment = JSON.parse(data) || [];
      }
      
      // Add ID if not provided
      if (!newEquipment.id) {
        newEquipment.id = Date.now().toString();
      }
      
      equipment.push(newEquipment);
      fs.writeFileSync(equipmentFile, JSON.stringify(equipment, null, 2));
      
      res.json({ 
        success: true, 
        equipment: newEquipment,
        message: 'Equipment added successfully' 
      });
    } catch (error) {
      console.error('Error saving equipment:', error);
      res.status(500).json({ error: 'Failed to save equipment' });
    }
  });

  app.delete("/api/equipment/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const equipmentFile = path.resolve(process.cwd(), 'data/equipment-data.json');
      
      if (fs.existsSync(equipmentFile)) {
        const data = fs.readFileSync(equipmentFile, 'utf8');
        let equipment = JSON.parse(data) || [];
        
        equipment = equipment.filter((item: any) => item.id !== id);
        fs.writeFileSync(equipmentFile, JSON.stringify(equipment, null, 2));
        
        res.json({ 
          success: true, 
          message: 'Equipment deleted successfully' 
        });
      } else {
        res.status(404).json({ error: 'Equipment not found' });
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      res.status(500).json({ error: 'Failed to delete equipment' });
    }
  });

  const server = createServer(app);
  console.log('✅ Dashboard-only server ready - All 4 tabs will load properly');
  return server;
}
