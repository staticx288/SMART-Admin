import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  RefreshCw, 
  FolderOpen,
  FileCode,
  Package,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Cpu,
  Database,
  ShieldCheck,
  Brain,
  Settings,
  Zap,
  Boxes,
  Activity,
  Edit,
  Save,
  X,
  Plus,
  Palette,
  Trash2
} from "lucide-react";

interface ModuleInfo {
  id: string;
  moduleId: string;
  name: string;
  displayName?: string;
  description?: string;
  modulePath: string;
  status: 'discovered' | 'validated';
  lastScanned: string;
  metadata: Record<string, any>;
  createdAt: string;
}

interface ScanProgress {
  scanning: boolean;
  currentPath: string;
  filesScanned: number;
  modulesFound: number;
  progress: number;
}

export default function SmartModulesManager() {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClassification, setFilterClassification] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [configuringModule, setConfiguringModule] = useState<ModuleInfo | null>(null);
  const [showReadmeModal, setShowReadmeModal] = useState(false);
  const [readmeContent, setReadmeContent] = useState<string>("");
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [selectedReadmeModule, setSelectedReadmeModule] = useState<ModuleInfo | null>(null);
  const [deleteConfirmModule, setDeleteConfirmModule] = useState<ModuleInfo | null>(null);
  const [configureForm, setConfigureForm] = useState({
    displayName: "",
    description: "",
    moduleClassification: "",
    categoryClassification: ""
  });
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    scanning: false,
    currentPath: '',
    filesScanned: 0,
    modulesFound: 0,
    progress: 0
  });

  const queryClient = useQueryClient();

  // Fetch discovered modules
  const { data: modules, isLoading, refetch } = useQuery<ModuleInfo[]>({
    queryKey: ["/api/infrastructure/modules"],
    queryFn: () => fetch("/api/infrastructure/modules").then((res) => res.json()),
  });

  // Scan for modules mutation - only finds NEW modules
  const scanModules = useMutation({
    mutationFn: async () => {
      const sessionId = document.cookie
        .split('; ')
        .find(row => row.startsWith('sessionId='))
        ?.split('=')[1];

      const response = await fetch("/api/infrastructure/modules/scan", { 
        method: "POST",
        headers: {
          'x-session-id': sessionId || '',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to perform manual scans.');
        }
        throw new Error(`Failed to scan modules: ${response.statusText}`);
      }
      
      return response.json();
    },
    onMutate: () => {
      setIsScanning(true);
      setScanProgress({
        scanning: true,
        currentPath: 'Scanning for NEW modules...',
        filesScanned: 0,
        modulesFound: 0,
        progress: 0
      });
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev.progress >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return {
            ...prev,
            progress: prev.progress + Math.random() * 15,
            filesScanned: prev.filesScanned + Math.floor(Math.random() * 3) + 1,
            currentPath: `/SMART-_business_module/${Math.random() > 0.5 ? 'SMART-_ai' : 'SMART-_ledger'}/${Math.random() > 0.5 ? 'main.py' : 'config.json'}`
          };
        });
      }, 500);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/infrastructure/modules"] });
      setIsScanning(false);
      setScanProgress(prev => ({ 
        ...prev, 
        scanning: false, 
        progress: 100,
        modulesFound: data.newModulesFound || data.saved || 0
      }));
      
      if (data.saved > 0) {
        toast({
          title: "New Modules Found",
          description: `Found ${data.saved} new modules. Existing modules unchanged.`,
        });
      } else {
        toast({
          title: "Scan Complete",
          description: "No new modules found. All existing modules preserved.",
        });
      }
    },
    onError: () => {
      setIsScanning(false);
      setScanProgress(prev => ({ ...prev, scanning: false }));
      toast({
        title: "Scan Failed",
        description: "Failed to scan for new modules",
        variant: "destructive",
      });
    },
  });

  // Validate module mutation
  const validateModule = useMutation({
    mutationFn: (moduleId: string) => 
      fetch(`/api/infrastructure/modules/${moduleId}/validate`, { method: "POST" }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/infrastructure/modules"] });
      toast({
        title: "Module Validated",
        description: "Module validation completed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Validation Failed",
        description: "Failed to validate module",
        variant: "destructive",
      });
    },
  });

  // Delete module mutation
  const deleteModule = useMutation({
    mutationFn: async (moduleId: string) => {
      // Get module info before deletion for logging
      const modules = await queryClient.getQueryData(["/api/infrastructure/modules"]) as ModuleInfo[];
      const moduleToDelete = modules?.find(m => m.id === moduleId);
      
      // Delete the module
      const response = await fetch(`/api/infrastructure/modules/${moduleId}`, { method: "DELETE" });
      const data = await response.json();
      
      // Log to SMART-Ledger
      if (moduleToDelete) {
        const ledgerResponse = await fetch("/api/ledger/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tab: "modules",
            action_type: "module", 
            action: "delete",
            target: moduleToDelete.name,
            details: `Deleted module ${moduleToDelete.name}`,
            smart_id: moduleToDelete.metadata?.smartId,
            user_id: user?.username || (() => { throw new Error('User authentication required for ledger'); })()
          })
        });
        
        // Check if ledger logging succeeded
        if (!ledgerResponse.ok) {
          throw new Error(`Failed to log deletion to ledger: ${ledgerResponse.status} ${ledgerResponse.statusText}`);
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/infrastructure/modules"] });
      toast({
        title: "Module Deleted",
        description: data.message || "Module deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete module",
        variant: "destructive",
      });
    },
  });



  const getModuleClassificationIcon = (classification: string) => {
    switch (classification) {
      case "Hub": return <Cpu className="h-4 w-4 text-blue-500" />;
      case "Node": return <Activity className="h-4 w-4 text-green-500" />;
      case "System Wide": return <Boxes className="h-4 w-4 text-purple-500" />;
      default: return <FileCode className="h-4 w-4 text-gray-500" />;
    }
  };

  const getModuleClassificationColor = (classification: string) => {
    switch (classification) {
      case "Hub": return "bg-blue-500";
      case "Node": return "bg-green-500";
      case "System Wide": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "validated": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "configured": return <Zap className="h-4 w-4 text-blue-600" />;
      case "loaded": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error": return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "validated": return "text-green-600 border-green-600";
      case "configured": return "text-blue-600 border-blue-600";
      case "loaded": return "text-green-600 border-green-600";
      case "error": return "text-red-600 border-red-600";
      default: return "text-yellow-600 border-yellow-600";
    }
  };

  const getModuleClassification = (module: ModuleInfo) => {
    // Return classification if available, otherwise return "Unclassified" for discovered modules
    return module.metadata?.moduleClassification || "Unclassified";
  };

  const getModuleCategory = (module: ModuleInfo) => {
    // Return category if available, otherwise return "Unclassified" for discovered modules
    return module.metadata?.categoryClassification || "Unclassified";
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Business Operations": return "💼";
      case "Security & Identity": return "🔐";
      case "Compliance & Audit": return "📋";
      case "Data & Intelligence": return "🧠";
      case "Infrastructure": return "🏗️";
      case "General": return "⚙️";
      case "Unclassified": return "❓";
      default: return "❓";
    }
  };

  const getFormattedModuleName = (module: ModuleInfo) => {
    // Use the displayName from the backend if available, otherwise format the name
    if (module.displayName) {
      return module.displayName;
    }
    
    // Fallback formatting for older modules without displayName
    const formatWord = (word: string) => {
      // Special cases
      if (word.toLowerCase() === 'ai') return 'AI';
      if (word.toLowerCase() === 'id') return 'ID';
      if (word.toLowerCase() === 'api') return 'API';
      
      // Regular capitalization
      return word.charAt(0).toUpperCase() + word.slice(1);
    };
    
    const formattedName = module.name
      .replace('smart_', 'SMART-')
      .replace(/_/g, '-')
      .split('-')
      .map(formatWord)
      .join('-');
    
    return formattedName;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Business Operations": return "bg-blue-500";
      case "Security & Identity": return "bg-green-500";
      case "Compliance & Audit": return "bg-orange-500";
      case "Data & Intelligence": return "bg-purple-500";
      case "Infrastructure": return "bg-gray-500";
      case "General": return "bg-slate-500";
      case "Unclassified": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const formatModuleClassification = (moduleClassification: string) => {
    if (!moduleClassification) {
      throw new Error('Module classification is required but not provided');
    }
    return moduleClassification;
  };

  const formatStatus = (status: string) => {
    if (!status) {
      throw new Error('Module status is required but not provided');
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getShortDescription = (description: string) => {
    if (!description) return "No description available";
    
    // Get first sentence (up to first period followed by space or end of string)
    const firstSentence = description.match(/^[^.]+\./);
    return firstSentence ? firstSentence[0] : description;
  };

  const openModuleReadme = async (module: ModuleInfo) => {
    setSelectedReadmeModule(module);
    setShowReadmeModal(true);
    setReadmeLoading(true);
    
    try {
      // Construct the README path - try different possible locations
      const possiblePaths = [
        `${module.modulePath}/README.md`,
        `${module.modulePath}/readme.md`,
        `${module.modulePath}/Readme.md`
      ];
      
      let readmeText = "";
      let found = false;
      let lastError = null;
      
      // Try to fetch README from different possible paths
      for (const filePath of possiblePaths) {
        try {
          console.log(`Attempting to fetch README from: ${filePath}`);
          const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
          
          if (response.ok) {
            readmeText = await response.text();
            found = true;
            console.log(`Successfully loaded README from: ${filePath}`);
            break;
          } else {
            lastError = `HTTP ${response.status}: ${response.statusText}`;
            console.log(`Failed to fetch from ${filePath}: ${lastError}`);
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
          console.log(`Error fetching from ${filePath}:`, lastError);
          continue;
        }
      }
      
      if (!found) {
        readmeText = `# ${getFormattedModuleName(module)}\n\nNo README.md file found for this module.\n\n**Module Path:** ${module.modulePath}\n\n**Attempted Paths:**\n${possiblePaths.map(p => `- ${p}`).join('\n')}\n\n**Last Error:** ${lastError || 'File not found'}\n\n**Description:** ${module.description || 'No description available'}`;
      }
      
      setReadmeContent(readmeText);
    } catch (error) {
      console.error("Error loading README:", error);
      setReadmeContent(`# Error Loading README\n\nFailed to load README for ${getFormattedModuleName(module)}.\n\n**Error:** ${error instanceof Error ? error.message : String(error)}\n\n**Module Path:** ${module.modulePath}`);
    } finally {
      setReadmeLoading(false);
    }
  };

  const closeReadmeModal = () => {
    setShowReadmeModal(false);
    setSelectedReadmeModule(null);
    setReadmeContent("");
    setReadmeLoading(false);
  };

  // Available categories for classification
  const availableCategories = [
    "Business Operations",
    "Security & Identity", 
    "Compliance & Audit",
    "Data & Intelligence",
    "Infrastructure",
    "General"
  ];

  // Module classifications  
  const moduleClassifications = [
    "Hub",
    "Node",
    "System Wide"
  ];



  // Configure modal functions (combines validation and editing)
  const openConfigureModal = (module: ModuleInfo) => {
    setConfiguringModule(module);
    setConfigureForm({
      displayName: module.displayName || module.name,
      description: module.description || "",
      moduleClassification: module.metadata?.moduleClassification || "",
      categoryClassification: module.metadata?.categoryClassification || ""
    });
    setShowConfigureModal(true);
  };

  const closeConfigureModal = () => {
    setConfiguringModule(null);
    setConfigureForm({
      displayName: "",
      description: "",
      moduleClassification: "",
      categoryClassification: ""
    });
    setShowConfigureModal(false);
  };

  const handleConfigureModule = async () => {
    if (!configuringModule) return;
    
    // Check if this is initial validation or an update
    const isValidating = !configuringModule.metadata?.moduleClassification;
    
    // Always require both classifications for validation or updates
    if (!configureForm.moduleClassification || !configureForm.categoryClassification) {
      toast({
        variant: "destructive",
        title: "Missing Classifications",
        description: "Please select both module classification and category classification."
      });
      return;
    }
    
    try {
      // Always call the validation endpoint (it handles both new validation and updates)
      const response = await fetch(`/api/infrastructure/modules/${configuringModule.id}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleClassification: configureForm.moduleClassification,
          categoryClassification: configureForm.categoryClassification
        })
      });
      
      if (!response.ok) {
        throw new Error('Validation/Update failed');
      }
      
      // Log to SMART-Ledger
      const ledgerResponse = await fetch("/api/ledger/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "modules",
          action_type: "module",
          action: isValidating ? "validate" : "update",
          target: configuringModule.name,
          details: `${isValidating ? 'Validated' : 'Updated'} module ${configuringModule.name} as ${configureForm.moduleClassification}`,
          smart_id: configuringModule.metadata?.smartId,
          user_id: user?.username || (() => { throw new Error('User authentication required for ledger'); })()
        })
      });
      
      if (!ledgerResponse.ok) {
        throw new Error(`Failed to log ${isValidating ? 'validation' : 'update'} to ledger: ${ledgerResponse.status} ${ledgerResponse.statusText}`);
      }
      
      toast({
        title: isValidating ? "Module Configured" : "Module Updated",
        description: `${getFormattedModuleName(configuringModule)} has been ${isValidating ? 'validated and configured' : 'updated'} successfully`,
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/infrastructure/modules"] });
      await refetch(); // Force immediate refresh
      closeConfigureModal();
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Configuration Failed", 
        description: "Failed to configure module. Please try again."
      });
    }
  };



  // Delete confirmation handlers
  const confirmDeleteModule = (module: ModuleInfo) => {
    setDeleteConfirmModule(module);
  };

  const handleDeleteModule = () => {
    if (!deleteConfirmModule) return;
    
    deleteModule.mutate(deleteConfirmModule.id);
    setDeleteConfirmModule(null);
  };

  const cancelDeleteModule = () => {
    setDeleteConfirmModule(null);
  };

  // Filter modules based on search and filters
  const filteredModules = modules?.filter((module) => {
    const matchesSearch = 
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.moduleId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClassification = filterClassification === "all" || getModuleClassification(module) === filterClassification;
    const matchesCategory = filterCategory === "all" || getModuleCategory(module) === filterCategory;
    
    return matchesSearch && matchesClassification && matchesCategory;
  });

  // Get unique module types for filter
  const moduleTypes = Array.from(new Set(modules?.map(m => m.metadata?.moduleClassification).filter(Boolean) || []));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMART-Modules Manager</h1>
          <p className="text-muted-foreground">
            Discover, classify, and manage SMART-Business modules
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => scanModules.mutate()} 
            disabled={isScanning}
            size="sm"
            title="Scan for NEW modules only (preserves existing module status)"
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <FolderOpen className="h-4 w-4 mr-2" />
                Scan New Modules
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Scan Progress */}
      {scanProgress.scanning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Scanning for New Modules</span>
            </CardTitle>
            <CardDescription>
              Looking for new modules only. Existing modules will be preserved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={scanProgress.progress} className="w-full" />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Path:</span>
                  <div className="font-mono text-xs truncate">{scanProgress.currentPath}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Files Scanned:</span>
                  <div className="font-semibold">{scanProgress.filesScanned}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">New Modules Found:</span>
                  <div className="font-semibold">{scanProgress.modulesFound}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Module Management Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Boxes className="h-5 w-5 text-purple-500" />
            <span>SMART-Module Management System</span>
          </CardTitle>
          <CardDescription>
            Discover, organize, and deploy SMART-Modules across your infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Search className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold">Auto-Discovery</h3>
              <p className="text-sm text-muted-foreground">
                Automatically scan and discover SMART modules from framework directories
              </p>
            </div>
            <div className="text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold">Module Classification</h3>
              <p className="text-sm text-muted-foreground">
                Organize modules by type: Hub modules, Node modules, and System-wide components
              </p>
            </div>
            <div className="text-center">
              <Palette className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold">Category Classification</h3>
              <p className="text-sm text-muted-foreground">
                Organize and categorize modules by functionality and operational purpose
              </p>
            </div>
            <div className="text-center">
              <Settings className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <h3 className="font-semibold">Domain Ecosystem Ready</h3>
              <p className="text-sm text-muted-foreground">
                Package modules into domain ecosystems for deployment to target infrastructure
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <Boxes className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Node Modules</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modules?.filter(m => getModuleClassification(m) === 'Node').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hub Modules</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modules?.filter(m => getModuleClassification(m) === 'Hub').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Wide Modules</CardTitle>
            <Settings className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modules?.filter(m => getModuleClassification(m) === 'System Wide').length || 0}
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
              <Label htmlFor="search">Search Modules</Label>
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
              <Label htmlFor="filter-classification">Module Classification</Label>
              <select
                id="filter-classification"
                value={filterClassification}
                onChange={(e) => setFilterClassification(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Classifications</option>
                <option value="Hub">Hub</option>
                <option value="Node">Node</option>
                <option value="System Wide">System Wide</option>
                <option value="Unclassified">Unclassified</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-category">Category Classification</Label>
              <select
                id="filter-category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="Business Operations">Business Operations</option>
                <option value="Security & Identity">Security & Identity</option>
                <option value="Compliance & Audit">Compliance & Audit</option>
                <option value="Data & Intelligence">Data & Intelligence</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="General">General</option>
                <option value="Unclassified">Unclassified</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Boxes className="h-5 w-5 text-purple-500" />
            <span>Discovered Modules</span>
          </CardTitle>
          <CardDescription>
            All discovered SMART-Business modules in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredModules && filteredModules.length > 0 ? (
            <div className="space-y-6">
              {/* Group modules by classification */}
              {(() => {
                const hubModules = filteredModules.filter(module => getModuleClassification(module) === 'Hub');
                const nodeModules = filteredModules.filter(module => getModuleClassification(module) === 'Node');
                const systemWideModules = filteredModules.filter(module => getModuleClassification(module) === 'System Wide');
                const unclassifiedModules = filteredModules.filter(module => !['Hub', 'Node', 'System Wide'].includes(getModuleClassification(module)));
                
                return (
                  <>
                    {/* Hub Modules */}
                    {hubModules.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">🏢</span>
                            <h3 className="text-lg font-semibold text-blue-600">Hub Modules</h3>
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              {hubModules.length} modules
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          Hub modules coordinate and manage operations across the SMART-Business ecosystem
                        </div>
                        <Table className="table-fixed w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[20%]">Module</TableHead>
                              <TableHead className="w-[18%]">SMART-ID</TableHead>
                              <TableHead className="w-[16%]">Category Classification</TableHead>
                              <TableHead className="w-[24%]">Path</TableHead>
                              <TableHead className="w-[12%]">Status</TableHead>
                              <TableHead className="w-[10%]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {hubModules.map((module) => (
                              <ModuleTableRow
                                key={module.id}
                                module={module}
                                onConfigure={openConfigureModal}
                                onDelete={confirmDeleteModule}
                                onOpenReadme={openModuleReadme}
                                getFormattedModuleName={getFormattedModuleName}
                                getShortDescription={getShortDescription}
                                getCategoryIcon={getCategoryIcon}
                                getCategoryColor={getCategoryColor}
                                getModuleCategory={getModuleCategory}
                                getStatusIcon={getStatusIcon}
                                getStatusColor={getStatusColor}
                                formatStatus={formatStatus}
                                deleteModule={deleteModule}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Node Modules */}
                    {nodeModules.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">🛡️</span>
                            <h3 className="text-lg font-semibold text-green-600">Node Modules</h3>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              {nodeModules.length} modules
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          Node modules execute and enforce operations autonomously in the field
                        </div>
                        <Table className="table-fixed w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[20%]">Module</TableHead>
                              <TableHead className="w-[18%]">SMART-ID</TableHead>
                              <TableHead className="w-[16%]">Category Classification</TableHead>
                              <TableHead className="w-[24%]">Path</TableHead>
                              <TableHead className="w-[12%]">Status</TableHead>
                              <TableHead className="w-[10%]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {nodeModules.map((module) => (
                              <ModuleTableRow
                                key={module.id}
                                module={module}
                                onConfigure={openConfigureModal}
                                onDelete={confirmDeleteModule}
                                onOpenReadme={openModuleReadme}
                                getFormattedModuleName={getFormattedModuleName}
                                getShortDescription={getShortDescription}
                                getCategoryIcon={getCategoryIcon}
                                getCategoryColor={getCategoryColor}
                                getModuleCategory={getModuleCategory}
                                getStatusIcon={getStatusIcon}
                                getStatusColor={getStatusColor}
                                formatStatus={formatStatus}
                                deleteModule={deleteModule}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* System Wide Modules */}
                    {systemWideModules.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">⚙️</span>
                            <h3 className="text-lg font-semibold text-purple-600">System Wide Modules</h3>
                            <Badge variant="outline" className="text-purple-600 border-purple-600">
                              {systemWideModules.length} modules
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          System-wide modules provide core infrastructure and cross-cutting functionality
                        </div>
                        <Table className="table-fixed w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[20%]">Module</TableHead>
                              <TableHead className="w-[18%]">SMART-ID</TableHead>
                              <TableHead className="w-[16%]">Category Classification</TableHead>
                              <TableHead className="w-[24%]">Path</TableHead>
                              <TableHead className="w-[12%]">Status</TableHead>
                              <TableHead className="w-[10%]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {systemWideModules.map((module) => (
                              <ModuleTableRow
                                key={module.id}
                                module={module}
                                onConfigure={openConfigureModal}
                                onDelete={confirmDeleteModule}
                                onOpenReadme={openModuleReadme}
                                getFormattedModuleName={getFormattedModuleName}
                                getShortDescription={getShortDescription}
                                getCategoryIcon={getCategoryIcon}
                                getCategoryColor={getCategoryColor}
                                getModuleCategory={getModuleCategory}
                                getStatusIcon={getStatusIcon}
                                getStatusColor={getStatusColor}
                                formatStatus={formatStatus}
                                deleteModule={deleteModule}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Unclassified Modules */}
                    {unclassifiedModules.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">❓</span>
                            <h3 className="text-lg font-semibold text-gray-600">Unclassified Modules</h3>
                            <Badge variant="outline" className="text-gray-600 border-gray-400">
                              {unclassifiedModules.length} modules
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          Modules that need classification to be deployed in the SMART-Business ecosystem
                        </div>
                        <Table className="table-fixed w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[20%]">Module</TableHead>
                              <TableHead className="w-[18%]">SMART-ID</TableHead>
                              <TableHead className="w-[16%]">Category Classification</TableHead>
                              <TableHead className="w-[24%]">Path</TableHead>
                              <TableHead className="w-[12%]">Status</TableHead>
                              <TableHead className="w-[10%]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {unclassifiedModules.map((module) => (
                              <ModuleTableRow
                                key={module.id}
                                module={module}
                                onConfigure={openConfigureModal}
                                onDelete={confirmDeleteModule}
                                onOpenReadme={openModuleReadme}
                                getFormattedModuleName={getFormattedModuleName}
                                getShortDescription={getShortDescription}
                                getCategoryIcon={getCategoryIcon}
                                getCategoryColor={getCategoryColor}
                                getModuleCategory={getModuleCategory}
                                getStatusIcon={getStatusIcon}
                                getStatusColor={getStatusColor}
                                formatStatus={formatStatus}
                                deleteModule={deleteModule}
                              />
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
              <Boxes className="h-12 w-12 mx-auto text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Modules Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterClassification !== "all" || filterCategory !== "all"
                  ? "No modules match your current filters"
                  : "Scan for new modules to get started"}
              </p>
              <Button onClick={() => scanModules.mutate()} disabled={isScanning}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Scan New Modules
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configure Module Modal (Combined Validation & Editing) */}
      <Dialog open={showConfigureModal} onOpenChange={closeConfigureModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-blue-500" />
              <span>Configure Module: {configuringModule ? getFormattedModuleName(configuringModule) : ''}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {configuringModule && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-muted-foreground">Module:</span>
                    <span className="font-medium">{getFormattedModuleName(configuringModule)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-muted-foreground">Path:</span>
                    <span className="text-sm font-mono text-muted-foreground">{configuringModule.modulePath}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Badge variant="outline" className={getStatusColor(configuringModule.status)}>
                      {formatStatus(configuringModule.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Module Information Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Module Information</h4>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={configureForm.displayName}
                  onChange={(e) => setConfigureForm(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Module display name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={configureForm.description}
                  onChange={(e) => setConfigureForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Module description"
                  className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                  rows={3}
                />
              </div>
            </div>

            {/* Classification Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Module Classifications</h4>
              
              <div className="space-y-2">
                <Label htmlFor="moduleClassification">
                  Module Classification {!configuringModule?.metadata?.moduleClassification && <span className="text-red-500">*</span>}
                </Label>
                <Select 
                  value={configureForm.moduleClassification} 
                  onValueChange={(value) => setConfigureForm(prev => ({ ...prev, moduleClassification: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select module classification" />
                  </SelectTrigger>
                  <SelectContent>
                    {moduleClassifications.map(classification => (
                      <SelectItem key={classification} value={classification}>
                        <div className="flex items-center space-x-2">
                          <span>{classification === 'Hub' ? '🏢' : '🛡️'}</span>
                          <span>{classification}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Hub modules coordinate and manage operations. Node modules execute and enforce operations.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryClassification">
                  Category Classification {!configuringModule?.metadata?.categoryClassification && <span className="text-red-500">*</span>}
                </Label>
                <Select 
                  value={configureForm.categoryClassification} 
                  onValueChange={(value) => setConfigureForm(prev => ({ ...prev, categoryClassification: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category classification" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center space-x-2">
                          <span>{getCategoryIcon(category)}</span>
                          <span>{category}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Organize the module by its primary functional purpose.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeConfigureModal}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleConfigureModule}
              disabled={!configuringModule?.metadata?.moduleClassification && (!configureForm.moduleClassification || !configureForm.categoryClassification)}
            >
              <Save className="h-4 w-4 mr-2" />
              {!configuringModule?.metadata?.moduleClassification ? 'Validate & Save' : 'Update Module'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* README Modal */}
      {showReadmeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-w-4xl max-h-[80vh] w-full mx-4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                {selectedReadmeModule ? getFormattedModuleName(selectedReadmeModule) : 'Module'} README
              </h3>
              <button
                onClick={closeReadmeModal}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-gray-900">
              {readmeLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-300">Loading README...</span>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="bg-gray-800 border border-gray-600 p-6 rounded-lg overflow-auto text-gray-200">
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {readmeContent}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-4 border-t border-gray-700 bg-gray-800">
              <button
                onClick={closeReadmeModal}
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmModule} onOpenChange={cancelDeleteModule}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <span>Confirm Delete Module</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete the module <strong>{deleteConfirmModule?.name}</strong>? 
            </p>
            <p className="text-sm text-muted-foreground">
              This action will:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Remove the module from the database</li>
              <li>• Delete the associated SMART-ID (if exists)</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelDeleteModule}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteModule}
              disabled={deleteModule.isPending}
            >
              {deleteModule.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Module
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Separate component for table rows to avoid repetition
function ModuleTableRow({ 
  module, 
  onConfigure, 
  onDelete, 
  onOpenReadme,
  getFormattedModuleName,
  getShortDescription,
  getCategoryIcon,
  getCategoryColor,
  getModuleCategory,
  getStatusIcon,
  getStatusColor,
  formatStatus,
  deleteModule
}: {
  module: ModuleInfo;
  onConfigure: (module: ModuleInfo) => void;
  onDelete: (module: ModuleInfo) => void;
  onOpenReadme: (module: ModuleInfo) => void;
  getFormattedModuleName: (module: ModuleInfo) => string;
  getShortDescription: (description: string) => string;
  getCategoryIcon: (category: string) => string;
  getCategoryColor: (category: string) => string;
  getModuleCategory: (module: ModuleInfo) => string;
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  formatStatus: (status: string) => string;
  deleteModule: any;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <div 
            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
            onClick={() => onOpenReadme(module)}
            title="Click to view README"
          >
            {getFormattedModuleName(module)}
          </div>
          {module.description && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {getShortDescription(module.description)}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {module.metadata?.smartId ? (
          <Badge variant="outline" className="font-mono text-xs bg-purple-50 text-purple-700 border-purple-200">
            {module.metadata.smartId}
          </Badge>
        ) : (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs">No SMART-ID assigned</span>
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getCategoryIcon(getModuleCategory(module))}</span>
          <Badge className={`${getCategoryColor(getModuleCategory(module))} text-white`}>
            {getModuleCategory(module)}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-mono text-xs text-muted-foreground">
          {module.modulePath}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          {getStatusIcon(module.status)}
          <Badge variant="outline" className={getStatusColor(module.status)}>
            {formatStatus(module.status)}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onConfigure(module)}
            title="Configure module settings and classifications"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDelete(module)}
            disabled={deleteModule.isPending}
            title="Delete module"
            className="hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
