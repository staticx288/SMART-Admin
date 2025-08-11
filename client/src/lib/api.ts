import { apiRequest } from "./queryClient";
import type { Node, Module, Deployment, DeploymentRequest, SystemStatus } from "@/types";

export const apiClient = {
  // System
  getSystemStatus: (): Promise<SystemStatus> =>
    fetch("/api/status/overview").then(res => res.json()),
  
  // Nodes
  getNodes: (): Promise<Node[]> =>
    fetch("/api/nodes").then(res => res.json()),
  
  getNode: (id: string): Promise<Node> =>
    fetch(`/api/nodes/${id}`).then(res => res.json()),
  
  testNode: (id: string): Promise<{ success: boolean; status: string }> =>
    apiRequest("POST", `/api/nodes/${id}/test`).then(res => res.json()),
  
  // Modules
  getModules: (): Promise<Module[]> =>
    fetch("/api/modules/available").then(res => res.json()),
  
  scanModules: (): Promise<{ scanned: number; modules: Module[] }> =>
    apiRequest("POST", "/api/modules/scan").then(res => res.json()),
  
  loadModule: (name: string): Promise<Module> =>
    apiRequest("POST", `/api/modules/load/${name}`).then(res => res.json()),
  
  // Deployments
  getDeployments: (): Promise<Deployment[]> =>
    fetch("/api/deployments").then(res => res.json()),
  
  getDeployment: (id: string): Promise<Deployment> =>
    fetch(`/api/deployments/${id}`).then(res => res.json()),
  
  deploy: (request: DeploymentRequest): Promise<Deployment[]> =>
    apiRequest("POST", "/api/deploy", request).then(res => res.json()),
  
  startDeployment: (id: string): Promise<Deployment> =>
    apiRequest("POST", `/api/deployments/${id}/start`).then(res => res.json()),
  
  stopDeployment: (id: string): Promise<Deployment> =>
    apiRequest("POST", `/api/deployments/${id}/stop`).then(res => res.json()),
  
  restartDeployment: (id: string): Promise<Deployment> =>
    apiRequest("POST", `/api/deployments/${id}/restart`).then(res => res.json()),
  
  deleteDeployment: (id: string): Promise<{ success: boolean }> =>
    apiRequest("DELETE", `/api/deployments/${id}`).then(res => res.json()),
};
