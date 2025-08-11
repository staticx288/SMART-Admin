export interface Node {
  id: string;
  name: string;
  type: 'raspberry_pi' | 'ai_server' | 'edge_device';
  ipAddress: string;
  sshPort: number;
  capabilities: string[];
  resources: {
    cpuCores: number;
    ramGb: number;
    storageGb: number;
  };
  status: 'online' | 'offline' | 'error';
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  name: string;
  version?: string;
  path: string;
  type: 'ai' | 'core' | 'system';
  description?: string;
  configuration?: Record<string, any>;
  status: 'discovered' | 'loaded' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: string;
  moduleId: string;
  nodeId: string;
  status: 'deploying' | 'deployed' | 'failed' | 'stopped';
  configuration?: Record<string, any>;
  deployedAt?: string;
  createdAt: string;
  updatedAt: string;
  module?: Module;
  node?: Node;
}

export interface DeploymentRequest {
  moduleId: string;
  nodeIds: string[];
  configuration?: Record<string, any>;
}

export interface SystemStatus {
  totalNodes: number;
  onlineNodes: number;
  totalModules: number;
  activeDeployments: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  cpuUsage: number;
  failedDeployments: number;
}
