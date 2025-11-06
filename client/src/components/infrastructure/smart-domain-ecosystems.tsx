import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { 
  Plus, 
  Search, 
  RefreshCw,
  Package,
  Layers,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Edit,
  Trash2,
  Filter,
  FileCode,
  Boxes,
  Brain,
  Database,
  Shield,
  Cpu,
  MousePointerClick,
  Cog,
  Archive,
  Rocket,
  Loader2,
  X
} from "lucide-react";

interface DomainEcosystem {
  id: string;
  domainId: string; // DOM-12345 (for table display)
  name: string;
  description?: string;
  selectedModules: string[];
  deploymentTargets?: string[];
  ecosystemSmartID?: string; // TEST-DOMAIN-DOM-12345 (full ecosystem identifier)
  moduleInstances?: Array<{
    id: string;
    name: string;
    moduleClassification: string;
    categoryClassification: string;
    moduleSmartId: string;
    domainSmartId: string;
  }>;
  status: 'draft' | 'configured' | 'deployed' | 'error' | 'created';
  createdAt: string;
  updatedAt?: string;
  deployedAt?: string;
}

interface ModuleInfo {
  id: string;
  moduleId: string;
  name: string;
  displayName?: string;
  description?: string;
  modulePath: string;
  status: string;
  version?: string;
}

interface CreateDomainData {
  name: string;
  description?: string;
  selectedModules: string[];
}

export default function SmartDomainEcosystems() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedModulesForDomain, setSelectedModulesForDomain] = useState<string[]>([]);
  
  // Edit domain state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainEcosystem | null>(null);
  const [editSelectedModules, setEditSelectedModules] = useState<string[]>([]);

  // Deploy domain state
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [deployingDomain, setDeployingDomain] = useState<DomainEcosystem | null>(null);
  const [selectedDeploymentTarget, setSelectedDeploymentTarget] = useState<string>("");
  const [deploymentMethod, setDeploymentMethod] = useState<string>("sd_card");

  // Delete confirmation state
  const [deleteConfirmDomain, setDeleteConfirmDomain] = useState<DomainEcosystem | null>(null);

  // Fetch available nodes for deployment targets
  const { data: availableNodes } = useQuery({
    queryKey: ["/api/nodes"],
    queryFn: () => fetch("/api/nodes").then((res) => res.json()),
  });

  const queryClient = useQueryClient();

  // Fetch domain ecosystems
  const { data: domains, isLoading: domainsLoading, refetch: refetchDomains } = useQuery<DomainEcosystem[]>({
    queryKey: ["/api/infrastructure/domains"],
    queryFn: () => fetch("/api/infrastructure/domains").then((res) => res.json()),
  });

  // Fetch available modules (domain-compatible only)
  const { data: modules, isLoading: modulesLoading } = useQuery<ModuleInfo[]>({
    queryKey: ["/api/infrastructure/modules"],
    queryFn: () => fetch("/api/infrastructure/modules").then((res) => res.json()),
  });

  // All validated modules are domain-compatible in SmartContract architecture
  const domainCompatibleModules = modules?.filter(m => 
    m.status === 'validated'
  ) || [];

  // Format module name helper function (same as in smart-modules-manager)
  const getFormattedModuleName = (module: ModuleInfo): string => {
    // Convert names like "smart_compliance" to "SmartCompliance"
    // Handle special cases like "ai" -> "AI", "smart_contracts" -> "SmartContracts"
    
    const formatWord = (word: string) => {
      // Special cases
      if (word.toLowerCase() === 'ai') return 'AI';
      if (word.toLowerCase() === 'id') return 'ID';
      if (word.toLowerCase() === 'api') return 'API';
      
      // Regular capitalization
      return word.charAt(0).toUpperCase() + word.slice(1);
    };
    
    // Always use the raw name field and format it properly
    const formattedName = module.name
      .split('_')
      .map(formatWord)
      .join('');
    
    return formattedName;
  };

  // Create domain mutation
  const createDomain = useMutation({
    mutationFn: async (data: CreateDomainData) => {
      const sessionId = document.cookie
        .split('; ')
        .find(row => row.startsWith('sessionId='))
        ?.split('=')[1];

      const response = await fetch("/api/infrastructure/domains", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'x-session-id': sessionId || '',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to create domains.');
        }
        throw new Error(`Failed to create domain: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/infrastructure/domains"] });
      setIsCreateDialogOpen(false);
      setSelectedModulesForDomain([]);
      
      // Show detailed success message with SMART-ID information
      const smartIdInfo = result.domainId
        ? `Domain ID: ${result.domainId}`
        : '';
      
      const moduleInfo = result.moduleInstances && result.moduleInstances.length > 0
        ? `\nModule instances: ${result.moduleInstances.map((m: any) => `${m.name} (${m.domainSmartId})`).join(', ')}`
        : '';
      
      toast({
        title: "Domain Ecosystem Created",
        description: `Successfully created domain ecosystem${smartIdInfo ? `\n${smartIdInfo}${moduleInfo}` : ''}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create domain ecosystem",
        variant: "destructive",
      });
    },
  });

  // Edit domain mutation
  const editDomain = useMutation({
    mutationFn: async ({ domainId, data }: { domainId: string; data: any }) => {
      const sessionId = document.cookie
        .split('; ')
        .find(row => row.startsWith('sessionId='))
        ?.split('=')[1];

      const response = await fetch(`/api/infrastructure/domains/${domainId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'x-session-id': sessionId || '',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to update domains.');
        }
        throw new Error(`Failed to update domain: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/infrastructure/domains"] });
      closeEditDialog();
      toast({
        title: "Success",
        description: "Domain ecosystem updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update domain ecosystem",
        variant: "destructive",
      });
    },
  });

  // Deploy domain mutation
  const deployDomain = useMutation({
    mutationFn: async ({ domainId, deploymentData }: { domainId: string; deploymentData: any }) => {
      const sessionId = document.cookie
        .split('; ')
        .find(row => row.startsWith('sessionId='))
        ?.split('=')[1];

      const response = await fetch(`/api/infrastructure/domains/${domainId}/deploy`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'x-session-id': sessionId || '',
        },
        body: JSON.stringify(deploymentData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to deploy domains.');
        }
        throw new Error(`Failed to deploy domain: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/infrastructure/domains"] });
      closeDeployDialog();
      toast({
        title: "Deployment Successful",
        description: "Domain ecosystem has been packaged and deployed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy domain ecosystem",
        variant: "destructive",
      });
    },
  });

  // Delete domain mutation
  const deleteDomain = useMutation({
    mutationFn: async (domainId: string) => {
      const sessionId = document.cookie
        .split('; ')
        .find(row => row.startsWith('sessionId='))
        ?.split('=')[1];

      const response = await fetch(`/api/infrastructure/domains/${domainId}`, {
        method: "DELETE",
        headers: {
          'x-session-id': sessionId || '',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to delete domains.');
        }
        throw new Error(`Failed to delete domain: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/infrastructure/domains"] });
      toast({
        title: "Success",
        description: "Domain ecosystem deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete domain ecosystem",
        variant: "destructive",
      });
    },
  });

  const getModuleTypeIcon = (type: string) => {
    switch (type) {
      case "smart_business_package": return <Boxes className="h-4 w-4" />;
      case "smart_business": return <FileCode className="h-4 w-4" />;
      case "ai": return <Brain className="h-4 w-4" />;
      case "core": return <Cpu className="h-4 w-4" />;
      case "security": return <Shield className="h-4 w-4" />;
      case "database": return <Database className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "loaded": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "configured": return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "deployed": return <CheckCircle className="h-4 w-4 text-purple-600" />;
      case "error": return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "loaded": return "text-green-600 border-green-600";
      case "configured": return "text-blue-600 border-blue-600";
      case "deployed": return "text-purple-600 border-purple-600";
      case "error": return "text-red-600 border-red-600";
      default: return "text-yellow-600 border-yellow-600";
    }
  };

  // Filter domains based on search and filters
  const filteredDomains = domains?.filter((domain) => {
    const matchesSearch = 
      domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      domain.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      domain.domainId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || domain.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    if (checked) {
      setSelectedModulesForDomain(prev => [...prev, moduleId]);
    } else {
      setSelectedModulesForDomain(prev => prev.filter(id => id !== moduleId));
    }
  };

  const handleCreateDomain = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const domainData: CreateDomainData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      selectedModules: selectedModulesForDomain,
    };

    if (domainData.selectedModules.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one module for the domain ecosystem",
        variant: "destructive",
      });
      return;
    }

    createDomain.mutate(domainData);
  };

  const handleEditDomain = (domain: DomainEcosystem) => {
    setEditingDomain(domain);
    setEditSelectedModules(domain.selectedModules || []);
    setIsEditDialogOpen(true);
  };

  const handleEditModuleToggle = (moduleId: string, checked: boolean) => {
    if (checked) {
      setEditSelectedModules(prev => [...prev, moduleId]);
    } else {
      setEditSelectedModules(prev => prev.filter(id => id !== moduleId));
    }
  };

  const handleUpdateDomain = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!editingDomain) return;

    const updateData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      selectedModules: editSelectedModules,
    };

    if (updateData.selectedModules.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one module for the domain ecosystem",
        variant: "destructive",
      });
      return;
    }

    editDomain.mutate({
      domainId: editingDomain.domainId,
      data: updateData
    });
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingDomain(null);
    setEditSelectedModules([]);
  };

  // Deployment handlers
  const handleDeployDomain = (domain: DomainEcosystem) => {
    setDeployingDomain(domain);
    // Set the first deployment target if it exists, otherwise empty string
    setSelectedDeploymentTarget(domain.deploymentTargets?.[0] || "");
    setIsDeployDialogOpen(true);
  };

  const handleDeploymentTargetSelect = (target: string) => {
    setSelectedDeploymentTarget(target);
  };

  const handlePackageAndDeploy = () => {
    if (!deployingDomain) return;

    if (!selectedDeploymentTarget) {
      toast({
        title: "Error",
        description: "Please select a deployment target",
        variant: "destructive",
      });
      return;
    }

    // Get the target node name for display
    const targetNode = availableNodes?.find((node: any) => node.id === selectedDeploymentTarget);
    const targetName = targetNode?.name || targetNode?.hostname || "Unknown Target";

    // Prepare deployment data
    const deploymentData = {
      deploymentMethod,
      deploymentTargets: [selectedDeploymentTarget], // Backend expects array
      status: 'deployed'
    };

    // Show initial toast
    toast({
      title: "Packaging & Deployment Started",
      description: `Domain "${deployingDomain.name}" is being packaged for ${deploymentMethod} deployment to ${targetName}`,
    });

    // Trigger the deployment mutation
    deployDomain.mutate({
      domainId: deployingDomain.domainId,
      deploymentData: deploymentData
    });
  };

  const closeDeployDialog = () => {
    setIsDeployDialogOpen(false);
    setDeployingDomain(null);
    setSelectedDeploymentTarget("");
    setDeploymentMethod("sd_card");
  };

  // Delete confirmation handlers
  const confirmDeleteDomain = (domain: DomainEcosystem) => {
    setDeleteConfirmDomain(domain);
  };

  const handleDeleteDomain = () => {
    if (!deleteConfirmDomain) return;
    
    deleteDomain.mutate(deleteConfirmDomain.domainId);
    setDeleteConfirmDomain(null);
  };

  const cancelDeleteDomain = () => {
    setDeleteConfirmDomain(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMART-DomainEcosystems Manager</h1>
          <p className="text-muted-foreground">
            Build custom domain packages by combining compatible modules
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Domain
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Domain Ecosystem</DialogTitle>
                <DialogDescription>
                  Combine compatible modules into a custom domain package
                </DialogDescription>
              </DialogHeader>
              <CreateDomainForm 
                modules={domainCompatibleModules} 
                selectedModules={selectedModulesForDomain}
                onModuleToggle={handleModuleToggle}
                onSubmit={handleCreateDomain}
                isLoading={createDomain.isPending}
                getFormattedModuleName={getFormattedModuleName}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Domain Ecosystem Concept */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-cyan-500" />
            <span>Domain Ecosystem Builder</span>
          </CardTitle>
          <CardDescription>
            Combine domain-compatible modules to create powerful business solutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <MousePointerClick className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold">Select Modules</h3>
              <p className="text-sm text-muted-foreground">
                Choose from available modules (Info Broadcast, Compliance, Safety, etc.)
              </p>
            </div>
            <div className="text-center">
              <Cog className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold">Assign SMART-ID</h3>
              <p className="text-sm text-muted-foreground">
                Generate domain SMART-ID for the entire module package
              </p>
            </div>
            <div className="text-center">
              <Archive className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <h3 className="font-semibold">Package Ecosystem</h3>
              <p className="text-sm text-muted-foreground">
                Bundle modules into a deployable ecosystem package
              </p>
            </div>
            <div className="text-center">
              <Rocket className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold">Deploy to Nodes or Hubs</h3>
              <p className="text-sm text-muted-foreground">
                Deploy via SD card, USB drive, or local network
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
            <Package className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domains?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configured</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {domains?.filter(d => d.status === 'configured').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployed</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {domains?.filter(d => d.status === 'deployed').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Modules</CardTitle>
            <Boxes className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {domainCompatibleModules.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter and Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Domains</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, ID, or description..."
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
                <option value="configured">Configured</option>
                <option value="deployed">Deployed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-cyan-500" />
            <span>Domain Ecosystems</span>
          </CardTitle>
          <CardDescription>
            All configured domain ecosystems in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {domainsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-smart" />
              ))}
            </div>
          ) : filteredDomains && filteredDomains.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Domain ID</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deployment Targets</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Deployed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDomains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{domain.name}</div>
                        {domain.description && (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {domain.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="font-mono text-xs bg-red-50 text-red-700 border-red-200">
                          {domain.domainId || "PENDING"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {domain.selectedModules.slice(0, 3).map((moduleId, idx) => {
                          const module = modules?.find(m => m.id === moduleId);
                          return (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {module ? getFormattedModuleName(module) : moduleId}
                            </Badge>
                          );
                        })}
                        {domain.selectedModules.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{domain.selectedModules.length - 3}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {domain.selectedModules.length} modules selected
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(domain.status)}
                        <Badge variant="outline" className={getStatusColor(domain.status)}>
                          {domain.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {domain.deploymentTargets && domain.deploymentTargets.length > 0 ? (
                          (() => {
                            const targetId = domain.deploymentTargets[0];
                            const targetNode = availableNodes?.find((node: any) => node.id === targetId);
                            const targetName = targetNode?.name || targetNode?.hostname || "Unknown Target";
                            const targetType = targetNode?.type && targetNode.type.includes('hub') ? 'Hub' : 'Node';
                            return (
                              <div className="space-y-1">
                                <div className="font-medium">{targetName}</div>
                                <Badge variant="outline" className="text-xs">
                                  {targetType}
                                </Badge>
                              </div>
                            );
                          })()
                        ) : (
                          <span className="text-muted-foreground">No target set</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        <div>{new Date(domain.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs">{new Date(domain.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {domain.deployedAt ? (
                          <>
                            <div>{new Date(domain.deployedAt).toLocaleDateString()}</div>
                            <div className="text-xs">{new Date(domain.deployedAt).toLocaleTimeString()}</div>
                          </>
                        ) : (
                          <span className="italic">Not deployed</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeployDomain(domain)}
                          title="Package & Deploy domain"
                        >
                          <Rocket className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditDomain(domain)}
                          disabled={editDomain.isPending}
                          title="Edit domain"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => confirmDeleteDomain(domain)}
                          disabled={deleteDomain.isPending}
                          title="Delete domain"
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
              <Package className="h-12 w-12 mx-auto text-cyan-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Domain Ecosystems</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "No domains match your current filters"
                  : "Create your first domain ecosystem to get started"}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Domain Ecosystem
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Domain Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Domain Ecosystem</DialogTitle>
            <DialogDescription>
              Update the domain ecosystem configuration and module selection.
            </DialogDescription>
          </DialogHeader>
          {editingDomain && modules && (
            <EditDomainForm
              domain={editingDomain}
              modules={domainCompatibleModules}
              selectedModules={editSelectedModules}
              onModuleToggle={handleEditModuleToggle}
              onSubmit={handleUpdateDomain}
              onCancel={closeEditDialog}
              isLoading={editDomain.isPending}
              getFormattedModuleName={(module: ModuleInfo) => getFormattedModuleName(module)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Deploy Domain Modal */}
      <Dialog open={isDeployDialogOpen} onOpenChange={setIsDeployDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Rocket className="h-5 w-5 text-green-500" />
              <span>Package & Deploy Domain: {deployingDomain?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Package domain modules and deploy to target nodes/hubs via SD card, USB, or network.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Domain Summary */}
            {deployingDomain && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Domain Summary</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Modules:</strong> {deployingDomain.selectedModules.length}</div>
                  <div><strong>Status:</strong> {deployingDomain.status}</div>
                </div>
              </div>
            )}

            {/* Deployment Method */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Deployment Method</Label>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="sd_card"
                    name="deployment_method"
                    value="sd_card"
                    checked={deploymentMethod === "sd_card"}
                    onChange={(e) => setDeploymentMethod(e.target.value)}
                  />
                  <label htmlFor="sd_card" className="text-sm">📱 SD Card - Package for Raspberry Pi deployment</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="usb_drive"
                    name="deployment_method"
                    value="usb_drive"
                    checked={deploymentMethod === "usb_drive"}
                    onChange={(e) => setDeploymentMethod(e.target.value)}
                  />
                  <label htmlFor="usb_drive" className="text-sm">💾 USB Drive - Portable deployment package</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="local_network"
                    name="deployment_method"
                    value="local_network"
                    checked={deploymentMethod === "local_network"}
                    onChange={(e) => setDeploymentMethod(e.target.value)}
                  />
                  <label htmlFor="local_network" className="text-sm">🌐 Local Network - Direct network deployment</label>
                </div>
              </div>
            </div>

            {/* Deployment Targets */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Deployment Target (Node/Hub)</Label>
              <p className="text-sm text-muted-foreground">
                Select which node or hub should receive this domain deployment.
              </p>
              
              <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 space-y-2">
                {availableNodes && availableNodes.length > 0 ? (
                  availableNodes.map((node: any) => {
                    const target = {
                      id: node.id,
                      name: node.name || node.hostname || `Node ${node.id}`,
                      type: node.type && node.type.includes('hub') ? 'Hub' : 'Node',
                      status: node.status || 'unknown'
                    };
                    return (
                      <div key={target.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`target-${target.id}`}
                            name="deploymentTarget"
                            value={target.id}
                            checked={selectedDeploymentTarget === target.id}
                            onChange={() => handleDeploymentTargetSelect(target.id)}
                            disabled={target.status === 'offline'}
                          />
                          <label htmlFor={`target-${target.id}`} className={`text-sm cursor-pointer ${target.status === 'offline' ? 'opacity-50' : ''}`}>
                            <span className="font-medium">{target.name}</span>
                            <span className="text-muted-foreground ml-1">({target.type})</span>
                          </label>
                        </div>
                        <Badge 
                          variant={target.status === 'online' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {target.status}
                        </Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No nodes/hubs discovered. Go to Infrastructure → Nodes/Hubs to discover agents.
                    </p>
                  </div>
                )}
              </div>
              
              {selectedDeploymentTarget && (
                <p className="text-xs text-muted-foreground">
                  Selected: {availableNodes?.find((node: any) => node.id === selectedDeploymentTarget)?.name || "Unknown"}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={closeDeployDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handlePackageAndDeploy}
              disabled={!selectedDeploymentTarget || deployDomain.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {deployDomain.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Package & Deploy
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmDomain} onOpenChange={cancelDeleteDomain}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <span>Confirm Delete Domain</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete the domain <strong>{deleteConfirmDomain?.name}</strong>? 
            </p>
            <p className="text-sm text-muted-foreground">
              This action will:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Remove the domain ecosystem from the database</li>
              <li>• Delete all associated module instances</li>
              <li>• Remove the domain SMART-ID (if exists)</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelDeleteDomain}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDomain}
              disabled={deleteDomain.isPending}
            >
              {deleteDomain.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Domain
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateDomainForm({ 
  modules, 
  selectedModules, 
  onModuleToggle, 
  onSubmit, 
  isLoading,
  getFormattedModuleName
}: {
  modules: ModuleInfo[];
  selectedModules: string[];
  onModuleToggle: (moduleId: string, checked: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  getFormattedModuleName: (module: ModuleInfo) => string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Domain Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g., Healthcare Analytics Domain"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Brief description of this domain ecosystem"
            rows={3}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Select Modules ({selectedModules.length} selected)</Label>
          <p className="text-sm text-muted-foreground">
            Choose domain-compatible modules to include in this ecosystem
          </p>
        </div>

        <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-3">
          {modules.length > 0 ? (
            modules.map((module) => {
              // Get module classification from metadata
              const moduleClassification = (module as any).metadata?.moduleClassification || 'Unclassified';
              const isHub = moduleClassification === 'Hub';
              const isNode = moduleClassification === 'Node';
              const isSystemWide = moduleClassification === 'System Wide';
              
              return (
                <div key={module.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={module.id}
                    checked={selectedModules.includes(module.id)}
                    onCheckedChange={(checked) => onModuleToggle(module.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={module.id} className="text-sm font-medium cursor-pointer">
                        {getFormattedModuleName(module)}
                      </Label>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          isHub ? 'text-blue-600 border-blue-600' :
                          isNode ? 'text-green-600 border-green-600' :
                          isSystemWide ? 'text-purple-600 border-purple-600' :
                          'text-gray-500 border-gray-400'
                        }`}
                      >
                        <span className="mr-1">{isHub ? '🏢' : isNode ? '🛡️' : isSystemWide ? '⚙️' : '❓'}</span>
                        {moduleClassification}
                      </Badge>
                    </div>
                    {module.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {module.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono">
                      {module.modulePath}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No domain-compatible modules found. Scan for modules first.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isLoading || selectedModules.length === 0}>
          {isLoading ? "Creating..." : "Create Domain Ecosystem"}
        </Button>
      </div>
    </form>
  );
}

function EditDomainForm({ 
  domain,
  modules,
  selectedModules,
  onModuleToggle,
  onSubmit,
  onCancel,
  isLoading,
  getFormattedModuleName 
}: {
  domain: DomainEcosystem;
  modules: ModuleInfo[];
  selectedModules: string[];
  onModuleToggle: (moduleId: string, checked: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isLoading: boolean;
  getFormattedModuleName: (module: ModuleInfo) => string;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="edit-name">Domain Name</Label>
          <Input
            id="edit-name"
            name="name"
            defaultValue={domain.name}
            placeholder="Enter domain ecosystem name"
            required
          />
        </div>

        <div>
          <Label htmlFor="edit-description">Description</Label>
          <Input
            id="edit-description"
            name="description"
            defaultValue={domain.description || ""}
            placeholder="Enter domain ecosystem description"
          />
        </div>

        <div>
          <Label>Select Modules for Domain Ecosystem</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Choose which modules will be part of this domain ecosystem. Each module will receive its own SmartID.
          </p>
          
          <div className="max-h-[300px] overflow-y-auto border rounded-md p-3">
            {modules && modules.length > 0 ? (
              modules.map((module) => {
                // Get module classification from metadata
                const moduleClassification = (module as any).metadata?.moduleClassification || 'Unclassified';
                const isHub = moduleClassification === 'Hub';
                const isNode = moduleClassification === 'Node';
                const isSystemWide = moduleClassification === 'System Wide';
                
                return (
                  <div key={module.id || module.name} className="flex items-center space-x-3 mb-3 p-2 border rounded">
                    <input
                      type="checkbox"
                      id={`edit-module-${module.id || module.name}`}
                      checked={selectedModules.includes(module.id || module.name)}
                      onChange={(e) => onModuleToggle(module.id || module.name, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <label 
                          htmlFor={`edit-module-${module.id || module.name}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {getFormattedModuleName(module)}
                        </label>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            isHub ? 'text-blue-600 border-blue-600' :
                            isNode ? 'text-green-600 border-green-600' :
                            isSystemWide ? 'text-purple-600 border-purple-600' :
                            'text-gray-500 border-gray-400'
                          }`}
                        >
                          <span className="mr-1">{isHub ? '🏢' : isNode ? '🛡️' : isSystemWide ? '⚙️' : '❓'}</span>
                          {moduleClassification}
                        </Badge>
                      </div>
                      {module.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  No domain-compatible modules found. Scan for modules first.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || selectedModules.length === 0}>
          {isLoading ? "Updating..." : "Update Domain Ecosystem"}
        </Button>
      </div>
    </form>
  );
}
