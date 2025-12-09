import { Express } from "express";
import { z } from "zod";
import { SimpleModuleScanner } from "./module-scanner-simple";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { systemStatus } from "./index";
import { auth } from "./auth";

// For now, use in-memory persistence that survives server restarts by writing to a JSON file
const MODULES_CACHE_FILE = './data/modules_cache.json';
const DEPRECATED_MODULES_CACHE_FILE = './data/deprecated_modules_cache.json';
const NODES_DATA_FILE = './data/nodes-data.json';

interface CachedModule {
  id: string;
  moduleId: string;
  name: string;
  displayName?: string;
  description?: string;
  modulePath: string;
  status: 'discovered' | 'validated' | 'deprecated' | 'deleted';
  lastScanned: string;
  metadata: Record<string, any>;
  createdAt: string;
  deprecatedAt?: string;
  deprecationReason?: string;
}

function loadModulesFromCache(): CachedModule[] {
  try {
    if (fs.existsSync(MODULES_CACHE_FILE)) {
      const data = fs.readFileSync(MODULES_CACHE_FILE, 'utf8');
      const cachedModules = JSON.parse(data);
      
      // Separate active modules from deleted ones
      const activeModules: CachedModule[] = [];
      const deletedModules: CachedModule[] = [];
      
      cachedModules.forEach((module: CachedModule) => {
        const moduleExists = fs.existsSync(module.modulePath);
        if (moduleExists) {
          activeModules.push(module);
        } else {
          console.log(`🗑️ Module directory deleted: ${module.name} (${module.modulePath})`);
          deletedModules.push(module);
        }
      });
      
      // Move deleted modules to deprecated cache for audit purposes
      if (deletedModules.length > 0) {
        deletedModules.forEach(module => {
          moveModuleToDeprecated(module, 'Module directory deleted from filesystem');
        });
        
        console.log(`📝 Updated module cache: ${cachedModules.length} → ${activeModules.length} active modules`);
        console.log(`📦 Moved ${deletedModules.length} deleted modules to deprecated cache for audit compliance`);
        
        // Update active cache with only existing modules
        saveModulesToCache(activeModules);
      }
      
      return activeModules;
    }
  } catch (error) {
    console.error('Failed to load modules from cache:', error);
  }
  return [];
}

function saveModulesToCache(modules: CachedModule[]): void {
  try {
    fs.writeFileSync(MODULES_CACHE_FILE, JSON.stringify(modules, null, 2));
  } catch (error) {
    console.error('Failed to save modules to cache:', error);
  }
}

function loadDeprecatedModules(): CachedModule[] {
  try {
    if (fs.existsSync(DEPRECATED_MODULES_CACHE_FILE)) {
      const data = fs.readFileSync(DEPRECATED_MODULES_CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load deprecated modules:', error);
  }
  return [];
}

function saveDeprecatedModules(modules: CachedModule[]): void {
  try {
    fs.writeFileSync(DEPRECATED_MODULES_CACHE_FILE, JSON.stringify(modules, null, 2));
  } catch (error) {
    console.error('Failed to save deprecated modules:', error);
  }
}

function moveModuleToDeprecated(module: CachedModule, reason: string): void {
  try {
    // Mark module as deprecated
    module.status = 'deleted';
    module.deprecatedAt = new Date().toISOString();
    module.deprecationReason = reason;
    
    // Load existing deprecated modules and add this one
    const deprecatedModules = loadDeprecatedModules();
    deprecatedModules.push(module);
    
    // Save to deprecated cache
    saveDeprecatedModules(deprecatedModules);
    
    console.log(`📦 Moved module to deprecated cache: ${module.name} (${module.moduleId}) - Reason: ${reason}`);
  } catch (error) {
    console.error('Failed to move module to deprecated cache:', error);
  }
}

// Reusable function for performing module scans - exported for use by automatic scanning
export async function performModuleScan(user_id: string = 'system') {
  try {
    console.log('🔍 Starting automatic module scan for NEW modules only...');
    const scannedModules = await SimpleModuleScanner.scanModules();
    
    let savedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    
    // Load existing cached modules
    const existingModules = loadModulesFromCache();
    const updatedModules: CachedModule[] = [...existingModules]; // Start with existing modules
    
    // Process each scanned module - only add NEW ones
    for (const moduleData of scannedModules) {
      try {
        const moduleId = moduleData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        // Check if module already exists in cache
        const existingModule = existingModules.find(m => m.moduleId === moduleId);
        
        if (!existingModule) {
          // This is a NEW module - add it AND create a SmartID
          const cachedModule: CachedModule = {
            id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            moduleId,
            name: moduleData.name,
            displayName: moduleData.displayName || moduleData.name,
            description: moduleData.description || '',
            modulePath: moduleData.modulePath,
            status: 'discovered', // New modules start as discovered
            lastScanned: new Date().toISOString(),
            metadata: moduleData.metadata || {},
            createdAt: new Date().toISOString()
          };
          
          // Generate SMART-ID for the new module
          const { SmartIdGenerator } = await import('./smart-id-generator');
          const smartId = SmartIdGenerator.generateModuleId();
          
          cachedModule.metadata = {
            ...cachedModule.metadata,
            smartId: smartId,
            smartIdReady: true
          };
          
          updatedModules.push(cachedModule);
          savedCount++;
          console.log(`💾 Added NEW module: ${moduleData.name}`);
          
          // Log to SMART-Ledger for module discovery
          const response = await fetch('http://localhost:5001/api/ledger/record', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-system-action': user_id === 'system' ? 'true' : 'false'
            },
            body: JSON.stringify({
              tab: 'modules',
              action_type: 'module',
              action: user_id === 'system' ? 'system_scanned' : 'user_scanned',
              target: moduleData.name,
              details: user_id === 'system' ? 'Added to system as unvalidated' : `Manually scanned by ${user_id}`,
              smart_id: smartId,
              user_id: user_id
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to log module discovery to ledger: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          console.log(`📋 Logged module discovery: ${moduleData.name} (${result.entry_id})`);
        } else {
          // Module already exists - skip it
          skippedCount++;
          console.log(`⏭️ Skipped existing module: ${moduleData.name}`);
        }
        
      } catch (moduleError) {
        const errorMsg = `Failed to process module ${moduleData.name}: ${moduleError instanceof Error ? moduleError.message : String(moduleError)}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    // Save updated modules to cache
    saveModulesToCache(updatedModules);
    
    const result = {
      success: true,
      scanned: scannedModules.length,
      saved: savedCount,
      skipped: skippedCount,
      errors: errors.length,
      newModulesFound: savedCount,
      totalModules: updatedModules.length,
      details: {
        newModules: updatedModules.slice(-savedCount).map(module => {
          if (!module.metadata?.moduleClassification) {
            throw new Error(`Module ${module.name} is missing required moduleClassification`);
          }
          return {
            name: module.name,
            type: module.metadata.moduleClassification,
            status: module.status,
            description: module.description,
            path: module.modulePath
          };
        }),
        errors: errors
      }
    };
    
    console.log(`📦 Module scan complete: ${result.scanned} scanned, ${result.saved} new modules added, ${result.skipped} existing skipped, ${result.errors} errors`);
    
    return result;
  } catch (error) {
    console.error("Error scanning modules:", error);
    return { 
      success: false,
      error: "Failed to scan modules", 
      details: error instanceof Error ? error.message : String(error) 
    };
  }
}

export function registerInfrastructureRoutes(app: Express) {
  // Building revolutionary modular system - no more old directory initialization


  // System Overview - Get key metrics
  app.get("/api/infrastructure/overview", async (request, reply) => {
    try {
      // Get actual modules data
      const cachedModules = loadModulesFromCache();
      const validatedModules = cachedModules.filter(m => m.status === 'validated' || m.status === 'discovered').length;
      
      // Count actual domains
      const domainsPath = "./data/domains";
      let configuredDomains = 0;
      if (fs.existsSync(domainsPath)) {
        const domainDirs = fs.readdirSync(domainsPath).filter(dir => {
          const dirPath = path.join(domainsPath, dir);
          return fs.statSync(dirPath).isDirectory();
        });
        configuredDomains = domainDirs.length;
      }
      
      // Get nodes data - using same logic as nodes API to ensure consistency
      const nodesFile = path.join(process.cwd(), 'data/nodes-data.json');
      let totalNodes = 0;
      let availableNodes = 0;
      let offlineNodes = 0;
      let availableHubs = 0;
      let offlineHubs = 0;
      
      if (fs.existsSync(nodesFile)) {
        try {
          const data = fs.readFileSync(nodesFile, 'utf8');
          let nodes = JSON.parse(data) || [];
          
          // Use the same status update logic as the nodes API
          const { updateNodeStatuses } = await import('./routes');
          nodes = updateNodeStatuses(nodes);
          
          // Write back updated statuses to file (same as nodes API)
          fs.writeFileSync(nodesFile, JSON.stringify(nodes, null, 2));
          
          totalNodes = nodes.length;
          
          // Count online and offline nodes and hubs
          for (const node of nodes) {
            const isOnline = node.status && node.status.toLowerCase() === 'online';
            const isHub = node.type && node.type.includes('hub');
            
            if (isHub) {
              if (isOnline) {
                availableHubs++;
              } else {
                offlineHubs++;
              }
            } else {
              if (isOnline) {
                availableNodes++;
              } else {
                offlineNodes++;
              }
            }
          }
        } catch (error) {
          console.error('Error reading nodes data:', error);
        }
      }
      
      // Get equipment data
      const equipmentFile = path.join(process.cwd(), 'data/equipment-data.json');
      let activeEquipment = 0;
      let equipmentSmartIds = 0;
      
      if (fs.existsSync(equipmentFile)) {
        try {
          const equipmentData = JSON.parse(fs.readFileSync(equipmentFile, 'utf8'));
          // Count all equipment (not just operational)
          activeEquipment = equipmentData.length;
          // Count equipment SMART-IDs
          equipmentSmartIds = equipmentData.filter((eq: any) => eq.smartId).length;
        } catch (error) {
          console.error('Error reading equipment data:', error);
        }
      }
      
      // Calculate total SMART-IDs across all systems
      const moduleSmartIds = cachedModules.length; // Each module gets a SMART-ID
      const nodeSmartIds = totalNodes; // Each node gets a SMART-ID
      const domainSmartIds = configuredDomains; // Each domain gets a SMART-ID
      const activeSmartIds = moduleSmartIds + nodeSmartIds + domainSmartIds + equipmentSmartIds;
      const smartIdDetails = { 
        modules: moduleSmartIds, 
        nodes: nodeSmartIds, 
        domains: domainSmartIds,
        equipment: equipmentSmartIds,
        total: activeSmartIds
      };
      
      // Get deployments count
      const deploymentsPath = "./data/deployments";
      let successfulDeployments = 0;
      if (fs.existsSync(deploymentsPath)) {
        const deploymentFiles = fs.readdirSync(deploymentsPath).filter(file => file.endsWith('.json'));
        successfulDeployments = deploymentFiles.length;
      }
      
      const overview = {
        active_smart_ids: activeSmartIds,
        smart_id_breakdown: smartIdDetails,
        validated_modules: validatedModules,
        configured_domains: configuredDomains,
        available_nodes: availableNodes,
        offline_nodes: offlineNodes,
        available_hubs: availableHubs,
        offline_hubs: offlineHubs,
        successful_deployments: successfulDeployments,
        active_equipment: activeEquipment,
        active_ai_instances: cachedModules.filter(m => m.name.includes('ai')).length,
      };
      
      reply.json(overview);
    } catch (error) {
      console.error("Error fetching system overview:", error);
      reply.status(500).json({ error: "Failed to fetch system overview" });
    }
  });

  // System Health - Get system status
  app.get("/api/infrastructure/health", async (request, reply) => {
    try {
      // Get real-time CPU usage using sampling method
      const getCpuUsage = async (): Promise<number> => {
        const cpus = os.cpus();
        
        // First measurement
        const startTimes = cpus.map(cpu => {
          const times = cpu.times as any;
          let total = 0;
          for (const type in times) {
            total += times[type];
          }
          return { idle: cpu.times.idle, total };
        });
        
        // Wait 100ms for sampling
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Second measurement
        const endTimes = os.cpus().map(cpu => {
          const times = cpu.times as any;
          let total = 0;
          for (const type in times) {
            total += times[type];
          }
          return { idle: cpu.times.idle, total };
        });
        
        // Calculate usage percentage
        let totalUsage = 0;
        for (let i = 0; i < cpus.length; i++) {
          const startIdle = startTimes[i].idle;
          const startTotal = startTimes[i].total;
          const endIdle = endTimes[i].idle;
          const endTotal = endTimes[i].total;
          
          const idleDiff = endIdle - startIdle;
          const totalDiff = endTotal - startTotal;
          
          const usage = totalDiff === 0 ? 0 : 100 - (100 * idleDiff / totalDiff);
          totalUsage += usage;
        }
        
        const avgUsage = totalUsage / cpus.length;
        return Math.max(0, Math.min(100, Math.round(avgUsage)));
      };

      const cpuUsage = await getCpuUsage();

      // Check if UDP discovery server is running (listening for node broadcasts)
      const getNodeDiscoveryStatus = () => {
        return systemStatus.nodeDiscoveryOnline ? "healthy" : "offline";
      };

      const getModuleScannerStatus = () => {
        // Debug logging
        console.log("🔍 Debug - systemStatus.lastModuleScan:", systemStatus.lastModuleScan);
        console.log("🔍 Debug - systemStatus.moduleScannerOnline:", systemStatus.moduleScannerOnline);
        
        // First check if module scanner is explicitly marked as online
        if (systemStatus.moduleScannerOnline) {
          return "healthy";
        }
        
        // Fallback: Check if module scanner has run recently (within last 1 minute for testing)
        if (!systemStatus.lastModuleScan) return "offline";
        const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
        return systemStatus.lastModuleScan > oneMinuteAgo ? "healthy" : "offline";
      };

      // Calculate overall status based on individual component health
      const getOverallStatus = (nodeDiscoveryStatus: string, moduleScannerStatus: string) => {
        const statuses = [nodeDiscoveryStatus, moduleScannerStatus];
        
        // If any component is offline, overall status is degraded
        if (statuses.includes("offline")) {
          console.log(`🔴 Overall status: DEGRADED - Components offline: ${statuses.filter(s => s === "offline").length}`);
          return "degraded";
        }
        
        // If any component has warnings, overall status is warning
        if (statuses.includes("warning")) {
          console.log(`🟡 Overall status: WARNING - Components with warnings: ${statuses.filter(s => s === "warning").length}`);
          return "warning";
        }
        
        // If all components are healthy, overall status is healthy
        if (statuses.every(status => status === "healthy")) {
          console.log(`🟢 Overall status: HEALTHY - All components operational`);
          return "healthy";
        }
        
        // No fallback - throw error for unexpected status
        const error = `Invalid component statuses detected: ${JSON.stringify(statuses)}`;
        console.error(`❌ Overall status: ERROR - ${error}`);
        throw new Error(error);
      };

      const nodeDiscoveryStatus = getNodeDiscoveryStatus();
      const moduleScannerStatus = getModuleScannerStatus();

      const health = {
        overall_status: getOverallStatus(nodeDiscoveryStatus, moduleScannerStatus),
        node_discovery_status: nodeDiscoveryStatus, 
        module_scanner_status: moduleScannerStatus,
        uptime_hours: process.uptime() / 3600,
        uptime_minutes: Math.floor((process.uptime() % 3600) / 60),
        uptime_total_minutes: Math.floor(process.uptime() / 60),
        last_activity: new Date().toISOString(),
        cpu_usage: cpuUsage,
      };

      reply.json(health);
    } catch (error) {
      console.error("Error fetching system health:", error);
      reply.status(500).json({ error: "Failed to fetch system health" });
    }
  });



  // Module Management - Load from persistent cache
  app.get("/api/infrastructure/modules", async (request, reply) => {
    try {
      const cachedModules = loadModulesFromCache();
      console.log(`📦 Found ${cachedModules.length} modules in persistent cache`);
      reply.json(cachedModules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      reply.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  // Get deprecated/deleted modules for audit purposes (must be before parameterized routes)
  app.get("/api/infrastructure/modules/deprecated", async (request, reply) => {
    try {
      const deprecatedModules = loadDeprecatedModules();
      
      console.log(`📦 Retrieved ${deprecatedModules.length} deprecated modules for audit`);
      
      reply.json(deprecatedModules);
    } catch (error) {
      console.error("Error retrieving deprecated modules:", error);
      reply.status(500).json({ 
        error: "Failed to retrieve deprecated modules", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Check for modules with preserved SMART-IDs that can be restored
  app.get("/api/infrastructure/modules/restorable", async (request, reply) => {
    try {
      const { ModuleScanner } = await import('./module-scanner');
      const scannedModules = await ModuleScanner.scanModules();
      const deprecatedModules = loadDeprecatedModules();
      
      // Find modules that exist on disk but are in deprecated cache
      const restorable = scannedModules.filter(scanned => {
        return deprecatedModules.some(deprecated => 
          deprecated.name === scanned.name && 
          fs.existsSync(path.join(scanned.path, '.smart_id'))
        );
      });
      
      console.log(`🔄 Found ${restorable.length} modules with preserved SMART-IDs that can be restored`);
      
      reply.json(restorable.map(module => ({
        name: module.name,
        path: module.path,
        originalSmartId: deprecatedModules.find(d => d.name === module.name)?.moduleId,
        canRestore: true
      })));
      
    } catch (error) {
      console.error("Error checking restorable modules:", error);
      reply.status(500).json({ 
        error: "Failed to check restorable modules", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.post("/api/infrastructure/modules/scan", async (request, reply) => {
    try {
      // This is a USER-initiated scan, get the current user
      const sessionId = request.headers['x-session-id'] || request.cookies?.sessionId;
      
      if (!sessionId) {
        return reply.status(401).json({ error: 'Authentication required for manual scan' });
      }
      
      const validation = auth.validateSession(sessionId as string);
      if (!validation.valid) {
        return reply.status(401).json({ error: 'Invalid or expired session' });
      }
      
      const user_id = validation.user.username;
      if (!user_id) {
        return reply.status(500).json({ error: 'User ID not found in session' });
      }
      
      const result = await performModuleScan(user_id); // Pass user_id for manual scans
      reply.json(result);
    } catch (error) {
      console.error("Error scanning modules:", error);
      reply.status(500).json({ 
        success: false,
        error: "Failed to scan modules", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  

  // Module validation endpoint with classifications
  app.post("/api/infrastructure/modules/:moduleId/validate", async (request, reply) => {
    try {
      const { moduleId } = request.params as { moduleId: string };
      const { moduleClassification, categoryClassification } = request.body as { 
        moduleClassification: string;
        categoryClassification: string;
      };
      
      // Validate required fields
      if (!moduleClassification || !categoryClassification) {
        return reply.status(400).json({ 
          error: "Both moduleClassification and categoryClassification are required" 
        });
      }

      // Get modules from cache
      const cachedModules = loadModulesFromCache();
      const module = cachedModules.find(m => m.id === moduleId || m.moduleId === moduleId);
      
      if (!module) {
        return reply.status(404).json({ error: "Module not found" });
      }
      
      // Perform validation checks - SMART system: SmartContract-driven, no base file requirements
      const validationResults = {
        path_exists: false,
        overall_status: 'discovered' as 'discovered' | 'validated'
      };
      
      // Check if module path exists - SmartContracts execute from any valid path
      if (fs.existsSync(module.modulePath)) {
        validationResults.path_exists = true;
        validationResults.overall_status = 'validated';
      }
      
      // Update module with classifications and validation status
      const moduleIndex = cachedModules.findIndex(m => m.id === module.id);
      if (moduleIndex >= 0) {
        cachedModules[moduleIndex].status = validationResults.overall_status;
        cachedModules[moduleIndex].lastScanned = new Date().toISOString();
        cachedModules[moduleIndex].metadata = {
          ...cachedModules[moduleIndex].metadata,
          moduleClassification,
          categoryClassification,
          validation: validationResults,
          validatedAt: new Date().toISOString()
        };
        saveModulesToCache(cachedModules);
      }
      
      
      reply.json({
        success: true,
        module_id: module.moduleId,
        status: validationResults.overall_status,
        moduleClassification,
        categoryClassification,
        validation_results: validationResults,
        message: `Module ${module.name} validated as ${moduleClassification} in ${categoryClassification} category`
      });
      
    } catch (error) {
      console.error("Error validating module:", error);
      reply.status(500).json({ 
        error: "Failed to validate module", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Module deletion endpoint
  app.delete("/api/infrastructure/modules/:moduleId", async (request, reply) => {
    try {
      const { moduleId } = request.params as { moduleId: string };
      
      // Get modules from cache
      const cachedModules = loadModulesFromCache();
      const moduleIndex = cachedModules.findIndex(m => m.id === moduleId || m.moduleId === moduleId);
      const module = moduleIndex >= 0 ? cachedModules[moduleIndex] : null;
      
      if (!module) {
        return reply.status(404).json({ error: "Module not found" });
      }
      
      // Move module to deprecated cache to preserve SMART-ID and audit trail
      moveModuleToDeprecated(module, 'Manually deleted via UI');
      
      // Remove from active cache
      cachedModules.splice(moduleIndex, 1);
      saveModulesToCache(cachedModules);
      
      // Note: Module directory and .smart_id file are preserved
      // If the same module is re-added, it will get the same SMART-ID
      
      console.log(`🗑️ Moved module to deprecated: ${module.name} (${module.moduleId})`);
      
      
      reply.json({
        success: true,
        message: `Module "${module.name}" deleted successfully`,
        deletedModule: {
          id: module.id,
          name: module.name
        }
      });
      
    } catch (error) {
      console.error("Error deleting module:", error);
      reply.status(500).json({ 
        error: "Failed to delete module", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Domain Ecosystem Schema
  const DomainEcosystemSchema = z.object({
    name: z.string().min(1, "Domain name is required"),
    description: z.string().optional(),
    selectedModules: z.array(z.string()).min(1, "At least one module must be selected")
  });

  // Domain Ecosystem Routes
  app.get("/api/infrastructure/domains", async (request, reply) => {
    try {
      const domainsPath = "./data/domains";
      const domains = [];
      
      // Check if domains directory exists
      if (fs.existsSync(domainsPath)) {
        // Read all domain directories
        const domainDirs = fs.readdirSync(domainsPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        
        // Load each domain configuration
        for (const domainDir of domainDirs) {
          const configPath = path.join(domainsPath, domainDir, 'domain-config.json');
          if (fs.existsSync(configPath)) {
            try {
              const configData = fs.readFileSync(configPath, 'utf8');
              const domainConfig = JSON.parse(configData);
              
              // Add additional metadata
              domainConfig.id = domainConfig.domainId;
              domains.push(domainConfig);
            } catch (error) {
              console.error(`Error reading domain config for ${domainDir}:`, error);
            }
          }
        }
      }
      
      console.log(`📋 Found ${domains.length} domain ecosystems`);
      reply.json(domains);
    } catch (error) {
      console.error("Error fetching domains:", error);
      reply.status(500).json({ error: "Failed to fetch domains" });
    }
  });

  app.post("/api/infrastructure/domains", async (request, reply) => {
    try {
      // Get the current user for this domain creation
      const sessionId = request.headers['x-session-id'] || request.cookies?.sessionId;
      
      if (!sessionId) {
        return reply.status(401).json({ error: 'Authentication required for domain creation' });
      }
      
      const validation = auth.validateSession(sessionId as string);
      if (!validation.valid) {
        return reply.status(401).json({ error: 'Invalid or expired session' });
      }
      
      const user_id = validation.user.username;
      if (!user_id) {
        return reply.status(500).json({ error: 'User ID not found in session' });
      }
      
      const data = DomainEcosystemSchema.parse(request.body);
      
      // Generate separate domain ID and ecosystem SMART-ID
      const { SmartIdGenerator } = await import('./smart-id-generator');
      const domainId = SmartIdGenerator.generateDomainId(); // DOM-12345
      const ecosystemSmartID = `${data.name.toUpperCase().replace(/\s+/g, '-')}-${domainId}`; // TEST-DOMAIN-DOM-12345

      // Load all modules to get module details
      const cachedModules = loadModulesFromCache();
      
      // Prepare module instances for the ecosystem
      const moduleInstances = [];
      for (const moduleId of data.selectedModules) {
        const module = cachedModules.find((m: any) => m.id === moduleId);
        if (module) {
          // Generate domain-specific SMART-ID for this module instance
          const modulePrefix = module.name.replace('smart_', '').toUpperCase();
          const domainSpecificSmartId = `${modulePrefix}-${domainId}`;
          
          moduleInstances.push({
            id: moduleId,
            name: module.name,
            moduleClassification: module.metadata?.moduleClassification || 'Unclassified',
            categoryClassification: module.metadata?.categoryClassification || 'General',
            moduleSmartId: module.metadata?.smartId || 'Pending', // Original module SMART-ID
            domainSmartId: domainSpecificSmartId // Domain-specific SMART-ID
          });
        } else {
          console.log(`⚠️ Module not found for ID: ${moduleId}`);
        }
      }

      // Create domain ecosystem files using settings path
      const domainsPath = "./data/domains";
      const domainDir = path.join(domainsPath, domainId);
      
      // Ensure domains directory exists
      if (!fs.existsSync(domainsPath)) {
        fs.mkdirSync(domainsPath, { recursive: true });
      }
      
      // Create domain-specific directory
      if (!fs.existsSync(domainDir)) {
        fs.mkdirSync(domainDir, { recursive: true });
      }
      
      // Create domain configuration file
      const domainConfig = {
        domainId, // DOM-12345 (for backend/table display)
        name: data.name,
        description: data.description,
        ecosystemSmartID, // TEST-DOMAIN-DOM-12345 (full ecosystem identifier)
        selectedModules: data.selectedModules,
        moduleInstances: moduleInstances,
        deploymentTargets: [],
        createdAt: new Date().toISOString(),
        status: 'configured'
      };
      
      const configPath = path.join(domainDir, 'domain-config.json');
      fs.writeFileSync(configPath, JSON.stringify(domainConfig, null, 2));

      console.log(`✅ Created domain ecosystem '${data.name}' in: ${domainDir}`);
      console.log(`📦 Module instances:`, moduleInstances.map(m => `${m.name} (${m.moduleClassification})`));
      
      // Log to SMART-Ledger for domain creation
      const ledgerResponse = await fetch('http://localhost:5001/api/ledger/record', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-system-action': 'false' // This is a USER action
        },
        body: JSON.stringify({
          tab: 'domains',
          action_type: 'domain',
          action: 'create',
          target: data.name,
          details: `Created domain ecosystem ${data.name} with ${moduleInstances.length} modules`,
          smart_id: domainId,
          user_id: user_id, // Use actual user who created the domain
          metadata: {
            name: data.name,
            moduleCount: moduleInstances.length,
            modules: moduleInstances.map(m => m.name)
          }
        })
      });
      
      if (!ledgerResponse.ok) {
        throw new Error(`Failed to log domain creation to ledger: ${ledgerResponse.status} ${ledgerResponse.statusText}`);
      }
      
      reply.json({
        success: true,
        domain: domainConfig,
        domainId, // DOM-12345 for table display
        ecosystemSmartID, // TEST-DOMAIN-DOM-12345 for full identification
        moduleInstances: moduleInstances.map(m => ({
          name: m.name,
          moduleClassification: m.moduleClassification,
          categoryClassification: m.categoryClassification,
          moduleSmartId: m.moduleSmartId,
          domainSmartId: m.domainSmartId
        })),
        message: `Domain "${data.name}" created successfully with Domain ID: ${domainId}`
      });
    } catch (error) {
      console.error("Error creating domain ecosystem:", error);
      if (error instanceof z.ZodError) {
        return reply.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      reply.status(500).json({ 
        error: "Failed to create domain ecosystem",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update/Edit domain endpoint
  app.put("/api/infrastructure/domains/:domainId", async (request, reply) => {
    try {
      // Get the current user for this domain update
      const sessionId = request.headers['x-session-id'] || request.cookies?.sessionId;
      
      if (!sessionId) {
        return reply.status(401).json({ error: 'Authentication required for domain update' });
      }
      
      const validation = auth.validateSession(sessionId as string);
      if (!validation.valid) {
        return reply.status(401).json({ error: 'Invalid or expired session' });
      }
      
      const user_id = validation.user.username;
      if (!user_id) {
        return reply.status(500).json({ error: 'User ID not found in session' });
      }
      
      const { domainId } = request.params;
      const updateData = request.body;
      
      const domainsPath = "./data/domains";
      const domainDir = path.join(domainsPath, domainId);
      const configPath = path.join(domainDir, 'domain-config.json');
      
      if (!fs.existsSync(configPath)) {
        return reply.status(404).json({ error: "Domain not found" });
      }
      
      // Load current configuration
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Update allowed fields
      if (updateData.name) configData.name = updateData.name;
      if (updateData.description !== undefined) configData.description = updateData.description;
      if (updateData.selectedModules) configData.selectedModules = updateData.selectedModules;
      
      configData.updatedAt = new Date().toISOString();
      
      // Save updated configuration
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
      
      console.log(`✏️ Updated domain ecosystem: ${configData.name}`);
      
      // Log to SMART-Ledger for domain update
      const ledgerResponse = await fetch('http://localhost:5001/api/ledger/record', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-system-action': 'false' // This is a USER action
        },
        body: JSON.stringify({
          tab: 'domains',
          action_type: 'domain',
          action: 'update',
          target: configData.name,
          details: `Updated domain ecosystem ${configData.name}`,
          smart_id: domainId,
          user_id: user_id, // Use actual user who updated the domain
          metadata: {
            name: configData.name,
            updatedFields: Object.keys(updateData),
            moduleCount: configData.selectedModules?.length
          }
        })
      });
      
      if (!ledgerResponse.ok) {
        throw new Error(`Failed to log domain update to ledger: ${ledgerResponse.status} ${ledgerResponse.statusText}`);
      }
      
      reply.json({
        success: true,
        domain: configData,
        message: `Domain "${configData.name}" updated successfully`
      });
    } catch (error) {
      console.error("Error updating domain:", error);
      reply.status(500).json({
        error: "Failed to update domain",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Deploy domain endpoint
  app.post("/api/infrastructure/domains/:domainId/deploy", async (request, reply) => {
    try {
      // Get the current user for this domain deployment
      const sessionId = request.headers['x-session-id'] || request.cookies?.sessionId;
      
      if (!sessionId) {
        return reply.status(401).json({ error: 'Authentication required for domain deployment' });
      }
      
      const validation = auth.validateSession(sessionId as string);
      if (!validation.valid) {
        return reply.status(401).json({ error: 'Invalid or expired session' });
      }
      
      const user_id = validation.user.username;
      if (!user_id) {
        return reply.status(500).json({ error: 'User ID not found in session' });
      }
      
      const { domainId } = request.params;
      const { deploymentMethod, deploymentTargets } = request.body;
      
      const domainsPath = "./data/domains";
      const domainDir = path.join(domainsPath, domainId);
      const configPath = path.join(domainDir, 'domain-config.json');
      
      if (!fs.existsSync(configPath)) {
        return reply.status(404).json({ error: "Domain not found" });
      }
      
      // Load current configuration
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Update domain status to deployed and save deployment info
      configData.status = 'deployed';
      configData.deploymentTargets = deploymentTargets;
      configData.deploymentMethod = deploymentMethod;
      configData.deployedAt = new Date().toISOString();
      configData.updatedAt = new Date().toISOString();
      
      // Save updated configuration
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
      
      // Create deployment record for tracking
      const deploymentsPath = "./data/deployments";
      if (!fs.existsSync(deploymentsPath)) {
        fs.mkdirSync(deploymentsPath, { recursive: true });
      }
      
      const deploymentRecord = {
        deploymentId: `dep_${Date.now()}`,
        domainId,
        domainName: configData.name,
        deploymentMethod,
        deploymentTargets,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };
      
      const deploymentPath = path.join(deploymentsPath, `${deploymentRecord.deploymentId}.json`);
      fs.writeFileSync(deploymentPath, JSON.stringify(deploymentRecord, null, 2));
      
      console.log(`🚀 Deployed domain ecosystem: ${configData.name} to ${deploymentTargets.length} target(s)`);
      
      // Log to SMART-Ledger for domain deployment
      const ledgerResponse = await fetch('http://localhost:5001/api/ledger/record', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-system-action': 'false' // This is a USER action
        },
        body: JSON.stringify({
          tab: 'domains',
          action_type: 'domain',
          action: 'deploy',
          user_id: user_id, // Use actual user who deployed the domain
          target: configData.name,
          details: `Deployed domain ${configData.name} to ${deploymentTargets.length} target(s)`,
          smart_id: domainId,
          metadata: {
            name: configData.name,
            deploymentMethod,
            targetCount: deploymentTargets.length,
            deploymentTargets
          }
        })
      });
      
      if (!ledgerResponse.ok) {
        throw new Error(`Failed to log domain deployment to ledger: ${ledgerResponse.status} ${ledgerResponse.statusText}`);
      }
      
      reply.json({
        success: true,
        domain: configData,
        deployment: deploymentRecord,
        message: `Domain "${configData.name}" deployed successfully to ${deploymentTargets.length} target(s)`
      });
    } catch (error) {
      console.error("Error deploying domain:", error);
      reply.status(500).json({
        error: "Failed to deploy domain",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete domain endpoint
  app.delete("/api/infrastructure/domains/:domainId", async (request, reply) => {
    try {
      // Get the current user for this domain deletion
      const sessionId = request.headers['x-session-id'] || request.cookies?.sessionId;
      
      if (!sessionId) {
        return reply.status(401).json({ error: 'Authentication required for domain deletion' });
      }
      
      const validation = auth.validateSession(sessionId as string);
      if (!validation.valid) {
        return reply.status(401).json({ error: 'Invalid or expired session' });
      }
      
      const user_id = validation.user.username;
      if (!user_id) {
        return reply.status(500).json({ error: 'User ID not found in session' });
      }
      
      const { domainId } = request.params;
      
      const domainsPath = "./data/domains";
      const domainDir = path.join(domainsPath, domainId);
      
      if (!fs.existsSync(domainDir)) {
        return reply.status(404).json({ error: "Domain not found" });
      }
      
      // Get domain name for logging before deletion
      const configPath = path.join(domainDir, 'domain-config.json');
      let domainName = domainId;
      if (fs.existsSync(configPath)) {
        try {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          domainName = configData.name;
        } catch (error) {
          console.error("Error reading domain config for deletion:", error);
        }
      }
      
      // Remove domain directory and all its contents
      fs.rmSync(domainDir, { recursive: true, force: true });
      
      console.log(`🗑️ Deleted domain ecosystem: ${domainName}`);
      
      // Log to SMART-Ledger for domain deletion
      const ledgerResponse = await fetch('http://localhost:5001/api/ledger/record', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-system-action': 'false' // This is a USER action
        },
        body: JSON.stringify({
          tab: 'domains',
          action_type: 'domain',
          action: 'delete',
          user_id: user_id, // Use actual user who deleted the domain
          target: domainName,
          details: `Deleted domain ecosystem ${domainName}`,
          smart_id: domainId,
          metadata: {
            name: domainName
          }
        })
      });
      
      if (!ledgerResponse.ok) {
        throw new Error(`Failed to log domain deletion to ledger: ${ledgerResponse.status} ${ledgerResponse.statusText}`);
      }
      
      reply.json({
        success: true,
        message: `Domain "${domainName}" deleted successfully`
      });
    } catch (error) {
      console.error("Error deleting domain:", error);
      reply.status(500).json({
        error: "Failed to delete domain",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Equipment API Endpoints
  app.get("/api/equipment", async (request, reply) => {
    try {
      const equipmentFile = path.join(process.cwd(), 'data/equipment-data.json');
      let equipment = [];
      
      if (fs.existsSync(equipmentFile)) {
        const data = fs.readFileSync(equipmentFile, 'utf8');
        equipment = JSON.parse(data);
      }
      
      reply.json(equipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      reply.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  app.post("/api/equipment", async (request, reply) => {
    try {
      const equipmentData = request.body;
      const equipmentFile = path.join(process.cwd(), 'data/equipment-data.json');
      
      // Load existing equipment
      let equipment = [];
      if (fs.existsSync(equipmentFile)) {
        const data = fs.readFileSync(equipmentFile, 'utf8');
        equipment = JSON.parse(data);
      }
      
      // Generate SMART-ID for the new equipment
      const { SmartIdGenerator } = await import('./smart-id-generator');
      const equipmentSmartId = SmartIdGenerator.generateEquipmentId();
      
      // Add new equipment with proper structure
      const newEquipment = {
        ...equipmentData,
        id: `eq_${Date.now()}`,
        smartId: equipmentSmartId,
        status: 'operational',
        lastMaintenance: new Date().toISOString().split('T')[0],
        nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        metrics: {
          uptime: 100,
          temperature: 25,
          powerConsumption: 0,
          utilization: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      equipment.push(newEquipment);
      
      // Save back to file
      fs.writeFileSync(equipmentFile, JSON.stringify(equipment, null, 2));
      
      // Log to SMART-Ledger for equipment creation
      fetch('http://localhost:5001/api/ledger/record', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-system-action': 'true'
        },
        body: JSON.stringify({
          tab: 'equipment',
          action_type: 'equipment',
          action: 'create',
          user_id: 'system',
          target: equipmentData.name,
          details: `Added new ${equipmentData.category} equipment: ${equipmentData.name}`,
          smart_id: equipmentSmartId,
          metadata: {
            name: equipmentData.name,
            category: equipmentData.category,
            manufacturer: equipmentData.manufacturer,
            smartId: equipmentSmartId
          }
        })
      }).catch(console.error);
      
      reply.json({ success: true, id: newEquipment.id, equipment: newEquipment });
    } catch (error) {
      console.error("Error creating equipment:", error);
      reply.status(500).json({ error: "Failed to create equipment" });
    }
  });

  app.put("/api/equipment/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const equipmentData = request.body;
      const equipmentFile = path.join(process.cwd(), 'data/equipment-data.json');
      
      // Load existing equipment
      let equipment = [];
      if (fs.existsSync(equipmentFile)) {
        const data = fs.readFileSync(equipmentFile, 'utf8');
        equipment = JSON.parse(data);
      }
      
      // Find and update the equipment
      const index = equipment.findIndex((eq: any) => eq.id === id);
      if (index === -1) {
        return reply.status(404).json({ error: "Equipment not found" });
      }
      
      // Update with new data while preserving some fields
      const updatedEquipment = {
        ...equipment[index],
        ...equipmentData,
        id, // Preserve ID
        updatedAt: new Date().toISOString()
      };
      
      equipment[index] = updatedEquipment;
      
      // Save back to file
      fs.writeFileSync(equipmentFile, JSON.stringify(equipment, null, 2));
      
      // Log to SMART-Ledger for equipment update
      fetch('http://localhost:5001/api/ledger/record', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-system-action': 'true'
        },
        body: JSON.stringify({
          tab: 'equipment',
          action_type: 'equipment',
          action: 'update',
          user_id: 'system',
          target: updatedEquipment.name || id,
          details: `Updated ${updatedEquipment.category || 'equipment'}: ${updatedEquipment.name || id}`,
          smart_id: updatedEquipment.smartId || '',
          metadata: {
            id: id,
            name: updatedEquipment.name,
            category: updatedEquipment.category,
            manufacturer: updatedEquipment.manufacturer,
            smartId: updatedEquipment.smartId
          }
        })
      }).catch(console.error);
      
      reply.json({ success: true, id, equipment: updatedEquipment });
    } catch (error) {
      console.error("Error updating equipment:", error);
      reply.status(500).json({ error: "Failed to update equipment" });
    }
  });

  app.delete("/api/equipment/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const equipmentFile = path.join(process.cwd(), 'data/equipment-data.json');
      
      // Load existing equipment
      let equipment = [];
      if (fs.existsSync(equipmentFile)) {
        const data = fs.readFileSync(equipmentFile, 'utf8');
        equipment = JSON.parse(data);
      }
      
      // Find the equipment to delete for logging purposes
      const equipmentToDelete = equipment.find((eq: any) => eq.id === id);
      
      // Filter out the equipment to delete
      const originalLength = equipment.length;
      equipment = equipment.filter((eq: any) => eq.id !== id);
      
      if (equipment.length === originalLength) {
        return reply.status(404).json({ error: "Equipment not found" });
      }
      
      // Save back to file
      fs.writeFileSync(equipmentFile, JSON.stringify(equipment, null, 2));
      
      // Log to SMART-Ledger for equipment deletion
      if (equipmentToDelete) {
        fetch('http://localhost:5001/api/ledger/record', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-system-action': 'true'
          },
          body: JSON.stringify({
            tab: 'equipment',
            action_type: 'equipment',
            action: 'delete',
            user_id: 'system',
            target: equipmentToDelete.name || id,
            details: `Deleted ${equipmentToDelete.category || 'equipment'}: ${equipmentToDelete.name || id}`,
            smart_id: equipmentToDelete.smartId || '',
            metadata: {
              id: id,
              name: equipmentToDelete.name,
              category: equipmentToDelete.category,
              manufacturer: equipmentToDelete.manufacturer,
              smartId: equipmentToDelete.smartId
            }
          })
        }).catch(console.error);
      }
      
      reply.json({ success: true, message: "Equipment deleted successfully" });
    } catch (error) {
      console.error("Error deleting equipment:", error);
      reply.status(500).json({ error: "Failed to delete equipment" });
    }
  });

  app.get("/api/equipment/settings", async (request, reply) => {
    try {
      // Return default NDT settings - will be made configurable later
      reply.json({ success: true, settings: null }); // Will trigger client to use defaults
    } catch (error) {
      console.error("Error fetching equipment settings:", error);
      reply.status(500).json({ error: "Failed to fetch equipment settings" });
    }
  });

  app.post("/api/equipment/settings", async (request, reply) => {
    try {
      const settings = request.body.settings;
      // For now, just return success - will be implemented with proper storage
      reply.json({ success: true, message: "Settings saved successfully" });
    } catch (error) {
      console.error("Error saving equipment settings:", error);
      reply.status(500).json({ error: "Failed to save equipment settings" });
    }
  });

  // File serving endpoint for module README files and other module assets
  // Activity tracking endpoint
  // Old activities endpoint removed - now using SMART-Ledger at /api/ledger/activities

  app.get("/api/file", async (request, reply) => {
    try {
      const { path: filePath } = request.query as { path: string };
      
      if (!filePath) {
        return reply.status(400).json({ error: "File path is required" });
      }

      // Security check: only allow files within the smart_business_module directory
      const modulesBaseDir = path.resolve('./smart_business_module');
      const requestedPath = path.resolve(filePath);
      
      if (!requestedPath.startsWith(modulesBaseDir)) {
        return reply.status(403).json({ error: "Access denied: Path outside allowed directory" });
      }

      // Check if file exists
      if (!fs.existsSync(requestedPath)) {
        return reply.status(404).json({ error: "File not found" });
      }

      // Check if it's a file (not a directory)
      const stats = fs.statSync(requestedPath);
      if (!stats.isFile()) {
        return reply.status(400).json({ error: "Path is not a file" });
      }

      // Read and return file content
      const fileContent = fs.readFileSync(requestedPath, 'utf8');
      
      // Set appropriate content type based on file extension
      const ext = path.extname(requestedPath).toLowerCase();
      const contentType = ext === '.md' ? 'text/markdown' : 'text/plain';
      
      reply.header('Content-Type', contentType);
      reply.send(fileContent);
      
    } catch (error) {
      console.error("Error serving file:", error);
      reply.status(500).json({
        error: "Failed to read file",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}
