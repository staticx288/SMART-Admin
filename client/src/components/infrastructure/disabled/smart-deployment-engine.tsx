import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { 
  Rocket, 
  Search, 
  RefreshCw,
  Target,
  Zap,
  PlayCircle,
  StopCircle,
  RotateCcw,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Server,
  Package,
  Activity,
  Globe,
  Settings,
  Monitor,
  Upload,
  Download,
  ArrowRight,
  Plus,
  Filter,
  Eye,
  Edit,
  Play,
  Pause,
  SkipForward,
  MousePointerClick,
  PackageOpen,
  Send
} from "lucide-react";

interface DomainEcosystem {
  id: string;
  domainId: string;
  name: string;
  description?: string;
  selectedModules: string[];
  generatedInstances: Record<string, any>;
  deploymentTargets: string[];
  configuration: Record<string, any>;
  status: 'draft' | 'configured' | 'deployed' | 'error';
  createdAt: string;
  updatedAt: string;
}

interface Node {
  id: string;
  name: string;
  type: string;
  ipAddress: string;
  capabilities: string[];
  resources: {
    cpuCores: number;
    ramGb: number;
    storageGb: number;
  };
  status: string;
}

interface Deployment {
  id: string;
  moduleId: string;
  nodeId: string;
  status: string;
  configuration: Record<string, any>;
  deployedAt?: string;
  createdAt: string;
  updatedAt: string;
  module?: any;
  node?: any;
}

interface DeploymentRequest {
  domainId: string;
  targetNodes: string[];
  deploymentMode: 'individual' | 'distributed' | 'replicated';
  configuration: Record<string, any>;
}

export default function SmartDeploymentEngine() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainEcosystem | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [deploymentMode, setDeploymentMode] = useState<'individual' | 'distributed' | 'replicated'>('individual');

  const queryClient = useQueryClient();

  // Fetch domain ecosystems
  const { data: domains, isLoading: domainsLoading } = useQuery<DomainEcosystem[]>({
    queryKey: ["/api/infrastructure/domains"],
    queryFn: () => fetch("/api/infrastructure/domains").then((res) => res.json()),
  });

  // Fetch nodes
  const { data: nodes, isLoading: nodesLoading } = useQuery<Node[]>({
    queryKey: ["/api/nodes"],
    queryFn: () => fetch("/api/nodes").then((res) => res.json()),
    refetchInterval: 5000, // Poll every 5 seconds for real-time status updates
    refetchIntervalInBackground: true, // Keep polling even when tab is not active
  });

  // Fetch deployments
  const { data: deployments, isLoading: deploymentsLoading, refetch: refetchDeployments } = useQuery<Deployment[]>({
    queryKey: ["/api/deployments"],
    queryFn: () => fetch("/api/deployments").then((res) => res.json()),
  });

  // Deploy domain ecosystem mutation
  const deployDomain = useMutation({
    mutationFn: async (deploymentData: DeploymentRequest) => {
      const domain = domains?.find(d => d.domainId === deploymentData.domainId);
      if (!domain) throw new Error("Domain not found");

      // Deploy each module instance to selected nodes
      const deploymentPromises = [];
      
      for (const [moduleId, instance] of Object.entries(domain.generatedInstances)) {
        for (const nodeId of deploymentData.targetNodes) {
          const deployRequest = {
            moduleId,
            nodeIds: [nodeId],
            configuration: {
              ...instance.configuration,
              ...deploymentData.configuration,
              domainId: deploymentData.domainId,
              instanceId: instance.instanceId,
              mode: deploymentData.deploymentMode
            }
          };

          deploymentPromises.push(
            fetch("/api/deploy", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(deployRequest),
            }).then(res => res.json())
          );
        }
      }

      const results = await Promise.all(deploymentPromises);
      return results.flat();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/infrastructure/domains"] });
      setIsDeployDialogOpen(false);
      setSelectedDomain(null);
      setSelectedNodes([]);
      toast({
        title: "Success",
        description: "Domain ecosystem deployment initiated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to deploy domain ecosystem",
        variant: "destructive",
      });
    },
  });

  // Control deployment mutations
  const startDeployment = useMutation({
    mutationFn: (deploymentId: string) =>
      fetch(`/api/deployments/${deploymentId}/start`, {
        method: "POST"
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
      toast({ title: "Success", description: "Deployment started" });
    },
  });

  const stopDeployment = useMutation({
    mutationFn: (deploymentId: string) =>
      fetch(`/api/deployments/${deploymentId}/stop`, {
        method: "POST"
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
      toast({ title: "Success", description: "Deployment stopped" });
    },
  });

  const restartDeployment = useMutation({
    mutationFn: (deploymentId: string) =>
      fetch(`/api/deployments/${deploymentId}/restart`, {
        method: "POST"
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
      toast({ title: "Success", description: "Deployment restarted" });
    },
  });

  const deleteDeployment = useMutation({
    mutationFn: (deploymentId: string) =>
      fetch(`/api/deployments/${deploymentId}`, {
        method: "DELETE"
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
      toast({ title: "Success", description: "Deployment removed" });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "deployed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "deploying": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-600" />;
      case "stopped": return <StopCircle className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "deployed": return "text-green-600 border-green-600";
      case "deploying": return "text-yellow-600 border-yellow-600";
      case "failed": return "text-red-600 border-red-600";
      case "stopped": return "text-gray-600 border-gray-600";
      default: return "text-gray-600 border-gray-600";
    }
  };

  // Available online nodes for deployment
  const availableNodes = nodes?.filter(node => node.status.toLowerCase() === 'online') || [];

  // Configured domains ready for deployment
  const deployableDomains = domains?.filter(domain => domain.status === 'configured') || [];

  // Filter deployments
  const filteredDeployments = deployments?.filter((deployment) => {
    const matchesSearch = 
      deployment.module?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deployment.node?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deployment.node?.ipAddress.includes(searchTerm);
    
    const matchesStatus = filterStatus === "all" || deployment.status.toLowerCase() === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleNodeSelection = (nodeId: string, checked: boolean) => {
    if (checked) {
      setSelectedNodes(prev => [...prev, nodeId]);
    } else {
      setSelectedNodes(prev => prev.filter(id => id !== nodeId));
    }
  };

  const handleDeployDomain = () => {
    if (!selectedDomain || selectedNodes.length === 0) return;

    const deploymentData: DeploymentRequest = {
      domainId: selectedDomain.domainId,
      targetNodes: selectedNodes,
      deploymentMode,
      configuration: {
        environment: 'production',
        autoStart: true,
        restartPolicy: 'always'
      }
    };

    deployDomain.mutate(deploymentData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMART-Deployment Engine</h1>
          <p className="text-muted-foreground">
            Deploy domain ecosystems to registered nodes across your infrastructure
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => refetchDeployments()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDeployDialogOpen} onOpenChange={setIsDeployDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Rocket className="h-4 w-4 mr-2" />
                Deploy Domain
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Deploy Domain Ecosystem</DialogTitle>
                <DialogDescription>
                  Select a configured domain ecosystem and target nodes for deployment
                </DialogDescription>
              </DialogHeader>
              <DeploymentForm 
                domains={deployableDomains}
                nodes={availableNodes}
                selectedDomain={selectedDomain}
                selectedNodes={selectedNodes}
                deploymentMode={deploymentMode}
                onDomainSelect={setSelectedDomain}
                onNodeSelect={handleNodeSelection}
                onModeChange={setDeploymentMode}
                onDeploy={handleDeployDomain}
                isLoading={deployDomain.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Deployment Engine Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Rocket className="h-5 w-5 text-red-500" />
            <span>EcoSystems Deployment System</span>
          </CardTitle>
          <CardDescription>
            Orchestrate the deployment of domain ecosystems across your physical infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <MousePointerClick className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold">Select Targets</h3>
              <p className="text-sm text-muted-foreground">
                Choose nodes based on node/hub type, name or specific capabilities
              </p>
            </div>
            <div className="text-center">
              <PackageOpen className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold">Create Full Packages</h3>
              <p className="text-sm text-muted-foreground">
                Create full usable packages for nodes/hubs to use
              </p>
            </div>
            <div className="text-center">
              <Send className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold">Deploy to Nodes/Hubs</h3>
              <p className="text-sm text-muted-foreground">
                Deploy Packages to selected nodes/hubs
              </p>
            </div>
            <div className="text-center">
              <Monitor className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <h3 className="font-semibold">Manage Lifecycle</h3>
              <p className="text-sm text-muted-foreground">
                Manage deployed packages on nodes/hubs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready Domains</CardTitle>
            <Globe className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deployableDomains.length}</div>
            <p className="text-xs text-muted-foreground">Configured and ready</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Nodes</CardTitle>
            <Server className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableNodes.length}</div>
            <p className="text-xs text-muted-foreground">Online and ready</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deployments</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {deployments?.filter(d => d.status === 'deployed').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Deployments</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {deployments?.filter(d => d.status === 'failed').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Deploy Section */}
      {deployableDomains.length > 0 && availableNodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Quick Deploy</span>
            </CardTitle>
            <CardDescription>
              Deploy ready domain ecosystems to available nodes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deployableDomains.slice(0, 2).map((domain) => (
                <div key={domain.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{domain.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {domain.selectedModules.length} modules configured
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {domain.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {availableNodes.length} nodes available
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedDomain(domain);
                        setIsDeployDialogOpen(true);
                      }}
                    >
                      <Rocket className="h-4 w-4 mr-2" />
                      Deploy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Deployments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Deployments</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by module, node, or IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-status">Status</Label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="deployed">Deployed</option>
                <option value="deploying">Deploying</option>
                <option value="failed">Failed</option>
                <option value="stopped">Stopped</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-red-500" />
            <span>Active Deployments</span>
          </CardTitle>
          <CardDescription>
            All deployed domain ecosystem instances across your infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deploymentsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-smart" />
              ))}
            </div>
          ) : filteredDeployments && filteredDeployments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Target Node</TableHead>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deployed At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeployments.map((deployment) => (
                  <TableRow key={deployment.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {deployment.module?.name || "Unknown Module"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {deployment.module?.type || "Unknown Type"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {deployment.node?.name || "Unknown Node"}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {deployment.node?.ipAddress || "Unknown IP"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {deployment.configuration.domainId && (
                          <div className="mb-1">
                            <span className="font-medium">Domain:</span> {deployment.configuration.domainId}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Mode:</span> {deployment.configuration.mode || 'standard'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(deployment.status)}
                        <Badge variant="outline" className={getStatusColor(deployment.status)}>
                          {deployment.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {deployment.deployedAt 
                          ? new Date(deployment.deployedAt).toLocaleString()
                          : "Not deployed"
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {deployment.status === 'deployed' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => stopDeployment.mutate(deployment.id)}
                            disabled={stopDeployment.isPending}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {deployment.status === 'stopped' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => startDeployment.mutate(deployment.id)}
                            disabled={startDeployment.isPending}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => restartDeployment.mutate(deployment.id)}
                          disabled={restartDeployment.isPending}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteDeployment.mutate(deployment.id)}
                          disabled={deleteDeployment.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Deployments Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "No deployments match your current filters"
                  : "Deploy your first domain ecosystem to get started"}
              </p>
              <Button onClick={() => setIsDeployDialogOpen(true)}>
                <Rocket className="h-4 w-4 mr-2" />
                Deploy Domain
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DeploymentForm({ 
  domains,
  nodes,
  selectedDomain,
  selectedNodes,
  deploymentMode,
  onDomainSelect,
  onNodeSelect,
  onModeChange,
  onDeploy,
  isLoading 
}: {
  domains: DomainEcosystem[];
  nodes: Node[];
  selectedDomain: DomainEcosystem | null;
  selectedNodes: string[];
  deploymentMode: 'individual' | 'distributed' | 'replicated';
  onDomainSelect: (domain: DomainEcosystem) => void;
  onNodeSelect: (nodeId: string, checked: boolean) => void;
  onModeChange: (mode: 'individual' | 'distributed' | 'replicated') => void;
  onDeploy: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Step 1: Select Domain */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
            1
          </div>
          <h3 className="text-lg font-semibold">Select Domain Ecosystem</h3>
        </div>

        {domains.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {domains.map((domain) => (
              <div 
                key={domain.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedDomain?.id === domain.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onDomainSelect(domain)}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{domain.name}</h4>
                    <p className="text-sm text-muted-foreground">{domain.description}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {domain.selectedModules.length} modules
                      </Badge>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {domain.status}
                      </Badge>
                    </div>
                  </div>
                  <ArrowRight className={`h-5 w-5 ${selectedDomain?.id === domain.id ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No configured domain ecosystems available for deployment.
          </div>
        )}
      </div>

      {/* Step 2: Select Nodes */}
      {selectedDomain && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
              2
            </div>
            <h3 className="text-lg font-semibold">Select Target Nodes</h3>
          </div>

          {nodes.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {nodes.map((node) => (
                <div key={node.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id={node.id}
                    checked={selectedNodes.includes(node.id)}
                    onChange={(e) => onNodeSelect(node.id, e.target.checked)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={node.id} className="font-medium cursor-pointer">
                          {node.name}
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          {node.type} • {node.ipAddress}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {node.resources.cpuCores} CPU • {node.resources.ramGb} GB RAM
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {node.capabilities.slice(0, 3).map((cap, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                      {node.capabilities.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{node.capabilities.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No online nodes available for deployment.
            </div>
          )}
        </div>
      )}

      {/* Step 3: Deployment Mode */}
      {selectedDomain && selectedNodes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
              3
            </div>
            <h3 className="text-lg font-semibold">Deployment Mode</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div 
              className={`border rounded-lg p-4 cursor-pointer ${
                deploymentMode === 'individual' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              }`}
              onClick={() => onModeChange('individual')}
            >
              <h4 className="font-medium">Individual</h4>
              <p className="text-sm text-muted-foreground">
                Deploy each module to each selected node independently
              </p>
            </div>

            <div 
              className={`border rounded-lg p-4 cursor-pointer ${
                deploymentMode === 'distributed' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              }`}
              onClick={() => onModeChange('distributed')}
            >
              <h4 className="font-medium">Distributed</h4>
              <p className="text-sm text-muted-foreground">
                Distribute modules across nodes based on capabilities
              </p>
            </div>

            <div 
              className={`border rounded-lg p-4 cursor-pointer ${
                deploymentMode === 'replicated' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              }`}
              onClick={() => onModeChange('replicated')}
            >
              <h4 className="font-medium">Replicated</h4>
              <p className="text-sm text-muted-foreground">
                Deploy full ecosystem copy to each node for redundancy
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Button */}
      {selectedDomain && selectedNodes.length > 0 && (
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={onDeploy} 
            disabled={isLoading}
            className="min-w-32"
          >
            {isLoading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Deploy Ecosystem
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
