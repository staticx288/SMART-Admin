import { type Node, type InsertNode, type Module, type InsertModule, type Deployment, type InsertDeployment, type SystemStatus } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Nodes
  getNodes(): Promise<Node[]>;
  getNode(id: string): Promise<Node | undefined>;
  createNode(node: InsertNode): Promise<Node>;
  updateNode(id: string, node: Partial<Node>): Promise<Node | undefined>;
  deleteNode(id: string): Promise<boolean>;
  
  // Modules
  getModules(): Promise<Module[]>;
  getModule(id: string): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: string, module: Partial<Module>): Promise<Module | undefined>;
  deleteModule(id: string): Promise<boolean>;
  
  // Deployments
  getDeployments(): Promise<Deployment[]>;
  getDeployment(id: string): Promise<Deployment | undefined>;
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  updateDeployment(id: string, deployment: Partial<Deployment>): Promise<Deployment | undefined>;
  deleteDeployment(id: string): Promise<boolean>;
  
  // System
  getSystemStatus(): Promise<SystemStatus>;
}

export class MemStorage implements IStorage {
  private nodes: Map<string, Node> = new Map();
  private modules: Map<string, Module> = new Map();
  private deployments: Map<string, Deployment> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize with sample nodes
    const sampleNodes: Node[] = [
      {
        id: "node-ai-01",
        name: "Node-AI-01",
        type: "raspberry_pi",
        ipAddress: "192.168.1.101",
        sshPort: 22,
        capabilities: ["ai", "processing"],
        resources: { cpuCores: 4, ramGb: 4, storageGb: 64 },
        status: "online",
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "node-bc-02",
        name: "Node-BC-02",
        type: "ai_server",
        ipAddress: "192.168.1.102",
        sshPort: 22,
        capabilities: ["blockchain", "storage"],
        resources: { cpuCores: 8, ramGb: 16, storageGb: 512 },
        status: "online",
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "node-edge-03",
        name: "Node-Edge-03",
        type: "edge_device",
        ipAddress: "192.168.1.103",
        sshPort: 22,
        capabilities: ["edge", "sensor"],
        resources: { cpuCores: 2, ramGb: 2, storageGb: 32 },
        status: "offline",
        lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleNodes.forEach(node => this.nodes.set(node.id, node));

    // Initialize with sample modules
    const sampleModules: Module[] = [
      {
        id: "pulse-ai-llama",
        name: "PulseAI Llama",
        version: "v2.1.0",
        path: "/modules/pulse-ai-llama",
        type: "ai",
        description: "Advanced AI module with Llama model integration for natural language processing and generation.",
        configuration: { memory_limit: "2GB", cpu_limit: "1.5" },
        status: "loaded",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "pulse-ledger",
        name: "PulseLedger",
        version: "v1.5.2",
        path: "/modules/pulse-ledger",
        type: "core",
        description: "Blockchain-based record keeping system for immutable transaction logging and audit trails.",
        configuration: { port: 8080, network: "testnet" },
        status: "loaded",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "pulse-query",
        name: "PulseQuery",
        version: "v1.3.1",
        path: "/modules/pulse-query",
        type: "ai",
        description: "Voice-activated knowledge interface with natural language query processing capabilities.",
        configuration: { voice_model: "whisper", language: "en" },
        status: "discovered",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "pulse-security",
        name: "PulseSecurity",
        version: "v2.0.1",
        path: "/modules/pulse-security",
        type: "system",
        description: "Advanced security monitoring system with threat detection and incident response capabilities.",
        configuration: { alert_level: "medium", scan_interval: 300 },
        status: "loaded",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "pulse-compliance",
        name: "PulseCompliance",
        version: "v1.2.0",
        path: "/modules/pulse-compliance",
        type: "core",
        description: "Regulatory management system for compliance monitoring and automated reporting.",
        configuration: { region: "US", standards: ["SOX", "GDPR"] },
        status: "loaded",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "pulse-id",
        name: "PulseID",
        version: "v1.4.0",
        path: "/modules/pulse-id",
        type: "system",
        description: "Quantum-biological identity system with advanced biometric authentication and verification.",
        configuration: { auth_method: "biometric", encryption: "quantum" },
        status: "loaded",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleModules.forEach(module => this.modules.set(module.id, module));

    // Initialize with sample deployments
    const sampleDeployments: Deployment[] = [
      {
        id: "deployment-1",
        moduleId: "pulse-ai-llama",
        nodeId: "node-ai-01",
        status: "deployed",
        configuration: { memory_limit: "2GB", auto_restart: true },
        deployedAt: new Date(Date.now() - 120000), // 2 minutes ago
        createdAt: new Date(Date.now() - 120000),
        updatedAt: new Date(Date.now() - 120000)
      },
      {
        id: "deployment-2",
        moduleId: "pulse-ledger",
        nodeId: "node-bc-02",
        status: "deploying",
        configuration: { port: 8080, network: "testnet" },
        deployedAt: null,
        createdAt: new Date(Date.now() - 300000), // 5 minutes ago
        updatedAt: new Date()
      },
      {
        id: "deployment-3",
        moduleId: "pulse-query",
        nodeId: "node-edge-03",
        status: "failed",
        configuration: { voice_model: "whisper" },
        deployedAt: null,
        createdAt: new Date(Date.now() - 300000),
        updatedAt: new Date(Date.now() - 300000)
      }
    ];

    sampleDeployments.forEach(deployment => this.deployments.set(deployment.id, deployment));
  }

  // Nodes
  async getNodes(): Promise<Node[]> {
    return Array.from(this.nodes.values());
  }

  async getNode(id: string): Promise<Node | undefined> {
    return this.nodes.get(id);
  }

  async createNode(insertNode: InsertNode): Promise<Node> {
    const id = randomUUID();
    const node: Node = {
      ...insertNode,
      id,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.nodes.set(id, node);
    return node;
  }

  async updateNode(id: string, nodeUpdate: Partial<Node>): Promise<Node | undefined> {
    const node = this.nodes.get(id);
    if (!node) return undefined;
    
    const updatedNode: Node = {
      ...node,
      ...nodeUpdate,
      updatedAt: new Date()
    };
    this.nodes.set(id, updatedNode);
    return updatedNode;
  }

  async deleteNode(id: string): Promise<boolean> {
    return this.nodes.delete(id);
  }

  // Modules
  async getModules(): Promise<Module[]> {
    return Array.from(this.modules.values());
  }

  async getModule(id: string): Promise<Module | undefined> {
    return this.modules.get(id);
  }

  async createModule(insertModule: InsertModule): Promise<Module> {
    const id = randomUUID();
    const module: Module = {
      ...insertModule,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.modules.set(id, module);
    return module;
  }

  async updateModule(id: string, moduleUpdate: Partial<Module>): Promise<Module | undefined> {
    const module = this.modules.get(id);
    if (!module) return undefined;
    
    const updatedModule: Module = {
      ...module,
      ...moduleUpdate,
      updatedAt: new Date()
    };
    this.modules.set(id, updatedModule);
    return updatedModule;
  }

  async deleteModule(id: string): Promise<boolean> {
    return this.modules.delete(id);
  }

  // Deployments
  async getDeployments(): Promise<Deployment[]> {
    return Array.from(this.deployments.values());
  }

  async getDeployment(id: string): Promise<Deployment | undefined> {
    return this.deployments.get(id);
  }

  async createDeployment(insertDeployment: InsertDeployment): Promise<Deployment> {
    const id = randomUUID();
    const deployment: Deployment = {
      ...insertDeployment,
      id,
      deployedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.deployments.set(id, deployment);
    return deployment;
  }

  async updateDeployment(id: string, deploymentUpdate: Partial<Deployment>): Promise<Deployment | undefined> {
    const deployment = this.deployments.get(id);
    if (!deployment) return undefined;
    
    const updatedDeployment: Deployment = {
      ...deployment,
      ...deploymentUpdate,
      updatedAt: new Date()
    };
    this.deployments.set(id, updatedDeployment);
    return updatedDeployment;
  }

  async deleteDeployment(id: string): Promise<boolean> {
    return this.deployments.delete(id);
  }

  // System
  async getSystemStatus(): Promise<SystemStatus> {
    const nodes = await this.getNodes();
    const deployments = await this.getDeployments();
    
    const totalNodes = nodes.length;
    const onlineNodes = nodes.filter(n => n.status === 'online').length;
    const totalModules = this.modules.size;
    const activeDeployments = deployments.filter(d => d.status === 'deployed').length;
    const failedDeployments = deployments.filter(d => d.status === 'failed').length;
    
    let systemHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (failedDeployments > 2 || onlineNodes < totalNodes / 2) {
      systemHealth = 'critical';
    } else if (failedDeployments > 0 || onlineNodes < totalNodes * 0.8) {
      systemHealth = 'degraded';
    }
    
    const cpuUsage = Math.floor(Math.random() * 30) + 60; // 60-90% for demo
    
    return {
      totalNodes,
      onlineNodes,
      totalModules,
      activeDeployments,
      systemHealth,
      cpuUsage,
      failedDeployments
    };
  }
}

export const storage = new MemStorage();
