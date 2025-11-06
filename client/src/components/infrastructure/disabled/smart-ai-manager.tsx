import { useState, useEffect } from "react";
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
  Brain, 
  Search, 
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Filter,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Settings,
  TrendingUp,
  Eye,
  Database,
  Network,
  Shield,
  Code,
  BarChart3,
  Layers,
  Loader2
} from "lucide-react";

interface AIInstance {
  id: string;
  name: string;
  modelType: string;
  version: string;
  framework: string;
  status: 'running' | 'stopped' | 'training' | 'deploying' | 'error';
  assignedNode?: string;
  assignedDomain?: string;
  resources: {
    cpuCores: number;
    gpuCores?: number;
    ramGb: number;
    vramGb?: number;
    storageGb: number;
  };
  metrics: {
    inferenceLatency: number;
    throughput: number;
    accuracy?: number;
    utilization: number;
  };
  configuration: {
    batchSize: number;
    maxTokens?: number;
    temperature?: number;
    apiEndpoint?: string;
  };
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface CreateAIInstanceData {
  name: string;
  modelType: string;
  version: string;
  framework: string;
  assignedNode?: string;
  assignedDomain?: string;
  resources: {
    cpuCores: number;
    gpuCores?: number;
    ramGb: number;
    vramGb?: number;
    storageGb: number;
  };
  configuration: {
    batchSize: number;
    maxTokens?: number;
    temperature?: number;
  };
  permissions: string[];
}

export default function SmartAIManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterModelType, setFilterModelType] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [aiInstancesData, setAIInstancesData] = useState<AIInstance[]>([]);

  const queryClient = useQueryClient();

  // Initialize mock AI instances data
  const initializeMockData = () => {
    const mockAIInstances: AIInstance[] = [
    {
      id: "ai-1",
      name: "SmartAI Llama 3.1",
      modelType: "llm",
      version: "3.1-8B",
      framework: "PyTorch",
      status: "running",
      assignedNode: "node-ai-01",
      assignedDomain: "healthcare_analytics_domain",
      resources: {
        cpuCores: 8,
        gpuCores: 1,
        ramGb: 32,
        vramGb: 24,
        storageGb: 100
      },
      metrics: {
        inferenceLatency: 150,
        throughput: 45,
        accuracy: 94.2,
        utilization: 78
      },
      configuration: {
        batchSize: 4,
        maxTokens: 2048,
        temperature: 0.7,
        apiEndpoint: "http://192.168.1.101:8080/v1"
      },
      permissions: ["read", "generate", "analyze"],
      createdAt: "2024-07-01T00:00:00Z",
      updatedAt: "2024-08-14T00:00:00Z"
    },
    {
      id: "ai-2",
      name: "Vision Analysis Model",
      modelType: "vision",
      version: "1.0",
      framework: "TensorFlow",
      status: "running",
      assignedNode: "node-bc-02",
      resources: {
        cpuCores: 4,
        gpuCores: 1,
        ramGb: 16,
        vramGb: 12,
        storageGb: 50
      },
      metrics: {
        inferenceLatency: 50,
        throughput: 120,
        accuracy: 96.8,
        utilization: 65
      },
      configuration: {
        batchSize: 8,
        apiEndpoint: "http://192.168.1.102:8081/predict"
      },
      permissions: ["read", "classify", "detect"],
      createdAt: "2024-06-15T00:00:00Z",
      updatedAt: "2024-08-14T00:00:00Z"
    },
    {
      id: "ai-3",
      name: "Time Series Predictor",
      modelType: "forecasting",
      version: "2.3",
      framework: "scikit-learn",
      status: "training",
      assignedNode: "node-edge-03",
      resources: {
        cpuCores: 6,
        ramGb: 24,
        storageGb: 75
      },
      metrics: {
        inferenceLatency: 25,
        throughput: 200,
        accuracy: 89.5,
        utilization: 45
      },
      configuration: {
        batchSize: 16,
        apiEndpoint: "http://192.168.1.103:8082/forecast"
      },
      permissions: ["read", "predict", "analyze"],
      createdAt: "2024-08-01T00:00:00Z",
      updatedAt: "2024-08-14T00:00:00Z"
    }
  ];
  setAIInstancesData(mockAIInstances);
};

// Initialize data on component mount
useEffect(() => {
  if (aiInstancesData.length === 0) {
    initializeMockData();
  }
}, []);

// Use aiInstancesData instead of mock data for the query
const { data: aiInstances = aiInstancesData, isLoading: aiLoading, refetch: refetchAI } = useQuery({
  queryKey: ["/api/ai-instances"],
  queryFn: () => Promise.resolve(aiInstancesData),
  initialData: aiInstancesData,
});

  const createAIInstance = useMutation({
    mutationFn: (data: CreateAIInstanceData) => {
      const newInstance: AIInstance = {
        ...data,
        id: `ai-${Date.now()}`,
        status: 'deploying',
        metrics: {
          inferenceLatency: 0,
          throughput: 0,
          utilization: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return Promise.resolve(newInstance);
    },
    onSuccess: (newInstance) => {
      setAIInstancesData(prev => [...prev, newInstance]);
      queryClient.invalidateQueries({ queryKey: ["/api/ai-instances"] });
      setIsCreateDialogOpen(false);
      setSelectedPermissions([]);
      toast({
        title: "Success",
        description: "AI instance created successfully",
      });
    },
  });

  const controlAIInstance = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'start' | 'stop' | 'restart' }) => {
      return Promise.resolve({ id, action });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-instances"] });
      toast({
        title: "Success",
        description: `AI instance ${data.action}ed successfully`,
      });
    },
  });

  const deleteAIInstance = useMutation({
    mutationFn: (id: string) => {
      // Simulate API call
      return Promise.resolve({ success: true });
    },
    onSuccess: (_, id) => {
      setAIInstancesData(prev => prev.filter(ai => ai.id !== id));
      queryClient.invalidateQueries({ queryKey: ["/api/ai-instances"] });
      toast({
        title: "Success",
        description: "AI instance deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete AI instance",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "running": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "training": return <Activity className="h-4 w-4 text-green-500" />;
      case "deploying": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "stopped": return <Pause className="h-4 w-4 text-gray-600" />;
      case "error": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "running": return "text-green-600 border-green-600";
      case "training": return "text-blue-600 border-blue-600";
      case "deploying": return "text-yellow-600 border-yellow-600";
      case "stopped": return "text-gray-600 border-gray-600";
      case "error": return "text-red-600 border-red-600";
      default: return "text-gray-600 border-gray-600";
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "llm": return <Brain className="h-4 w-4 text-pink-500" />;
      case "vision": return <Eye className="h-4 w-4" />;
      case "forecasting": return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case "classification": return <Layers className="h-4 w-4" />;
      case "embeddings": return <Database className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4 text-pink-500" />;
    }
  };

  const modelTypes = ["llm", "vision", "forecasting", "classification", "embeddings", "other"];
  const frameworks = ["PyTorch", "TensorFlow", "scikit-learn", "Hugging Face", "ONNX", "Other"];
  const permissionOptions = [
    "read", "write", "generate", "analyze", "classify", "detect", 
    "predict", "train", "deploy", "admin"
  ];

  // Filter AI instances
  const filteredAIInstances = aiInstances.filter((instance) => {
    const matchesSearch = 
      instance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.modelType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.framework.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.version.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || instance.status === filterStatus;
    const matchesModelType = filterModelType === "all" || instance.modelType === filterModelType;
    
    return matchesSearch && matchesStatus && matchesModelType;
  });

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permission]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permission));
    }
  };

  const handleCreateAI = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const aiData: CreateAIInstanceData = {
      name: formData.get('name') as string,
      modelType: formData.get('modelType') as string,
      version: formData.get('version') as string,
      framework: formData.get('framework') as string,
      assignedNode: formData.get('assignedNode') as string || undefined,
      assignedDomain: formData.get('assignedDomain') as string || undefined,
      resources: {
        cpuCores: parseInt(formData.get('cpuCores') as string) || 2,
        gpuCores: parseInt(formData.get('gpuCores') as string) || undefined,
        ramGb: parseInt(formData.get('ramGb') as string) || 8,
        vramGb: parseInt(formData.get('vramGb') as string) || undefined,
        storageGb: parseInt(formData.get('storageGb') as string) || 20,
      },
      configuration: {
        batchSize: parseInt(formData.get('batchSize') as string) || 1,
        maxTokens: parseInt(formData.get('maxTokens') as string) || undefined,
        temperature: parseFloat(formData.get('temperature') as string) || undefined,
      },
      permissions: selectedPermissions
    };

    createAIInstance.mutate(aiData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Manager</h1>
          <p className="text-muted-foreground">
            Deploy and manage AI models and instances across your infrastructure
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => refetchAI()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Deploy AI Model
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Deploy New AI Instance</DialogTitle>
                <DialogDescription>
                  Configure and deploy a new AI model instance
                </DialogDescription>
              </DialogHeader>
              <AIInstanceForm 
                modelTypes={modelTypes}
                frameworks={frameworks}
                permissionOptions={permissionOptions}
                selectedPermissions={selectedPermissions}
                onPermissionToggle={handlePermissionToggle}
                onSubmit={handleCreateAI}
                isLoading={createAIInstance.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-pink-500" />
            <span>AI Infrastructure Management</span>
          </CardTitle>
          <CardDescription>
            Deploy, configure, and monitor AI models across your distributed infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Brain className="h-8 w-8 mx-auto mb-2 text-pink-500" />
              <h3 className="font-semibold">Model Deployment</h3>
              <p className="text-sm text-muted-foreground">
                Deploy AI models with optimized resource allocation
              </p>
            </div>
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold">Performance Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Track inference latency, throughput, and accuracy
              </p>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold">Access Control</h3>
              <p className="text-sm text-muted-foreground">
                Manage permissions and domain-specific access
              </p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <h3 className="font-semibold">Auto Scaling</h3>
              <p className="text-sm text-muted-foreground">
                Automatic resource scaling based on demand
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Instances</CardTitle>
            <Brain className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiInstances.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {aiInstances.filter(ai => ai.status === 'running').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {aiInstances.filter(ai => ai.status === 'training').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {aiInstances.length > 0 
                ? (aiInstances
                    .filter(ai => ai.metrics.accuracy)
                    .reduce((sum, ai) => sum + (ai.metrics.accuracy || 0), 0) 
                  / aiInstances.filter(ai => ai.metrics.accuracy).length).toFixed(1)
                : 0
              }%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter AI Instances</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search AI Instances</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, model, framework..."
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
                <option value="running">Running</option>
                <option value="training">Training</option>
                <option value="deploying">Deploying</option>
                <option value="stopped">Stopped</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-model-type">Model Type</Label>
              <select
                id="filter-model-type"
                value={filterModelType}
                onChange={(e) => setFilterModelType(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                {modelTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Instances Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-pink-500" />
            <span>AI Instances</span>
          </CardTitle>
          <CardDescription>
            Deployed AI models and their performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aiLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-smart" />
              ))}
            </div>
          ) : filteredAIInstances.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Resources</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAIInstances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {getModelTypeIcon(instance.modelType)}
                          <div className="font-medium">{instance.name}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {instance.framework} • v{instance.version}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {instance.assignedNode && (
                          <div><span className="font-medium">Node:</span> {instance.assignedNode}</div>
                        )}
                        {instance.assignedDomain && (
                          <div><span className="font-medium">Domain:</span> {instance.assignedDomain}</div>
                        )}
                        {!instance.assignedNode && !instance.assignedDomain && (
                          <div className="text-muted-foreground">Unassigned</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center space-x-1">
                          <Cpu className="h-3 w-3" />
                          <span>{instance.resources.cpuCores} CPU</span>
                          {instance.resources.gpuCores && <span>• {instance.resources.gpuCores} GPU</span>}
                        </div>
                        <div className="flex items-center space-x-1">
                          <MemoryStick className="h-3 w-3" />
                          <span>{instance.resources.ramGb} GB RAM</span>
                          {instance.resources.vramGb && <span>• {instance.resources.vramGb} GB VRAM</span>}
                        </div>
                        <div className="flex items-center space-x-1">
                          <HardDrive className="h-3 w-3" />
                          <span>{instance.resources.storageGb} GB Storage</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>Latency: {instance.metrics.inferenceLatency}ms</div>
                        <div>Throughput: {instance.metrics.throughput} req/s</div>
                        {instance.metrics.accuracy && (
                          <div>Accuracy: {instance.metrics.accuracy}%</div>
                        )}
                        <div>Utilization: {instance.metrics.utilization}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(instance.status)}
                        <Badge variant="outline" className={getStatusColor(instance.status)}>
                          {instance.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>Batch: {instance.configuration.batchSize}</div>
                        {instance.configuration.maxTokens && (
                          <div>Max Tokens: {instance.configuration.maxTokens}</div>
                        )}
                        {instance.configuration.temperature && (
                          <div>Temperature: {instance.configuration.temperature}</div>
                        )}
                        {instance.configuration.apiEndpoint && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {instance.configuration.apiEndpoint}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {instance.status === 'running' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => controlAIInstance.mutate({ id: instance.id, action: 'stop' })}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {instance.status === 'stopped' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => controlAIInstance.mutate({ id: instance.id, action: 'start' })}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => controlAIInstance.mutate({ id: instance.id, action: 'restart' })}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete AI instance "${instance.name}"?`)) {
                              deleteAIInstance.mutate(instance.id);
                            }
                          }}
                          disabled={deleteAIInstance.isPending}
                          className="text-red-600 hover:text-red-700"
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
              <Brain className="h-12 w-12 mx-auto text-pink-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No AI Instances Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== "all" || filterModelType !== "all"
                  ? "No AI instances match your current filters"
                  : "Deploy your first AI model to get started"}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Deploy AI Model
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AIInstanceForm({ 
  modelTypes,
  frameworks,
  permissionOptions,
  selectedPermissions, 
  onPermissionToggle, 
  onSubmit, 
  isLoading 
}: {
  modelTypes: string[];
  frameworks: string[];
  permissionOptions: string[];
  selectedPermissions: string[];
  onPermissionToggle: (permission: string, checked: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}) {

  const handleGenerateSmartID = () => {
    const formElement = document.getElementById('createAIForm') as HTMLFormElement;
    const formData = new FormData(formElement);
    
    const aiName = formData.get('name') as string;
    const modelType = formData.get('modelType') as string;
    const framework = formData.get('framework') as string;

    if (!aiName || !modelType || !framework) {
      toast({
        title: "Missing Information",
        description: "Please fill in Instance Name, Model Type, and Framework before generating SmartID",
        variant: "destructive"
      });
      return;
    }

    createSmartID.mutate({
      entityType: 'ai',
      name: aiName,
      type: modelType,
      capabilities: {
        framework,
        selectedPermissions
      }
    }, {
      onSuccess: (data) => {
        setGeneratedSmartID(data.smart_id);
      }
    });
  };

  return (
    <form id="createAIForm" onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Instance Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g., SmartAI Llama 3.1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="modelType">Model Type</Label>
          <select
            id="modelType"
            name="modelType"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select type</option>
            {modelTypes.map((type) => (
              <option key={type} value={type}>
                {type.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            name="version"
            placeholder="e.g., 3.1-8B, 1.0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="framework">Framework</Label>
          <select
            id="framework"
            name="framework"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select framework</option>
            {frameworks.map((framework) => (
              <option key={framework} value={framework}>
                {framework}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignedNode">Assigned Node (Optional)</Label>
          <Input
            id="assignedNode"
            name="assignedNode"
            placeholder="e.g., node-ai-01"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignedDomain">Assigned Domain (Optional)</Label>
          <Input
            id="assignedDomain"
            name="assignedDomain"
            placeholder="e.g., healthcare_analytics_domain"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpuCores">CPU Cores</Label>
          <Input
            id="cpuCores"
            name="cpuCores"
            type="number"
            placeholder="4"
            min="1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gpuCores">GPU Cores (Optional)</Label>
          <Input
            id="gpuCores"
            name="gpuCores"
            type="number"
            placeholder="1"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ramGb">RAM (GB)</Label>
          <Input
            id="ramGb"
            name="ramGb"
            type="number"
            placeholder="16"
            min="1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vramGb">VRAM (GB) (Optional)</Label>
          <Input
            id="vramGb"
            name="vramGb"
            type="number"
            placeholder="8"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="storageGb">Storage (GB)</Label>
          <Input
            id="storageGb"
            name="storageGb"
            type="number"
            placeholder="50"
            min="1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="batchSize">Batch Size</Label>
          <Input
            id="batchSize"
            name="batchSize"
            type="number"
            placeholder="4"
            min="1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxTokens">Max Tokens (Optional)</Label>
          <Input
            id="maxTokens"
            name="maxTokens"
            type="number"
            placeholder="2048"
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature (Optional)</Label>
          <Input
            id="temperature"
            name="temperature"
            type="number"
            step="0.1"
            placeholder="0.7"
            min="0"
            max="2"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Permissions ({selectedPermissions.length} selected)</Label>
          <p className="text-sm text-muted-foreground">
            Select the permissions this AI instance should have
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {permissionOptions.map((permission) => (
            <div key={permission} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={permission}
                checked={selectedPermissions.includes(permission)}
                onChange={(e) => onPermissionToggle(permission, e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor={permission} className="text-sm cursor-pointer">
                {permission.charAt(0).toUpperCase() + permission.slice(1)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* SmartID Generation Section */}
      <div className="border rounded-lg p-4 bg-muted/50">
        <h3 className="text-lg font-semibold mb-4">AI Instance SmartID</h3>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Generate a unique SmartID for this AI instance. Fill in the instance details above first.
          </p>
          
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={handleGenerateSmartID}
              disabled={createSmartID.isPending}
              className="shrink-0"
            >
              {createSmartID.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate SmartID"
              )}
            </Button>
            
            {generatedSmartID && (
              <div className="flex-1 p-3 bg-background border rounded-md">
                <Label className="text-xs font-medium text-muted-foreground">Generated SmartID</Label>
                <div className="font-mono text-sm mt-1 break-all">{generatedSmartID}</div>
              </div>
            )}
          </div>
          
          {generatedSmartID && (
            <p className="text-xs text-green-600">
              ✓ SmartID generated and registered in the system
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Deploying..." : "Deploy AI Instance"}
        </Button>
      </div>
    </form>
  );
}
