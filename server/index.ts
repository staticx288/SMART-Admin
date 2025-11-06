import express, { type Request, Response, NextFunction } from "express";
import cookieParser from 'cookie-parser';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dgram from 'dgram';
import os from 'os';
import fs from 'fs';
import path from 'path';

/**
 * Initialize SMART-ID Generator with all existing IDs to prevent duplicates
 */
async function initializeSmartIdGenerator() {
  try {
    const { SmartIdGenerator } = await import('./smart-id-generator');
    const existingIds: string[] = [];

    // Load IDs from active modules cache
    const modulesCache = './data/modules_cache.json';
    if (fs.existsSync(modulesCache)) {
      try {
        const modules = JSON.parse(fs.readFileSync(modulesCache, 'utf8'));
        modules.forEach((mod: any) => {
          if (mod.moduleId) existingIds.push(mod.moduleId);
        });
        console.log(`🔍 Loaded ${modules.length} active module IDs`);
      } catch (error) {
        console.error('Error loading active module IDs:', error);
      }
    }

    // Load IDs from deprecated modules cache  
    const deprecatedCache = './data/deprecated_modules_cache.json';
    if (fs.existsSync(deprecatedCache)) {
      try {
        const deprecated = JSON.parse(fs.readFileSync(deprecatedCache, 'utf8'));
        deprecated.forEach((mod: any) => {
          if (mod.moduleId) existingIds.push(mod.moduleId);
        });
        console.log(`🔍 Loaded ${deprecated.length} deprecated module IDs`);
      } catch (error) {
        console.error('Error loading deprecated module IDs:', error);
      }
    }

    // Load IDs from equipment data
    const equipmentData = './data/equipment-data.json';
    if (fs.existsSync(equipmentData)) {
      try {
        const equipment = JSON.parse(fs.readFileSync(equipmentData, 'utf8'));
        equipment.forEach((eq: any) => {
          if (eq.smartId) existingIds.push(eq.smartId);
        });
        console.log(`🔍 Loaded ${equipment.length} equipment IDs`);
      } catch (error) {
        console.error('Error loading equipment IDs:', error);
      }
    }

    // Load IDs from domain data
    const domainsPath = './data/domains';
    if (fs.existsSync(domainsPath)) {
      try {
        const domainDirs = fs.readdirSync(domainsPath);
        domainDirs.forEach(dir => {
          const configPath = path.join(domainsPath, dir, 'domain-config.json');
          if (fs.existsSync(configPath)) {
            try {
              const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
              if (config.domainId) existingIds.push(config.domainId);
              if (config.ecosystemSmartID) existingIds.push(config.ecosystemSmartID);
              // Load module instance IDs
              if (config.moduleInstances) {
                config.moduleInstances.forEach((inst: any) => {
                  if (inst.moduleSmartId) existingIds.push(inst.moduleSmartId);
                  if (inst.domainSmartId) existingIds.push(inst.domainSmartId);
                });
              }
            } catch (error) {
              console.error(`Error loading domain config ${dir}:`, error);
            }
          }
        });
        console.log(`🔍 Loaded domain IDs from ${domainDirs.length} domains`);
      } catch (error) {
        console.error('Error loading domain IDs:', error);
      }
    }

    // Load IDs from nodes data
    const nodesData = './data/nodes-data.json';
    if (fs.existsSync(nodesData)) {
      try {
        const nodes = JSON.parse(fs.readFileSync(nodesData, 'utf8'));
        nodes.forEach((node: any) => {
          if (node.smartId) existingIds.push(node.smartId);
        });
        console.log(`🔍 Loaded ${nodes.length} node IDs`);
      } catch (error) {
        console.error('Error loading node IDs:', error);
      }
    }

    // Initialize generator with all collected IDs
    await SmartIdGenerator.initialize(existingIds);
    
    const stats = SmartIdGenerator.getStats();
    console.log(`🆔 SMART-ID Generator initialized: ${stats.total} existing IDs protected`);
    console.log(`📊 ID breakdown:`, stats.byType);

  } catch (error) {
    console.error('Failed to initialize SMART-ID Generator:', error);
  }
}

// System status tracking
export const systemStatus = {
  nodeDiscoveryOnline: false,
  moduleScannerOnline: false,
  udpServer: null as any,
  lastModuleScan: null as Date | null,
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Setup UDP discovery server for SmartNode agents
function setupDiscoveryServer(httpPort: number) {
  const udpServer = dgram.createSocket('udp4');
  const discoveryPort = 8765;
  
  // Store discovered agents
  const discoveredAgents = new Map<string, any>();

  udpServer.on('message', (msg, rinfo) => {
    try {
      const message = JSON.parse(msg.toString());
      
      if (message.type === 'smart_node_discovery') {
        log(`🔍 Discovery request from ${rinfo.address}:${rinfo.port}`);
        
        // Respond with hub information
        const response = JSON.stringify({
          type: 'smart_hub_response',
          hub_name: 'SmartAdmin Hub',
          port: httpPort,
          timestamp: Date.now()
        });
        
        udpServer.send(response, rinfo.port, rinfo.address, (err) => {
          if (err) {
            log(`Failed to send discovery response: ${err.message}`);
          } else {
            log(`📡 Sent discovery response to ${rinfo.address}:${rinfo.port}`);
          }
        });
      } 
      else if (message.type === 'smart_agent_broadcast') {
        const agentIP = message.ip || rinfo.address;
        
        // Store agent broadcast for discovery
        const agentKey = `${agentIP}:${message.port || 22}`;
        discoveredAgents.set(agentKey, {
          ip: agentIP,
          hostname: message.hostname || 'Unknown',
          port: message.port || message.ssh_port || 22,
          ssh_port: message.ssh_port || 22,
          capabilities: message.capabilities || [],
          device_type: message.device_type || 'edge_device',
          resources: message.resources || null, // Store the resources data!
          system_info: message.system_info || null, // Store system info
          device_info: message.system_info || {
            os: 'Linux', // Default
            arch: 'unknown'
          },
          last_seen: new Date().toISOString(),
          source: 'udp_broadcast'
        });
        
        // Also update lastSeen for existing registered nodes
        try {
          const nodesFile = path.resolve(process.cwd(), 'data/nodes-data.json');
          
          if (fs.existsSync(nodesFile)) {
            const data = fs.readFileSync(nodesFile, 'utf8');
            let nodes = JSON.parse(data) || [];
            
            // Find and update the node with this IP
            const nodeIndex = nodes.findIndex((node: any) => node.ipAddress === agentIP);
            if (nodeIndex !== -1) {
              nodes[nodeIndex].lastSeen = new Date().toISOString();
              nodes[nodeIndex].status = 'online'; // Mark as online when broadcasting
              fs.writeFileSync(nodesFile, JSON.stringify(nodes, null, 2));
            }
          }
        } catch (error) {
          log(`Error updating node lastSeen: ${error}`);
        }
        
        // Log with resource info
        const resourceInfo = message.resources ? 
          `${message.resources.cpu_cores}c/${message.resources.memory_gb}GB RAM` : 
          'unknown resources';
        
        log(`📻 Agent broadcast from ${message.hostname || 'Unknown'} (${agentIP}) - ${resourceInfo}`);
      }
    } catch (error) {
      log(`Error parsing discovery message: ${error}`);
    }
  });

  udpServer.on('listening', () => {
    const address = udpServer.address();
    log(`🔍 UDP discovery server listening on ${address.address}:${address.port}`);
    systemStatus.nodeDiscoveryOnline = true;
    systemStatus.udpServer = udpServer;
  });

  udpServer.on('error', (err) => {
    log(`UDP discovery server error: ${err}`);
    systemStatus.nodeDiscoveryOnline = false;
  });

  udpServer.on('close', () => {
    log('UDP discovery server closed');
    systemStatus.nodeDiscoveryOnline = false;
  });

  udpServer.bind(discoveryPort, '0.0.0.0');
  
  // Make discovered agents accessible to routes
  (global as any).discoveredAgents = discoveredAgents;
  
  // Clean up old agents and update node status every 10 seconds
  setInterval(() => {
    const now = Date.now();
    const staleKeys: string[] = [];
    
    // First, update node statuses based on recent broadcasts
    try {
      const nodesFile = path.resolve(process.cwd(), 'data/nodes-data.json');
      
      if (fs.existsSync(nodesFile)) {
        const data = fs.readFileSync(nodesFile, 'utf8');
        let nodes = JSON.parse(data) || [];
        let nodesUpdated = false;
        
        nodes.forEach((node: any) => {
          const agentKey = `${node.ipAddress}:${node.sshPort || 22}`;
          const agent = discoveredAgents.get(agentKey);
          const lastSeenTime = agent ? new Date(agent.last_seen).getTime() : new Date(node.lastSeen).getTime();
          
          // Mark as offline if not seen for more than 10 seconds
          const shouldBeOffline = now - lastSeenTime > 10000;
          
          if (shouldBeOffline && node.status !== 'offline') {
            node.status = 'offline';
            nodesUpdated = true;
            log(`📴 Marked node ${node.name} (${node.ipAddress}) as offline - not seen for ${Math.round((now - lastSeenTime) / 1000)}s`);
          }
          // Don't automatically mark as online here - that's done when broadcast is received
        });
        
        if (nodesUpdated) {
          fs.writeFileSync(nodesFile, JSON.stringify(nodes, null, 2));
        }
      }
    } catch (error) {
      log(`Error updating node statuses: ${error}`);
    }
    
    // Then clean up stale discovered agents (but only unregistered ones)
    discoveredAgents.forEach((agent, key) => {
      const agentTime = new Date(agent.last_seen).getTime();
      
      // Only remove if stale AND not already registered in the system
      if (now - agentTime > 10000) { // 10 seconds - agents are stale if not seen for 10 seconds
        // Check if this agent is already registered by loading nodes data
        let isRegistered = false;
        try {
          const nodesFile = path.resolve(process.cwd(), 'data/nodes-data.json');
          if (fs.existsSync(nodesFile)) {
            const data = fs.readFileSync(nodesFile, 'utf8');
            const registeredNodes = JSON.parse(data) || [];
            isRegistered = registeredNodes.some((node: any) => node.ipAddress === agent.ip);
          }
        } catch (error) {
          log(`Error checking if agent is registered: ${error}`);
        }
        
        if (!isRegistered) {
          // Only remove unregistered agents when they go stale
          staleKeys.push(key);
        }
        // Registered agents stay in discovery list even when not broadcasting
        // They'll be marked offline by the status update logic above
      }
    });
    
    staleKeys.forEach(key => {
      const agent = discoveredAgents.get(key);
      discoveredAgents.delete(key);
      log(`🗑️ Removed stale UNREGISTERED agent: ${agent?.hostname} (${agent?.ip}) - not seen for ${Math.round((now - new Date(agent?.last_seen || 0).getTime()) / 1000)}s`);
    });
  }, 10000); // Run cleanup every 10 seconds
  
  return udpServer;
}

// Setup automatic module scanning
async function setupModuleScanner() {
  const { SimpleModuleScanner } = await import('./module-scanner-simple');
  
  // Initial scan
  try {
    await SimpleModuleScanner.scanModules();
    log('📦 Initial module scan completed');
    systemStatus.moduleScannerOnline = true;
  } catch (error) {
    log(`❌ Initial module scan failed: ${error}`);
    systemStatus.moduleScannerOnline = false;
  }
  
  // Periodic scanning every 20 seconds for responsive module detection
  setInterval(async () => {
    try {
      // Import the actual module scanning logic that adds to cache
      const { performModuleScan } = await import('./infrastructure-express-routes');
      const result = await performModuleScan('system'); // Automatic system scan
      systemStatus.moduleScannerOnline = true;
      
      // Only log if new modules were found to avoid spam
      if (result.success && 'newModulesFound' in result && result.newModulesFound > 0) {
        log(`🆕 Automatic scan found ${result.newModulesFound} new modules`);
      }
    } catch (error) {
      log(`❌ Module scan failed: ${error}`);
      systemStatus.moduleScannerOnline = false;
    }
  }, 20000); // 20 seconds
}

(async () => {
  const server = await registerRoutes(app);

  // Initialize SMART-ID Generator with all existing IDs to prevent duplicates
  await initializeSmartIdGenerator();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5001 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5001', 10);
  
  // Setup UDP discovery server
  const udpServer = setupDiscoveryServer(port);
  
  server.listen({
    port,
    host: "0.0.0.0", // Changed from localhost to allow network access
    reusePort: false,
  }, async () => {
    log(`serving on port ${port}`);
    log(`🌐 Admin interface accessible at http://0.0.0.0:${port}`);
    
    // Initialize module scanner status
    setupModuleScanner();
    
    // System startup is now logged to SMART-Ledger via system ledger
    console.log('📝 Activity: system - start - SMART Admin Console - System started on port ' + port);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    log('Shutting down gracefully...');
    udpServer.close();
    process.exit(0);
  });
})();
