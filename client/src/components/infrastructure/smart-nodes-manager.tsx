import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { 
  Search,
  Server,
  Wifi,
  WifiOff,
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Clock,
  Edit,
  Trash2,
  Filter,
  Loader2,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  Zap,
  Network,
  Settings,
  Package,
  Building2,
  Factory,
  Truck,
  Shield,
  X,
  RefreshCw
} from "lucide-react";

interface Node {
  id: string;
  name: string;
  type: string;
  ipAddress: string;
  sshPort: number;
  capabilities: string[];
  resources: {
    cpuCores: number;
    ramGb: number;
    storageGb: number;
  };
  status?: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
  // Enhanced platform information
  platformInfo?: {
    os: string;           // "Windows 11", "Android 16", "Ubuntu 22.04", etc.
    architecture: string; // "x64", "arm64", "x86", etc.
    platform: string;     // "windows", "android", "linux", "darwin"
    deviceModel?: string; // "Samsung Galaxy Z Fold6", "Dell XPS 13", etc.
    version?: string;     // OS version details
  };
}



export default function SmartNodesManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const [isDiscoveryDialogOpen, setIsDiscoveryDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [deleteConfirmNode, setDeleteConfirmNode] = useState<Node | null>(null);

  const [discoveryResults, setDiscoveryResults] = useState<any>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Register discovered agent mutation
  const registerDiscoveredAgent = useMutation({
    mutationFn: async (agentData: any) => {
      console.log('Registering agent with data:', agentData);
      
      const nodeData = {
        name: agentData.name,
        type: agentData.type,
        ipAddress: agentData.ipAddress,
        sshPort: agentData.sshPort,
        capabilities: agentData.capabilities || ["auto-discovered"],
        resources: agentData.resources
      };
      
      console.log('Sending node data:', nodeData);
      
      // First, register the node
      const nodeResponse = await fetch("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nodeData),
      });

      console.log('Node creation response status:', nodeResponse.status);
      if (!nodeResponse.ok) {
        const errorData = await nodeResponse.json();
        console.error('Node creation error:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to register node');
      }

      const nodeResult = await nodeResponse.json();

      // Then, report to the SMART-Ledger - MUST succeed for operation to be valid
      if (!user?.username) {
        await fetch(`/api/nodes/${nodeResult.node.id}`, { method: "DELETE" });
        throw new Error('User authentication required for ledger recording');
      }
      
      const ledgerResponse = await fetch("/api/ledger/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "nodes",
          action_type: "node",
          action: "register",
          target: agentData.name,
          details: `Registered ${agentData.type === 'smart_hub_node' ? 'Hub' : 'Node'} from auto-discovery (${agentData.ipAddress})`,
          smart_id: nodeResult.node?.smartId || `NOD-${nodeResult.node?.id?.slice(0, 5).toUpperCase()}`,
          user_id: user.username
        })
      });
      
      if (!ledgerResponse.ok) {
        // Rollback: Delete the node that was just created
        await fetch(`/api/nodes/${nodeResult.node.id}`, { method: "DELETE" });
        throw new Error(`Ledger recording failed - operation rolled back`);
      }

      return nodeResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nodes"] });
      toast({
        title: "Success",
        description: "Agent configured and registered successfully",
      });
      // Refresh discovery to update the list
      discoverNodes.mutate();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Fetch nodes
  const { data: nodes, isLoading: nodesLoading, refetch: refetchNodes } = useQuery<Node[]>({
    queryKey: ["/api/nodes"],
    queryFn: () => fetch("/api/nodes").then((res) => res.json()),
    refetchInterval: 5000, // Poll every 5 seconds for real-time status updates
    refetchIntervalInBackground: true, // Keep polling even when tab is not active
  });

  // Create node mutation




  // Delete node mutation
  const deleteNode = useMutation({
    mutationFn: async (nodeId: string) => {
      // Get node info before deleting for ledger reporting
      const nodeToDelete = nodes?.find(n => n.id === nodeId);
      
      const deleteResponse = await fetch(`/api/nodes/${nodeId}`, {
        method: "DELETE"
      });
      
      const result = await deleteResponse.json();
      
      // Report to ledger - MUST succeed
      if (!user?.username) {
        throw new Error('User authentication required for ledger recording');
      }
      
      if (nodeToDelete) {
        const ledgerResponse = await fetch("/api/ledger/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tab: "nodes",
            action_type: "node",
            action: "delete",
            target: nodeToDelete.name,
            details: `Removed ${nodeToDelete.type === 'smart_hub_node' ? 'Hub' : 'Node'} from infrastructure (${nodeToDelete.ipAddress})`,
            smart_id: (nodeToDelete as any).smartId || `NOD-${nodeId.slice(0, 5).toUpperCase()}`,
            user_id: user.username
          })
        });
        
        if (!ledgerResponse.ok) {
          // Cannot rollback deletion - this is a critical failure
          throw new Error(`Ledger recording failed - data integrity compromised`);
        }
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nodes"] });
      toast({
        title: "Success",
        description: "Node deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete node",
        variant: "destructive",
      });
    },
  });

  // Update node mutation
  const updateNode = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Node> }) => {
      const updateResponse = await fetch(`/api/nodes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      const result = await updateResponse.json();
      
      // Report to ledger - MUST succeed
      if (!user?.username) {
        throw new Error('User authentication required for ledger recording');
      }
      
      const ledgerResponse = await fetch("/api/ledger/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "nodes",
          action_type: "node",
          action: "update",
          target: data.name || editingNode?.name || "Unknown",
          details: `Updated ${data.type === 'smart_hub_node' ? 'Hub' : 'Node'} configuration (${data.ipAddress || editingNode?.ipAddress})`,
          smart_id: result.smartId || (editingNode as any)?.smartId || `NOD-${id.slice(0, 5).toUpperCase()}`,
          user_id: user.username
        })
      });
      
      if (!ledgerResponse.ok) {
        throw new Error('Ledger recording failed - operation incomplete');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nodes"] });
      setIsEditDialogOpen(false);
      setEditingNode(null);
      toast({
        title: "Success",
        description: "Node updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update node",
        variant: "destructive",
      });
    },
  });

  // Discover nodes mutation
  const discoverNodes = useMutation({
    mutationFn: () =>
      fetch("/api/nodes/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json()),
    onSuccess: (data) => {
      setDiscoveryResults(data);
      setIsDiscoveryDialogOpen(true);
      toast({
        title: "Discovery Complete",
        description: data.success 
          ? `Found ${data.discovered_agents?.length || 0} SmartNode agents broadcasting`
          : "Discovery scan completed with issues",
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to discover broadcasting agents",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string | undefined) => {
    if (!status) return <Clock className="h-4 w-4 text-gray-600" />;
    switch (status.toLowerCase()) {
      case "online": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "offline": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "text-gray-600 border-gray-600";
    switch (status.toLowerCase()) {
      case "online": return "text-green-600 border-green-600";
      case "offline": return "text-red-600 border-red-600";
      default: return "text-gray-600 border-gray-600";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "smart_node": return <Building2 className="h-4 w-4 text-blue-500" />;
      case "smart_hub_node": return <Building2 className="h-4 w-4 text-blue-500" />;
      case "smart_station_node": return <Server className="h-4 w-4 text-green-500" />;
      case "smart_logistic_node": return <Factory className="h-4 w-4 text-orange-500" />;
      default: return <Server className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type.toLowerCase()) {
      case "smart_hub_node": return "Hub";
      case "smart_node": return "Node";
      case "smart_station_node": return "Node";
      case "smart_logistic_node": return "Node";
      default: return "Node";
    }
  };

  const getPlatformInfo = (node: Node) => {
    // Use actual platform data if available
    if (node.platformInfo) {
      const { platform, os, deviceModel } = node.platformInfo;
      
      switch (platform?.toLowerCase()) {
        case 'android':
          return { 
            platform: os || "Android", 
            icon: "📱", 
            color: "text-green-600",
            details: deviceModel 
          };
        case 'windows':
        case 'win32':
          return { 
            platform: os || "Windows", 
            icon: "🪟", 
            color: "text-blue-600",
            details: deviceModel 
          };
        case 'linux':
          // Check if it's Raspberry Pi
          if (deviceModel?.toLowerCase().includes('raspberry') || 
              node.name.toLowerCase().includes('raspberry')) {
            return { 
              platform: "Raspberry Pi", 
              icon: "🥧", 
              color: "text-pink-600",
              details: os 
            };
          }
          // For other Linux distributions, ensure "Linux" prefix is included
          let linuxPlatform = os || "Linux";
          if (os && !os.toLowerCase().startsWith('linux')) {
            linuxPlatform = `Linux ${os}`;
          }
          return { 
            platform: linuxPlatform, 
            icon: "🐧", 
            color: "text-yellow-600",
            details: deviceModel 
          };
        case 'darwin':
          return { 
            platform: os || "macOS", 
            icon: "🍎", 
            color: "text-gray-600",
            details: deviceModel 
          };
      }
    }
    
    // Fallback to name-based detection for older nodes without platformInfo
    const name = node.name.toLowerCase();
    const ip = node.ipAddress;
    
    // Android detection - look for multiple indicators
    const isAndroidDevice = 
      name.includes('android') || 
      name.includes('phone') || 
      name.includes('tablet') || 
      name.includes('samsung') ||
      node.sshPort === 8022 || // Common Android/Termux SSH port
      // Check capabilities for Android indicators
      (node.capabilities && node.capabilities.some(cap => 
        cap.toLowerCase().includes('android') || 
        cap.toLowerCase().includes('termux') ||
        cap.toLowerCase().includes('mobile')
      ));
    
    if (isAndroidDevice) {
      return { platform: "Android", icon: "📱", color: "text-green-600" };
    }
    
    // Raspberry Pi detection
    if (name.includes('raspberry') || name.includes('pi') || ip.startsWith('172.16.')) {
      return { platform: "Raspberry Pi", icon: "🥧", color: "text-pink-600" };
    }
    
    // Windows detection
    if (name.includes('desktop') || name.includes('pc') || name.includes('windows')) {
      return { platform: "Windows", icon: "🪟", color: "text-blue-600" };
    }
    
    // Linux detection (servers, workstations, etc.)
    if (name.includes('workstation') || name.includes('ai-box') || name.includes('nas') || 
        name.includes('server') || name.includes('ubuntu') || name.includes('linux')) {
      return { platform: "Linux", icon: "🐧", color: "text-yellow-600" };
    }
    
    // macOS detection
    if (name.includes('mac') || name.includes('macos')) {
      return { platform: "macOS", icon: "🍎", color: "text-gray-600" };
    }
    
    // Default fallback - avoid generic "Laptop" classification
    return { platform: "Unknown", icon: "❓", color: "text-gray-500" };
  };

  // Hardware registration is focused on SMART-ID assignment and connectivity
  // No complex capabilities needed - just basic hardware identification

  // Available node types based on SmartNodes Framework
  const availableTypes = [
    "smart_node", "smart_station_node", "smart_logistic_node"
  ];

  // Filter nodes based on search and filters
  const filteredNodes = nodes?.filter((node) => {
    const matchesSearch = 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.ipAddress.includes(searchTerm) ||
      node.capabilities.some(cap => cap.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === "all" || (node.status && node.status.toLowerCase() === filterStatus);
    const matchesType = filterType === "all" || node.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });





  const handleEditNode = (node: Node) => {
    setEditingNode(node);
    setIsEditDialogOpen(true);
  };

  const handleUpdateNode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingNode) return;
    
    const formData = new FormData(e.currentTarget);
    
    const nodeData = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      ipAddress: formData.get('ipAddress') as string,
      sshPort: parseInt(formData.get('sshPort') as string) || 22,
      capabilities: ["registered"], // Just indicates hardware is registered
      resources: {
        cpuCores: parseInt(formData.get('cpuCores') as string) || editingNode.resources?.cpuCores || 1,
        ramGb: parseFloat(formData.get('ramGb') as string) || editingNode.resources?.ramGb || 1,
        storageGb: parseInt(formData.get('storageGb') as string) || editingNode.resources?.storageGb || 10,
      }
    };

    updateNode.mutate({ id: editingNode.id, data: nodeData });
  };

  // Delete confirmation handlers
  const confirmDeleteNode = (node: Node) => {
    setDeleteConfirmNode(node);
  };

  const handleDeleteNode = () => {
    if (!deleteConfirmNode) return;
    
    deleteNode.mutate(deleteConfirmNode.id);
    setDeleteConfirmNode(null);
  };

  const cancelDeleteNode = () => {
    setDeleteConfirmNode(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMART-Nodes/Hubs Management</h1>
          <p className="text-muted-foreground">
            Manage nodes and hubs running SimpleSMARTAgent.py for automatic discovery
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => discoverNodes.mutate()} 
            variant="outline" 
            size="sm"
            disabled={discoverNodes.isPending}
          >
            {discoverNodes.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {discoverNodes.isPending ? "Scanning..." : "Discover Broadcasting Agents"}
          </Button>

        </div>
      </div>

      {/* Node Management Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-orange-500" />
            <span>SMART-Nodes/Hubs Infrastructure Network</span>
          </CardTitle>
          <CardDescription>
            Hardware registration system with SMART-ID assignment and online status tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Search className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold">Auto-Discovery</h3>
              <p className="text-sm text-muted-foreground">
                Automatically discover and register broadcasting SMART-Node agents on the network
              </p>
            </div>
            <div className="text-center">
              <Settings className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold">SMART-ID Assignment</h3>
              <p className="text-sm text-muted-foreground">
                Register hardware with the system and assign unique SMART-IDs for identification
              </p>
            </div>
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <h3 className="font-semibold">Online Status</h3>
              <p className="text-sm text-muted-foreground">
                Track which registered hardware is currently online and accessible
              </p>
            </div>
            <div className="text-center">
              <Network className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold">Hardware Registry</h3>
              <p className="text-sm text-muted-foreground">
                Maintain inventory of all registered nodes and hubs with their titles and locations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes/Hubs</CardTitle>
            <Server className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nodes?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {nodes?.filter(n => n.status && n.status.toLowerCase() === 'online').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {nodes?.filter(n => n.status && n.status.toLowerCase() === 'offline').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <Cpu className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="flex justify-between">
                <span>CPU:</span>
                <span className="font-medium">{Math.round(nodes?.reduce((sum, n) => sum + n.resources.cpuCores, 0) || 0)} cores</span>
              </div>
              <div className="flex justify-between">
                <span>RAM:</span>
                <span className="font-medium">{Math.round(nodes?.reduce((sum, n) => sum + n.resources.ramGb, 0) || 0)} GB</span>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Nodes/Hubs</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, IP, or capabilities..."
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
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-type">Node/Hub Type</Label>
              <select
                id="filter-type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="smart_hub_node">Hub</option>
                <option value="smart_node">Node</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Node Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-orange-500" />
            <span>Registered SMART-Nodes/Hubs</span>
          </CardTitle>
          <CardDescription>
            All SMART-Nodes/Hubs in your autonomous infrastructure network
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nodesLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-smart" />
              ))}
            </div>
          ) : filteredNodes && filteredNodes.length > 0 ? (
            <div className="space-y-6">
              {/* Group nodes by type */}
              {(() => {
                const hubs = filteredNodes.filter(node => getTypeDisplayName(node.type) === "Hub");
                const nodes = filteredNodes.filter(node => getTypeDisplayName(node.type) === "Node");
                
                return (
                  <>
                    {/* SMART Hubs Section */}
                    {hubs.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
                          <Building2 className="h-5 w-5 text-blue-500" />
                          <h3 className="text-lg font-semibold">SMART Hubs ({hubs.length})</h3>
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            Management Centers
                          </Badge>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[20%]">Hub Name</TableHead>
                              <TableHead className="w-[15%]">SMART-ID</TableHead>
                              <TableHead className="w-[15%]">Platform</TableHead>
                              <TableHead className="w-[15%]">Network</TableHead>
                              <TableHead className="w-[15%]">Resources</TableHead>
                              <TableHead className="w-[10%]">Status</TableHead>
                              <TableHead className="w-[15%]">Last Seen</TableHead>
                              <TableHead className="w-[10%]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {hubs.map((node) => (
                              <NodeTableRow key={node.id} node={node} onEdit={handleEditNode} onDelete={confirmDeleteNode} deleteNode={deleteNode} />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* SMART Nodes Section */}
                    {nodes.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
                          <Server className="h-5 w-5 text-green-500" />
                          <h3 className="text-lg font-semibold">SMART Nodes ({nodes.length})</h3>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Execution Units
                          </Badge>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[20%]">Node Name</TableHead>
                              <TableHead className="w-[15%]">SMART-ID</TableHead>
                              <TableHead className="w-[15%]">Platform</TableHead>
                              <TableHead className="w-[15%]">Network</TableHead>
                              <TableHead className="w-[15%]">Resources</TableHead>
                              <TableHead className="w-[10%]">Status</TableHead>
                              <TableHead className="w-[15%]">Last Seen</TableHead>
                              <TableHead className="w-[10%]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {nodes.map((node) => (
                              <NodeTableRow key={node.id} node={node} onEdit={handleEditNode} onDelete={confirmDeleteNode} deleteNode={deleteNode} />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-12">
              <Server className="h-12 w-12 mx-auto text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No SMART-Nodes/Hubs Registered</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== "all" || filterType !== "all"
                  ? "No SMART-Nodes match your current filters"
                  : "Use 'Discover Broadcasting Agents' to find nodes running SimpleSMARTAgent.py"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discovery Results Dialog */}
      <Dialog open={isDiscoveryDialogOpen} onOpenChange={setIsDiscoveryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-500" />
              <span>Broadcasting Agent Discovery</span>
            </DialogTitle>
            <DialogDescription>
              SmartNode agents broadcasting hardware info on UDP port 8765. Click Register to assign SMART-ID.
            </DialogDescription>
          </DialogHeader>
          
          {discoveryResults && (
            <div className="space-y-4">
              {discoveryResults.success ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Discovery Scan Completed</span>
                  </div>
                  
                  {discoveryResults.discovered_agents && discoveryResults.discovered_agents.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Available Agents to Register:</h4>
                      <div className="space-y-3">
                        {discoveryResults.discovered_agents.map((agent: any, index: number) => {
                          const isAlreadyRegistered = nodes?.some(n => n.ipAddress === agent.ip) || false;
                          return (
                            <DiscoveredAgentCard 
                              key={`${agent.ip}-${index}`} 
                              agent={agent} 
                              onRegister={(customName, customType) => {
                                // Prevent registration if already registered
                                if (isAlreadyRegistered) {
                                  toast({
                                    title: "Already Registered",
                                    description: `Node with IP ${agent.ip} is already registered`,
                                    variant: "destructive"
                                  });
                                  return;
                                }
                                
                                // Register with custom name and type
                                const nodeType = customType === 'Hub' ? 'smart_hub_node' : 'smart_node';
                                const agentData = {
                                  name: customName || agent.hostname || `Node-${agent.ip.split('.').pop()}`,
                                  type: nodeType,
                                  ipAddress: agent.ip,
                                  sshPort: agent.ssh_port || agent.port || 22,
                                  capabilities: ["auto-discovered"],
                                  resources: agent.resources ? {
                                    cpuCores: agent.resources.cpu_cores || 1,
                                    ramGb: agent.resources.memory_gb || 1,
                                    storageGb: agent.resources.storage_gb || 64
                                  } : {
                                    cpuCores: 1,
                                    ramGb: 1,
                                    storageGb: 64
                                  }
                                };
                                
                                registerDiscoveredAgent.mutate(agentData);
                              }}
                              isRegistered={isAlreadyRegistered}
                            />
                          );
                        })}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ✅ These agents are broadcasting and ready to be configured
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-yellow-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">No Broadcasting Agents Found</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No SmartNode agents are currently broadcasting on UDP port 8765. This could mean:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• No SmartNode agents are currently running on other devices</li>
                        <li>• Agents are running but UDP broadcasts are blocked by firewalls</li>
                        <li>• Agents are on different network segments</li>
                        <li>• All available agents are already registered</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span className="font-medium">Discovery Failed</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {discoveryResults.error || "Failed to listen for UDP broadcasts"}
                  </p>
                  {discoveryResults.details && (
                    <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                      <p className="text-xs font-mono text-red-400">
                        {discoveryResults.details}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDiscoveryDialogOpen(false)}
                >
                  Close
                </Button>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Node Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Node</DialogTitle>
            <DialogDescription>
              Update the node configuration and capabilities.
            </DialogDescription>
          </DialogHeader>
          
          {editingNode && (
            <form onSubmit={handleUpdateNode} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">SmartNode Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingNode.name}
                    placeholder="Enter node name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-type">SmartNode Type</Label>
                  <select
                    id="edit-type"
                    name="type"
                    defaultValue={editingNode.type}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    required
                  >
                    <option value="smart_hub_node">Hub</option>
                    <option value="smart_node">Node</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-ip">IP Address</Label>
                  <Input
                    id="edit-ip"
                    name="ipAddress"
                    defaultValue={editingNode.ipAddress}
                    placeholder="192.168.1.100"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-ssh-port">SSH Port</Label>
                  <Input
                    id="edit-ssh-port"
                    name="sshPort"
                    type="number"
                    defaultValue={editingNode.sshPort}
                    placeholder="22"
                    required
                  />
                </div>
              </div>

              {/* Resources */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="text-lg font-semibold mb-4">Hardware Resources</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-cpu">CPU Cores</Label>
                    <Input
                      id="edit-cpu"
                      name="cpuCores"
                      type="number"
                      defaultValue={editingNode.resources?.cpuCores || 1}
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-ram">RAM (GB)</Label>
                    <Input
                      id="edit-ram"
                      name="ramGb"
                      type="number"
                      defaultValue={editingNode.resources?.ramGb || 1}
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-storage">Storage (GB)</Label>
                    <Input
                      id="edit-storage"
                      name="storageGb"
                      type="number"
                      defaultValue={editingNode.resources?.storageGb || 10}
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateNode.isPending}>
                  {updateNode.isPending ? "Updating..." : "Update Node"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmNode} onOpenChange={cancelDeleteNode}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <span>Confirm Delete Node</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete the node <strong>{deleteConfirmNode?.name}</strong>? 
            </p>
            <p className="text-sm text-muted-foreground">
              This action will:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Remove the node from the database</li>
              <li>• Delete the associated SMART-ID (if exists)</li>
              <li>• Remove any deployed modules from this node</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelDeleteNode}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteNode}
              disabled={deleteNode.isPending}
            >
              {deleteNode.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Node
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function DiscoveredAgentCard({ 
  agent, 
  onRegister, 
  isRegistered 
}: {
  agent: any;
  onRegister: (customName?: string, customType?: string) => void;
  isRegistered: boolean;
}) {
  const [customName, setCustomName] = useState(agent.hostname || `Node-${agent.ip.split('.').pop()}`);
  const [customType, setCustomType] = useState('Node'); // Default to Node
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingType, setIsEditingType] = useState(false);

  const getDeviceIcon = (type: string) => {
    if (type === 'Hub') {
      return <Building2 className="h-5 w-5 text-blue-400" />;
    }
    return <Server className="h-5 w-5 text-green-400" />;
  };

  const generateSmartId = () => {
    // Generate stable SMART-ID based on agent IP for consistent display
    // This ensures the same agent always shows the same preview SMART-ID
    const ipHash = agent.ip.split('.').reduce((acc: number, octet: string) => acc + parseInt(octet), 0);
    const stableNum = (ipHash * 1000 + parseInt(agent.ip.split('.')[3])).toString().padStart(5, '0').slice(-5);
    return `MOD-${stableNum}`;
  };

  return (
    <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
      <div className="flex items-center space-x-4 flex-1">
        {getDeviceIcon(customType)}
        
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex-1">
              {/* Editable name field */}
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="text-sm font-semibold bg-background"
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingName(false);
                      }
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div 
                    className="font-semibold text-foreground cursor-pointer hover:text-blue-400"
                    onClick={() => setIsEditingName(true)}
                    title="Click to edit name"
                  >
                    {customName}
                  </div>
                  <Edit className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-blue-400" 
                        onClick={() => setIsEditingName(true)} />
                </div>
              )}
              <div className="text-sm text-muted-foreground font-mono">
                {agent.ip} • Type: {isEditingType ? (
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    onBlur={() => setIsEditingType(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingType(false);
                      }
                    }}
                    className="bg-background border rounded px-1 text-foreground"
                    autoFocus
                  >
                    <option value="Node">Node</option>
                    <option value="Hub">Hub</option>
                  </select>
                ) : (
                  <span 
                    className="cursor-pointer hover:text-blue-400 inline-flex items-center space-x-1"
                    onClick={() => setIsEditingType(true)}
                    title="Click to edit type"
                  >
                    <span>{customType}</span>
                    <Edit className="h-2 w-2" />
                  </span>
                )}
              </div>
            </div>
            {isRegistered && (
              <Badge variant="outline" className="text-green-400 border-green-400/50 bg-green-500/10">
                <CheckCircle className="h-3 w-3 mr-1" />
                Registered
              </Badge>
            )}
          </div>
          
          {/* Auto-detected hardware */}
          {agent.resources && (
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Cpu className="h-3 w-3" />
                <span>{Math.round(agent.resources.cpu_cores) || 1} cores</span>
              </div>
              <div className="flex items-center space-x-1">
                <MemoryStick className="h-3 w-3" />
                <span>{Math.round(agent.resources.memory_gb) || 1}GB RAM</span>
              </div>
              <div className="flex items-center space-x-1">
                <HardDrive className="h-3 w-3" />
                <span>{Math.round(agent.resources.storage_gb) || 64}GB</span>
              </div>
            </div>
          )}
          
          <div className="text-xs text-blue-300 mt-1">
            Broadcasting on UDP 8765 • Will assign SMART-ID: {generateSmartId()}
          </div>
        </div>
      </div>
      
      <div className="shrink-0">
        {isRegistered ? (
          <Badge variant="outline" className="text-green-400 border-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Registered
          </Badge>
        ) : (
          <Button onClick={() => onRegister(customName, customType)} size="sm" className="bg-green-600 hover:bg-green-700">
            <Zap className="h-4 w-4 mr-2" />
            Register & Assign SMART-ID
          </Button>
        )}
      </div>
    </div>
  );
}

// Separate component for table rows to avoid repetition
function NodeTableRow({ 
  node, 
  onEdit, 
  onDelete, 
  deleteNode 
}: {
  node: Node;
  onEdit: (node: Node) => void;
  onDelete: (node: Node) => void;
  deleteNode: any;
}) {
  const getStatusIcon = (status: string | undefined) => {
    if (!status) return <Clock className="h-4 w-4 text-gray-600" />;
    switch (status.toLowerCase()) {
      case "online": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "offline": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "text-gray-600 border-gray-600";
    switch (status.toLowerCase()) {
      case "online": return "text-green-600 border-green-600";
      case "offline": return "text-red-600 border-red-600";
      default: return "text-gray-600 border-gray-600";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "smart_node": return <Building2 className="h-4 w-4 text-blue-500" />;
      case "smart_hub_node": return <Building2 className="h-4 w-4 text-blue-500" />;
      case "smart_station_node": return <Server className="h-4 w-4 text-green-500" />;
      case "smart_logistic_node": return <Factory className="h-4 w-4 text-orange-500" />;
      default: return <Server className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPlatformInfo = (node: Node) => {
    // Use actual platform data if available
    if (node.platformInfo) {
      const { platform, os, deviceModel } = node.platformInfo;
      
      switch (platform?.toLowerCase()) {
        case 'android':
          return { 
            platform: os || "Android", 
            icon: "📱", 
            color: "text-green-600",
            details: deviceModel 
          };
        case 'windows':
        case 'win32':
          return { 
            platform: os || "Windows", 
            icon: "🪟", 
            color: "text-blue-600",
            details: deviceModel 
          };
        case 'linux':
          // Check if it's Raspberry Pi
          if (deviceModel?.toLowerCase().includes('raspberry') || 
              node.name.toLowerCase().includes('raspberry')) {
            return { 
              platform: "Raspberry Pi", 
              icon: "🥧", 
              color: "text-pink-600",
              details: os 
            };
          }
          // For other Linux distributions, ensure "Linux" prefix is included
          let linuxPlatform = os || "Linux";
          if (os && !os.toLowerCase().startsWith('linux')) {
            linuxPlatform = `Linux ${os}`;
          }
          return { 
            platform: linuxPlatform, 
            icon: "🐧", 
            color: "text-yellow-600",
            details: deviceModel 
          };
        case 'darwin':
          return { 
            platform: os || "macOS", 
            icon: "🍎", 
            color: "text-gray-600",
            details: deviceModel 
          };
      }
    }
    
    // Fallback to name-based detection for older nodes without platformInfo
    const name = node.name.toLowerCase();
    const ip = node.ipAddress;
    
    // Android detection - look for multiple indicators
    const isAndroidDevice = 
      name.includes('android') || 
      name.includes('phone') || 
      name.includes('tablet') || 
      name.includes('samsung') ||
      node.sshPort === 8022 || // Common Android/Termux SSH port
      // Check capabilities for Android indicators
      (node.capabilities && node.capabilities.some(cap => 
        cap.toLowerCase().includes('android') || 
        cap.toLowerCase().includes('termux') ||
        cap.toLowerCase().includes('mobile')
      ));
    
    if (isAndroidDevice) {
      return { platform: "Android", icon: "📱", color: "text-green-600" };
    }
    
    // Raspberry Pi detection
    if (name.includes('raspberry') || name.includes('pi') || ip.startsWith('172.16.')) {
      return { platform: "Raspberry Pi", icon: "🥧", color: "text-pink-600" };
    }
    
    // Windows detection
    if (name.includes('desktop') || name.includes('pc') || name.includes('windows')) {
      return { platform: "Windows", icon: "🪟", color: "text-blue-600" };
    }
    
    // Linux detection (servers, workstations, etc.)
    if (name.includes('workstation') || name.includes('ai-box') || name.includes('nas') || 
        name.includes('server') || name.includes('ubuntu') || name.includes('linux')) {
      return { platform: "Linux", icon: "🐧", color: "text-yellow-600" };
    }
    
    // macOS detection
    if (name.includes('mac') || name.includes('macos')) {
      return { platform: "macOS", icon: "�p", color: "text-gray-600" };
    }
    
    // Default fallback - avoid generic "Laptop" classification
    return { platform: "Unknown", icon: "❓", color: "text-gray-500" };
  };

  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {getTypeIcon(node.type)}
            <div className="font-medium">{node.name}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <Badge variant="outline" className="font-mono text-xs bg-orange-50 text-orange-700 border-orange-200">
            {(node as any).smartId || 'NOD-PENDING'}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className={`flex items-center space-x-2 text-sm ${getPlatformInfo(node).color}`}>
            <span>{getPlatformInfo(node).icon}</span>
            <span className="font-medium">{getPlatformInfo(node).platform}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="font-mono text-sm">{node.ipAddress}</div>
          <div className="text-xs text-muted-foreground">
            SSH: {node.sshPort}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1 text-sm">
          <div className="flex items-center space-x-1">
            <Cpu className="h-3 w-3" />
            <span>{Math.round(node.resources.cpuCores)} cores</span>
          </div>
          <div className="flex items-center space-x-1">
            <MemoryStick className="h-3 w-3" />
            <span>{Math.round(node.resources.ramGb)} GB RAM</span>
          </div>
          <div className="flex items-center space-x-1">
            <HardDrive className="h-3 w-3" />
            <span>{Math.round(node.resources.storageGb)} GB</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          {getStatusIcon(node.status)}
          <Badge variant="outline" className={getStatusColor(node.status)}>
            {node.status || 'unknown'}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {new Date(node.lastSeen).toLocaleString()}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEdit(node)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDelete(node)}
            disabled={deleteNode.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}


