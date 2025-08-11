import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNodeSchema, insertModuleSchema, insertDeploymentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // System status
  app.get("/api/status/overview", async (req, res) => {
    try {
      const status = await storage.getSystemStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get system status" });
    }
  });

  // Nodes
  app.get("/api/nodes", async (req, res) => {
    try {
      const nodes = await storage.getNodes();
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ error: "Failed to get nodes" });
    }
  });

  app.get("/api/nodes/:id", async (req, res) => {
    try {
      const node = await storage.getNode(req.params.id);
      if (!node) {
        return res.status(404).json({ error: "Node not found" });
      }
      res.json(node);
    } catch (error) {
      res.status(500).json({ error: "Failed to get node" });
    }
  });

  app.post("/api/nodes", async (req, res) => {
    try {
      const nodeData = insertNodeSchema.parse(req.body);
      const node = await storage.createNode(nodeData);
      res.status(201).json(node);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid node data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create node" });
    }
  });

  app.post("/api/nodes/:id/test", async (req, res) => {
    try {
      const node = await storage.getNode(req.params.id);
      if (!node) {
        return res.status(404).json({ error: "Node not found" });
      }
      
      // Simulate SSH connectivity test
      const isOnline = Math.random() > 0.2; // 80% success rate
      const status = isOnline ? 'online' : 'offline';
      
      await storage.updateNode(req.params.id, { 
        status, 
        lastSeen: isOnline ? new Date() : node.lastSeen 
      });
      
      res.json({ success: isOnline, status });
    } catch (error) {
      res.status(500).json({ error: "Failed to test node connectivity" });
    }
  });

  // Modules
  app.get("/api/modules/available", async (req, res) => {
    try {
      const modules = await storage.getModules();
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: "Failed to get modules" });
    }
  });

  app.post("/api/modules/scan", async (req, res) => {
    try {
      // Simulate module scanning
      const newModules = [
        {
          name: "PulseAudit",
          version: "v1.1.0",
          path: "/modules/pulse-audit",
          type: "core" as const,
          description: "Advanced audit trail system for comprehensive logging and compliance monitoring.",
          configuration: { retention_days: 365, format: "json" },
          status: "discovered" as const
        }
      ];

      for (const moduleData of newModules) {
        await storage.createModule(moduleData);
      }

      res.json({ scanned: newModules.length, modules: newModules });
    } catch (error) {
      res.status(500).json({ error: "Failed to scan modules" });
    }
  });

  app.post("/api/modules/load/:name", async (req, res) => {
    try {
      const modules = await storage.getModules();
      const module = modules.find(m => m.name.toLowerCase().replace(/\s+/g, '-') === req.params.name);
      
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      await storage.updateModule(module.id, { status: 'loaded' });
      const updatedModule = await storage.getModule(module.id);
      
      res.json(updatedModule);
    } catch (error) {
      res.status(500).json({ error: "Failed to load module" });
    }
  });

  // Deployments
  app.get("/api/deployments", async (req, res) => {
    try {
      const deployments = await storage.getDeployments();
      const modules = await storage.getModules();
      const nodes = await storage.getNodes();
      
      // Enrich deployments with module and node data
      const enrichedDeployments = deployments.map(deployment => ({
        ...deployment,
        module: modules.find(m => m.id === deployment.moduleId),
        node: nodes.find(n => n.id === deployment.nodeId)
      }));
      
      res.json(enrichedDeployments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get deployments" });
    }
  });

  app.get("/api/deployments/:id", async (req, res) => {
    try {
      const deployment = await storage.getDeployment(req.params.id);
      if (!deployment) {
        return res.status(404).json({ error: "Deployment not found" });
      }
      
      const module = await storage.getModule(deployment.moduleId);
      const node = await storage.getNode(deployment.nodeId);
      
      res.json({ ...deployment, module, node });
    } catch (error) {
      res.status(500).json({ error: "Failed to get deployment" });
    }
  });

  const deploymentRequestSchema = z.object({
    moduleId: z.string(),
    nodeIds: z.array(z.string()),
    configuration: z.record(z.any()).optional()
  });

  app.post("/api/deploy", async (req, res) => {
    try {
      const { moduleId, nodeIds, configuration } = deploymentRequestSchema.parse(req.body);
      
      const module = await storage.getModule(moduleId);
      if (!module) {
        return res.status(400).json({ error: "Module not found" });
      }

      const deployments = [];
      for (const nodeId of nodeIds) {
        const node = await storage.getNode(nodeId);
        if (!node) {
          continue; // Skip invalid nodes
        }

        const deployment = await storage.createDeployment({
          moduleId,
          nodeId,
          status: 'deploying',
          configuration: configuration || {}
        });
        
        deployments.push(deployment);

        // Simulate deployment process
        setTimeout(async () => {
          const success = Math.random() > 0.1; // 90% success rate
          await storage.updateDeployment(deployment.id, {
            status: success ? 'deployed' : 'failed',
            deployedAt: success ? new Date() : null
          });
        }, Math.random() * 10000 + 2000); // 2-12 seconds
      }
      
      res.status(201).json(deployments);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid deployment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create deployment" });
    }
  });

  app.post("/api/deployments/:id/start", async (req, res) => {
    try {
      const deployment = await storage.updateDeployment(req.params.id, { 
        status: 'deployed',
        deployedAt: new Date()
      });
      if (!deployment) {
        return res.status(404).json({ error: "Deployment not found" });
      }
      res.json(deployment);
    } catch (error) {
      res.status(500).json({ error: "Failed to start deployment" });
    }
  });

  app.post("/api/deployments/:id/stop", async (req, res) => {
    try {
      const deployment = await storage.updateDeployment(req.params.id, { status: 'stopped' });
      if (!deployment) {
        return res.status(404).json({ error: "Deployment not found" });
      }
      res.json(deployment);
    } catch (error) {
      res.status(500).json({ error: "Failed to stop deployment" });
    }
  });

  app.post("/api/deployments/:id/restart", async (req, res) => {
    try {
      const deployment = await storage.updateDeployment(req.params.id, { 
        status: 'deployed',
        deployedAt: new Date()
      });
      if (!deployment) {
        return res.status(404).json({ error: "Deployment not found" });
      }
      res.json(deployment);
    } catch (error) {
      res.status(500).json({ error: "Failed to restart deployment" });
    }
  });

  app.delete("/api/deployments/:id", async (req, res) => {
    try {
      const success = await storage.deleteDeployment(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Deployment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete deployment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
