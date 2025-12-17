import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  HardDrive, 
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
  Wrench,
  Settings,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Save,
  Loader2,
  Cog,
  ListPlus,
  X,
  Wifi
} from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  type: string;
  category: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  status?: 'operational' | 'maintenance' | 'offline' | 'error';
  lastMaintenance: string;
  nextMaintenance: string;
  specifications?: {
    power?: string;
    connectivity?: string[];
    dimensions?: string;
    weight?: string;
  };
  metrics: {
    uptime: number;
    temperature?: number;
    powerConsumption?: number;
    utilization?: number;
  };
  assignedNode?: string;
  // Network monitoring for network equipment
  network_info?: {
    ip_address?: string;
    mac_address?: string;
    subnet?: string;
    monitor_enabled?: boolean;
  };
  network_status?: {
    online: boolean;
    response_time?: number;
    last_ping?: string;
    packet_loss?: number;
  };
  smartId?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateEquipmentData {
  name: string;
  type: string;
  category: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  specifications: {
    power?: string;
    connectivity?: string[];
    dimensions?: string;
    weight?: string;
  };
  network_info?: {
    ip_address?: string;
    mac_address?: string;
    subnet?: string;
    monitor_enabled?: boolean;
  };
}

interface EquipmentSettings {
  categories: {
    [key: string]: {
      name: string;
      description: string;
      types: string[];
    }
  };
  connectivityOptions: string[];
  statusOptions: string[];
}

const defaultNDTSettings: EquipmentSettings = {
  categories: {
    testing: {
      name: "Testing Equipment",
      description: "Non-destructive testing equipment and instruments",
      types: ["ultrasonic", "radiographic", "magnetic_particle", "dye_penetrant", "eddy_current", "visual"]
    },
    welding: {
      name: "Welding Equipment", 
      description: "Welding machines, torches, and related equipment",
      types: ["arc_welder", "mig_welder", "tig_welder", "plasma_cutter", "torch", "electrodes"]
    },
    chemical: {
      name: "Chemical Processing",
      description: "Chemical processing tanks, mixers, and equipment",
      types: ["mixing_tank", "storage_tank", "reactor", "pump", "valve", "filter"]
    },
    inspection: {
      name: "Inspection Tools",
      description: "Visual and measurement inspection equipment",
      types: ["borescope", "caliper", "gauge", "microscope", "camera", "probe"]
    },
    coating: {
      name: "Coating Equipment",
      description: "Surface coating and treatment equipment", 
      types: ["spray_gun", "oven", "booth", "blaster", "cleaner", "applicator"]
    },
    networking: {
      name: "Network Infrastructure",
      description: "Networking and communication equipment",
      types: ["router", "switch", "gateway", "antenna", "cable", "modem", "poe_switch", "ethernet_switch", "starlink", "4g_modem", "5g_modem"]
    },
    measurement: {
      name: "Measurement Tools",
      description: "Precision measurement and calibration equipment",
      types: ["multimeter", "oscilloscope", "pressure_gauge", "flow_meter", "scale", "sensor"]
    },
    safety: {
      name: "Safety Equipment",
      description: "Safety and protective equipment",
      types: ["gas_detector", "alarm", "barrier", "ventilation", "emergency_stop", "ppe"]
    }
  },
  connectivityOptions: [
    "ethernet", "wifi", "bluetooth", "usb", "serial", "rs485"
  ],
  statusOptions: ["operational", "maintenance", "offline", "error"]
};

export default function ConfigurableEquipmentManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedConnectivity, setSelectedConnectivity] = useState<string[]>([]);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [equipmentSettings, setEquipmentSettings] = useState<EquipmentSettings>(defaultNDTSettings);
  const [deleteConfirmEquipment, setDeleteConfirmEquipment] = useState<Equipment | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Load equipment settings from server/storage
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/equipment/settings"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/equipment/settings");
        if (!response.ok) {
          throw new Error("Failed to load settings");
        }
        const data = await response.json();
        const loadedSettings = data.settings || defaultNDTSettings;
        
        // Clean up any legacy industrial protocols from cached settings
        const cleanConnectivityOptions = loadedSettings.connectivityOptions?.filter((option: string) => 
          !["modbus", "profibus", "devicenet", "canbus"].includes(option.toLowerCase())
        ) || defaultNDTSettings.connectivityOptions;
        
        return {
          ...loadedSettings,
          connectivityOptions: cleanConnectivityOptions
        };
      } catch (error) {
        console.log("Using default NDT settings");
        return defaultNDTSettings;
      }
    }
  });

  // Update local settings when server data loads
  useEffect(() => {
    if (settings) {
      setEquipmentSettings(settings);
    }
  }, [settings]);

  // Force clear any cached settings with legacy protocols on component mount
  useEffect(() => {
    const clearLegacySettings = () => {
      queryClient.removeQueries({ queryKey: ["/api/equipment/settings"] });
    };
    clearLegacySettings();
  }, [queryClient]);

  // Initialize empty equipment data for production
  useEffect(() => {
    // Start with empty equipment data - no mock data for production
    setEquipmentData([]);
    // Force refresh equipment from API
    queryClient.invalidateQueries({ queryKey: ["/api/equipment", "v2"] });
  }, [queryClient]);

  // Reset form state when create dialog opens
  useEffect(() => {
    if (isCreateDialogOpen) {
      setSelectedConnectivity([]);
    }
  }, [isCreateDialogOpen]);

  // Save equipment settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: EquipmentSettings) => {
      const response = await fetch("/api/equipment/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: newSettings })
      });
      if (!response.ok) {
        throw new Error("Failed to save settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/settings"] });
      toast({
        title: "Settings Saved",
        description: "Equipment categories and settings have been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save equipment settings",
        variant: "destructive",
      });
    }
  });

  // Use equipmentData for the query - production ready
  const { data: equipment = equipmentData, isLoading: equipmentLoading, refetch: refetchEquipment } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment", "v2"],
    queryFn: async () => {
      try {
        console.log("Fetching equipment from API...");
        const response = await fetch("/api/equipment");
        if (!response.ok) {
          throw new Error("Failed to fetch equipment");
        }
        const data = await response.json();
        console.log("Equipment data received:", data);
        return data;
      } catch (error) {
        console.log("Using local equipment data, error:", error);
        return equipmentData;
      }
    },
    initialData: equipmentData,
    refetchInterval: 30000, // Refresh every 30 seconds for network status updates
    refetchIntervalInBackground: true,
  });

  const createEquipment = useMutation({
    mutationFn: async (data: CreateEquipmentData) => {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create equipment");
      }
      
      const result = await response.json();
      
      // Record to ledger - MUST succeed
      if (!user?.username) {
        throw new Error('User authentication required for ledger recording');
      }
      
      const ledgerResponse = await fetch("/api/ledger/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "equipment",
          action_type: "equipment",
          action: "register",
          target: data.name,
          details: `Registered ${data.category} equipment: ${data.name}`,
          smart_id: result.id || '',
          user_id: user.username
        })
      });
      
      if (!ledgerResponse.ok) {
        throw new Error('Ledger recording failed - operation incomplete');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", "v2"] });
      setIsCreateDialogOpen(false);
      setSelectedConnectivity([]);
      toast({
        title: "Success",
        description: "Equipment registered successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to register equipment",
        variant: "destructive",
      });
    },
  });

  const editEquipment = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateEquipmentData }) => {
      const response = await fetch(`/api/equipment/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update equipment");
      }

      const result = await response.json();
      
      // Record to ledger - MUST succeed
      if (!user?.username) {
        throw new Error('User authentication required for ledger recording');
      }
      
      const ledgerResponse = await fetch("/api/ledger/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "equipment",
          action_type: "equipment",
          action: "update",
          target: data.name,
          details: `Updated ${data.category} equipment: ${data.name}`,
          smart_id: id,
          user_id: user.username
        })
      });
      
      if (!ledgerResponse.ok) {
        throw new Error('Ledger recording failed - operation incomplete');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", "v2"] });
      setIsEditDialogOpen(false);
      setEditingEquipment(null);
      setSelectedConnectivity([]);
      toast({
        title: "Success",
        description: "Equipment updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update equipment",
        variant: "destructive",
      });
    },
  });

  const deleteEquipment = useMutation({
    mutationFn: async ({ id, equipment }: { id: string; equipment: Equipment }) => {
      const response = await fetch(`/api/equipment/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete equipment");
      }

      const result = await response.json();
      
      // Record to ledger - MUST succeed
      if (!user?.username) {
        throw new Error('User authentication required for ledger recording');
      }
      
      const ledgerResponse = await fetch("/api/ledger/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "equipment",
          action_type: "equipment",
          action: "delete",
          target: equipment.name,
          details: `Deleted ${equipment.category} equipment: ${equipment.name}`,
          smart_id: id,
          user_id: user.username
        })
      });
      
      if (!ledgerResponse.ok) {
        throw new Error('Ledger recording failed - data integrity compromised');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Success",
        description: "Equipment deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete equipment",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string | undefined, equipment?: Equipment) => {
    // For network equipment, show network status if monitoring is enabled
    if (equipment?.category === 'networking' && equipment?.network_info?.monitor_enabled) {
      if (equipment?.network_status?.online === true) {
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      } else if (equipment?.network_status?.online === false) {
        return <XCircle className="h-4 w-4 text-red-600" />;
      }
      // If monitoring enabled but no status yet, show pending
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
    
    // Default status icons for non-network equipment
    if (!status) return <Clock className="h-4 w-4 text-gray-600" />;
    switch (status.toLowerCase()) {
      case "operational": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "maintenance": return <Wrench className="h-4 w-4 text-yellow-600" />;
      case "offline": return <XCircle className="h-4 w-4 text-red-600" />;
      case "error": return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string | undefined, equipment?: Equipment) => {
    // For network equipment, show network status if monitoring is enabled
    if (equipment?.category === 'networking' && equipment?.network_info?.monitor_enabled) {
      if (equipment?.network_status?.online === true) {
        return "text-green-600 border-green-600";
      } else if (equipment?.network_status?.online === false) {
        return "text-red-600 border-red-600";
      }
      // If monitoring enabled but no status yet, show pending
      return "text-yellow-600 border-yellow-600";
    }
    
    // Default status colors for non-network equipment
    if (!status) return "text-gray-600 border-gray-600";
    switch (status.toLowerCase()) {
      case "operational": return "text-green-600 border-green-600";
      case "maintenance": return "text-yellow-600 border-yellow-600";
      case "offline": return "text-red-600 border-red-600";
      case "error": return "text-red-600 border-red-600";
      default: return "text-gray-600 border-gray-600";
    }
  };

  // Filter equipment
  console.log("Equipment count:", equipment.length, "Equipment data:", equipment);
  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || (item.status && item.status === filterStatus);
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleCreateEquipment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const category = formData.get('category') as string;
    const isNetworkEquipment = category === 'networking';
    
    const equipmentData: CreateEquipmentData = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      category: category,
      manufacturer: formData.get('manufacturer') as string,
      model: formData.get('model') as string,
      serialNumber: formData.get('serialNumber') as string,
      location: formData.get('location') as string,
      specifications: {
        power: formData.get('power') as string || undefined,
        connectivity: selectedConnectivity,
        dimensions: formData.get('dimensions') as string || undefined,
        weight: formData.get('weight') as string || undefined,
      }
    };

    // Add network info for network equipment
    if (isNetworkEquipment) {
      const ipAddress = formData.get('ip_address') as string;
      const monitorEnabled = formData.get('monitor_enabled') === 'on';
      
      equipmentData.network_info = {
        ip_address: ipAddress || undefined,
        mac_address: formData.get('mac_address') as string || undefined,
        subnet: formData.get('subnet') as string || undefined,
        monitor_enabled: monitorEnabled && ipAddress ? true : false,
      };
    }

    console.log("Creating equipment:", equipmentData);
    createEquipment.mutate(equipmentData);
  };

  const handleEditEquipment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEquipment) return;

    const formData = new FormData(e.currentTarget);
    const category = formData.get('category') as string;
    const isNetworkEquipment = category === 'networking';
    
    const equipmentData: CreateEquipmentData = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      category: category,
      manufacturer: formData.get('manufacturer') as string,
      model: formData.get('model') as string,
      serialNumber: formData.get('serialNumber') as string,
      location: formData.get('location') as string,
      specifications: {
        power: formData.get('power') as string || undefined,
        connectivity: selectedConnectivity,
        dimensions: formData.get('dimensions') as string || undefined,
        weight: formData.get('weight') as string || undefined,
      }
    };

    // Add network info for network equipment
    if (isNetworkEquipment) {
      const ipAddress = formData.get('ip_address') as string;
      const monitorEnabled = formData.get('monitor_enabled') === 'on';
      
      equipmentData.network_info = {
        ip_address: ipAddress || undefined,
        mac_address: formData.get('mac_address') as string || undefined,
        subnet: formData.get('subnet') as string || undefined,
        monitor_enabled: monitorEnabled && ipAddress ? true : false,
      };
    }

    editEquipment.mutate({ id: editingEquipment.id, data: equipmentData });
  };

  // Open edit dialog
  const openEditDialog = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setSelectedConnectivity(equipment.specifications?.connectivity || []);
    setIsEditDialogOpen(true);
  };

  // Delete confirmation handlers
  const confirmDeleteEquipment = (equipment: Equipment) => {
    setDeleteConfirmEquipment(equipment);
  };

  const handleDeleteEquipment = () => {
    if (!deleteConfirmEquipment) return;
    
    deleteEquipment.mutate({ 
      id: deleteConfirmEquipment.id, 
      equipment: deleteConfirmEquipment 
    });
    setDeleteConfirmEquipment(null);
  };

  const cancelDeleteEquipment = () => {
    setDeleteConfirmEquipment(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMART-Equipment Preparation</h1>
          <p className="text-muted-foreground">
            Prepare and register equipment for deployment to production nodes/hubs. Certification and maintenance tracking handled by SMART-MaintenanceNode once deployed.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsSettingsDialogOpen(true)} variant="outline" size="sm">
            <Cog className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Register Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register New Equipment</DialogTitle>
                <DialogDescription>
                  Register new equipment for production deployment with SMART-ID assignment
                </DialogDescription>
              </DialogHeader>
              <EquipmentForm 
                key={`create-${isCreateDialogOpen}`}
                settings={equipmentSettings}
                selectedConnectivity={selectedConnectivity}
                onConnectivityToggle={(connectivity, checked) => {
                  if (checked) {
                    setSelectedConnectivity(prev => [...prev, connectivity]);
                  } else {
                    setSelectedConnectivity(prev => prev.filter(c => c !== connectivity));
                  }
                }}
                onSubmit={handleCreateEquipment}
                isLoading={createEquipment.isPending}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Equipment Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Equipment</DialogTitle>
                <DialogDescription>
                  Update equipment information and specifications
                </DialogDescription>
              </DialogHeader>
              {editingEquipment && (
                <EquipmentForm 
                  settings={equipmentSettings}
                  selectedConnectivity={selectedConnectivity}
                  onConnectivityToggle={(connectivity, checked) => {
                    if (checked) {
                      setSelectedConnectivity(prev => [...prev, connectivity]);
                    } else {
                      setSelectedConnectivity(prev => prev.filter(c => c !== connectivity));
                    }
                  }}
                  onSubmit={handleEditEquipment}
                  isLoading={editEquipment.isPending}
                  initialData={editingEquipment}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Equipment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5 text-blue-500" />
            <span>SMART Equipment Preparation</span>
          </CardTitle>
          <CardDescription>
            Equipment preparation and registration for production node deployment. Equipment gets SMART-ID assignment and specifications before hub deployment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <HardDrive className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold">Equipment Registration</h3>
              <p className="text-sm text-muted-foreground">
                Prepare equipment for production deployment with SMART-ID
              </p>
            </div>
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold">Deployment Ready</h3>
              <p className="text-sm text-muted-foreground">
                Equipment status and readiness for hub deployment
              </p>
            </div>
            <div className="text-center">
              <Settings className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold">Custom Categories</h3>
              <p className="text-sm text-muted-foreground">
                Configurable equipment types and specifications
              </p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <h3 className="font-semibold">SMART-ID Assignment</h3>
              <p className="text-sm text-muted-foreground">
                Automatic ID generation for production ecosystem integration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipment.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operational</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {equipment.filter(e => e.status && e.status === 'operational').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Online</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {equipment.filter(e => 
                e.category === 'networking' && 
                e.network_info?.monitor_enabled && 
                e.network_status?.online
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Network equipment online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Settings className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(equipmentSettings.categories).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Equipment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Equipment</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, model, serial..."
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
                {equipmentSettings.statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-category">Category</Label>
              <select
                id="filter-category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {Object.entries(equipmentSettings.categories).map(([key, category]) => (
                  <option key={key} value={key}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5 text-blue-500" />
            <span>Equipment Preparation Database</span>
          </CardTitle>
          <CardDescription>
            Equipment preparation database for production deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {equipmentLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-smart" />
              ))}
            </div>
          ) : filteredEquipment.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>SMART-ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium">{item.name}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {equipmentSettings.categories[item.category]?.name} • {item.type ? item.type.replace('_', ' ') : 'No type specified'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="font-mono text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {item.smartId || "PENDING"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Manufacturer:</span> {item.manufacturer}</div>
                        <div><span className="font-medium">Model:</span> {item.model}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          SN: {item.serialNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        <span>{item.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.category === 'networking' && item.network_info?.monitor_enabled ? (
                        <div className="space-y-1 text-sm">
                          <div className="font-mono text-xs">{item.network_info?.ip_address}</div>
                          {item.network_status && (
                            <div className="flex items-center space-x-1">
                              <div className={`h-2 w-2 rounded-full ${
                                item.network_status.online ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <span className="text-xs">
                                {item.network_status.online ? 'Online' : 'Offline'}
                                {item.network_status.response_time && (
                                  <span className="text-muted-foreground ml-1">
                                    ({item.network_status.response_time}ms)
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : item.category === 'networking' ? (
                        <span className="text-xs text-muted-foreground">No monitoring</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status, item)}
                        <Badge variant="outline" className={getStatusColor(item.status, item)}>
                          {item.category === 'networking' && item.network_info?.monitor_enabled
                            ? (item.network_status?.online ? 'Online' : 'Offline')
                            : (() => {
                                if (!item.status) {
                                  throw new Error(`Equipment ${item.name} is missing required status field`);
                                }
                                return item.status;
                              })()
                          }
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(item)}
                          disabled={editEquipment.isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => confirmDeleteEquipment(item)}
                          disabled={deleteEquipment.isPending}
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
              <HardDrive className="h-12 w-12 mx-auto text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Equipment Registered</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== "all" || filterCategory !== "all"
                  ? "No equipment matches your current filters"
                  : "Register your first equipment for production deployment"}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Register Equipment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <SettingsDialog 
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        settings={equipmentSettings}
        onSave={(newSettings) => {
          setEquipmentSettings(newSettings);
          saveSettingsMutation.mutate(newSettings);
          setIsSettingsDialogOpen(false);
        }}
        isLoading={saveSettingsMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmEquipment} onOpenChange={cancelDeleteEquipment}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <span>Confirm Delete Equipment</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete the equipment <strong>{deleteConfirmEquipment?.name}</strong>? 
            </p>
            <p className="text-sm text-muted-foreground">
              This action will:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Remove the equipment from the database</li>
              <li>• Delete all associated maintenance records</li>
              <li>• Remove equipment specifications and data</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelDeleteEquipment}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEquipment}
              disabled={deleteEquipment.isPending}
            >
              {deleteEquipment.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Equipment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EquipmentForm({ 
  settings,
  selectedConnectivity,
  onConnectivityToggle,
  onSubmit, 
  isLoading,
  initialData
}: {
  settings: EquipmentSettings;
  selectedConnectivity: string[];
  onConnectivityToggle: (connectivity: string, checked: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  initialData?: Equipment;
}) {
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || "");

  // Update selectedCategory when initialData changes (for edit mode)
  useEffect(() => {
    setSelectedCategory(initialData?.category || "");
  }, [initialData]);

  const isNetworkEquipment = selectedCategory === 'networking';
  
  // Define which categories need connectivity options
  const categoriesWithConnectivity = ['welding', 'networking', 'measurement'];
  const showConnectivity = categoriesWithConnectivity.includes(selectedCategory);
  
  // Define which categories need power requirements
  const categoriesWithPower = ['welding', 'testing', 'measurement', 'networking', 'chemical'];
  const showPower = categoriesWithPower.includes(selectedCategory);
  
  // Define which categories need physical dimensions
  const categoriesWithDimensions = ['testing', 'welding', 'chemical', 'measurement', 'networking'];
  const showDimensions = categoriesWithDimensions.includes(selectedCategory);

  // Get category-specific placeholders
  const getCategoryPlaceholder = (category: string, field: string): string => {
    const placeholders: Record<string, Record<string, string>> = {
      testing: {
        name: "e.g., Ultrasonic Thickness Gauge",
        manufacturer: "e.g., Olympus, GE",
        model: "e.g., 45MG, PHASOR XS",
        serial: "e.g., UT001-OLY-45MG",
        location: "e.g., Testing Lab A, NDT Bay 1",
        power: "e.g., 12V DC, Battery powered"
      },
      welding: {
        name: "e.g., MIG Welder 250A",
        manufacturer: "e.g., Lincoln Electric, Miller",
        model: "e.g., Power MIG 210 MP",
        serial: "e.g., WLD-LIN-210MP",
        location: "e.g., Welding Bay 2, Shop Floor",
        power: "e.g., 230V 50A, 400V 32A"
      },
      networking: {
        name: "e.g., 24-Port PoE Switch",
        manufacturer: "e.g., Cisco, Ubiquiti, Starlink",
        model: "e.g., Catalyst 2960, UniFi Switch",
        serial: "e.g., NET-CIS-2960",
        location: "e.g., Network Rack A, Server Room",
        power: "e.g., 48V PoE, AC 100-240V"
      },
      chemical: {
        name: "e.g., Chemical Storage Tank",
        manufacturer: "e.g., Polyethylene Tanks Inc",
        model: "e.g., PT-500L",
        serial: "e.g., CHM-PT-500",
        location: "e.g., Chemical Storage Area B",
        power: "e.g., N/A, 12V monitoring"
      },
      measurement: {
        name: "e.g., Digital Multimeter",
        manufacturer: "e.g., Fluke, Keysight",
        model: "e.g., 87V, 34461A",
        serial: "e.g., MSR-FLK-87V",
        location: "e.g., Electronics Lab, Test Bench 3",
        power: "e.g., 9V Battery, USB powered"
      }
    };

    return placeholders[category]?.[field] || `Enter ${field}`;
  };

  return (
    <form id="createEquipmentForm" onSubmit={onSubmit} className="space-y-6">
      {/* Category Selection - Always Visible */}
      <div className="border rounded-lg p-4 bg-muted/20">
        <h3 className="text-lg font-semibold mb-4">Equipment Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              name="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select category first...</option>
              {Object.entries(settings.categories).map(([key, category]) => (
                <option key={key} value={key}>
                  {category.name}
                </option>
              ))}
            </select>
            {selectedCategory && (
              <p className="text-xs text-muted-foreground">
                {settings.categories[selectedCategory]?.description}
              </p>
            )}
          </div>
          
          {selectedCategory && (
            <div className="space-y-2">
              <Label htmlFor="type">Equipment Type *</Label>
              <select
                id="type"
                name="type"
                defaultValue={initialData?.type || ""}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select type</option>
                {settings.categories[selectedCategory]?.types.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Basic Information - Show only after category selection */}
      {selectedCategory && (
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Equipment Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={initialData?.name || ""}
                placeholder={getCategoryPlaceholder(selectedCategory, 'name')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer *</Label>
              <Input
                id="manufacturer"
                name="manufacturer"
                defaultValue={initialData?.manufacturer || ""}
                placeholder={getCategoryPlaceholder(selectedCategory, 'manufacturer')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                name="model"
                defaultValue={initialData?.model || ""}
                placeholder={getCategoryPlaceholder(selectedCategory, 'model')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                defaultValue={initialData?.serialNumber || ""}
                placeholder={getCategoryPlaceholder(selectedCategory, 'serial')}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                name="location"
                defaultValue={initialData?.location || ""}
                placeholder={getCategoryPlaceholder(selectedCategory, 'location')}
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Category-Specific Specifications */}
      {selectedCategory && (showPower || showDimensions) && (
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showPower && (
              <div className="space-y-2">
                <Label htmlFor="power">Power Requirements</Label>
                <Input
                  id="power"
                  name="power"
                  defaultValue={initialData?.specifications?.power || ""}
                  placeholder={getCategoryPlaceholder(selectedCategory, 'power')}
                />
              </div>
            )}

            {showDimensions && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dimensions">Dimensions</Label>
                  <Input
                    id="dimensions"
                    name="dimensions"
                    defaultValue={initialData?.specifications?.dimensions || ""}
                    placeholder="e.g., 150 x 80 x 30 mm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    name="weight"
                    defaultValue={initialData?.specifications?.weight || ""}
                    placeholder="e.g., 0.3 kg, 54 kg"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Connectivity Options - Show for relevant categories */}
      {selectedCategory && showConnectivity && (
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Connectivity Options</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select connectivity methods available on this {settings.categories[selectedCategory]?.name?.toLowerCase()}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {settings.connectivityOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={option}
                  checked={selectedConnectivity.includes(option)}
                  onChange={(e) => onConnectivityToggle(option, e.target.checked)}
                  className="rounded border-input"
                />
                <Label htmlFor={option} className="text-sm cursor-pointer">
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {selectedConnectivity.length} option{selectedConnectivity.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {/* Network Monitoring Section - Only show for network equipment */}
      {isNetworkEquipment && (
        <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span>Network Monitoring Configuration</span>
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure basic connectivity monitoring (ICMP ping) for this network equipment
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ip_address">IP Address</Label>
              <Input
                id="ip_address"
                name="ip_address"
                defaultValue={initialData?.network_info?.ip_address || ""}
                placeholder="e.g., 192.168.1.1"
                type="text"
              />
              <p className="text-xs text-muted-foreground">
                Required for ping monitoring
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mac_address">MAC Address (Optional)</Label>
              <Input
                id="mac_address"
                name="mac_address"
                defaultValue={initialData?.network_info?.mac_address || ""}
                placeholder="e.g., 00:1B:44:11:3A:B7"
                type="text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subnet">Subnet/Network</Label>
              <Input
                id="subnet"
                name="subnet"
                defaultValue={initialData?.network_info?.subnet || ""}
                placeholder="e.g., 192.168.1.0/24"
                type="text"
              />
            </div>

            <div className="space-y-3">
              <Label>Monitoring Options</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="monitor_enabled"
                  name="monitor_enabled"
                  defaultChecked={initialData?.network_info?.monitor_enabled || false}
                  className="rounded border-input"
                />
                <Label htmlFor="monitor_enabled" className="text-sm cursor-pointer">
                  Enable ping monitoring
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically ping this device every 30 seconds to monitor connectivity
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (initialData ? "Updating..." : "Registering...") : (initialData ? "Update Equipment" : "Register Equipment")}
        </Button>
      </div>
    </form>
  );
}

function SettingsDialog({
  isOpen,
  onClose,
  settings,
  onSave,
  isLoading
}: {
  isOpen: boolean;
  onClose: () => void;
  settings: EquipmentSettings;
  onSave: (settings: EquipmentSettings) => void;
  isLoading: boolean;
}) {
  const [localSettings, setLocalSettings] = useState<EquipmentSettings>(settings);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryKey, setNewCategoryKey] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const addCategory = () => {
    if (!newCategoryKey || !newCategoryName) return;
    
    setLocalSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [newCategoryKey]: {
          name: newCategoryName,
          description: newCategoryDescription,
          types: []
        }
      }
    }));
    
    setNewCategoryKey("");
    setNewCategoryName("");
    setNewCategoryDescription("");
  };

  const removeCategory = (categoryKey: string) => {
    setLocalSettings(prev => {
      const newCategories = { ...prev.categories };
      delete newCategories[categoryKey];
      return {
        ...prev,
        categories: newCategories
      };
    });
  };

  const addTypeToCategory = (categoryKey: string, type: string) => {
    if (!type) return;
    
    setLocalSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryKey]: {
          ...prev.categories[categoryKey],
          types: [...prev.categories[categoryKey].types, type]
        }
      }
    }));
  };

  const removeTypeFromCategory = (categoryKey: string, typeIndex: number) => {
    setLocalSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryKey]: {
          ...prev.categories[categoryKey],
          types: prev.categories[categoryKey].types.filter((_, i) => i !== typeIndex)
        }
      }
    }));
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Equipment Settings</DialogTitle>
          <DialogDescription>
            Configure equipment categories, types, and other settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories">Categories & Types</TabsTrigger>
            <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Equipment Categories</h3>
              
              {/* Add New Category */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-3">Add New Category</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Category key (e.g., testing)"
                    value={newCategoryKey}
                    onChange={(e) => setNewCategoryKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  />
                  <Input
                    placeholder="Category name (e.g., Testing Equipment)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <Button onClick={addCategory} disabled={!newCategoryKey || !newCategoryName}>
                    <ListPlus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
                <Input
                  className="mt-3"
                  placeholder="Description (optional)"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                />
              </div>

              {/* Existing Categories */}
              <div className="space-y-4">
                {Object.entries(localSettings.categories).map(([key, category]) => (
                  <CategoryCard
                    key={key}
                    categoryKey={key}
                    category={category}
                    onRemove={() => removeCategory(key)}
                    onAddType={(type) => addTypeToCategory(key, type)}
                    onRemoveType={(index) => removeTypeFromCategory(key, index)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>



          <TabsContent value="connectivity" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Connectivity Options</h3>
              <p className="text-sm text-muted-foreground">
                Manage available connectivity options for equipment
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {localSettings.connectivityOptions.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{option}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setLocalSettings(prev => ({
                          ...prev,
                          connectivityOptions: prev.connectivityOptions.filter((_, i) => i !== index)
                        }));
                      }}
                      className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(localSettings)} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CategoryCard({
  categoryKey,
  category,
  onRemove,
  onAddType,
  onRemoveType
}: {
  categoryKey: string;
  category: { name: string; description: string; types: string[] };
  onRemove: () => void;
  onAddType: (type: string) => void;
  onRemoveType: (index: number) => void;
}) {
  const [newType, setNewType] = useState("");

  const handleAddType = () => {
    if (newType) {
      onAddType(newType.toLowerCase().replace(/\s+/g, '_'));
      setNewType("");
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium">{category.name}</h4>
          {category.description && (
            <p className="text-sm text-muted-foreground">{category.description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {category.types.map((type, index) => (
            <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
              <span className="text-sm">{type.replace('_', ' ')}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveType(index)}
                className="h-4 w-4 p-0 text-red-600 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder="Add equipment type"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddType();
              }
            }}
          />
          <Button onClick={handleAddType} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
