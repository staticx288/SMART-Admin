import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Activity, 
  Users, 
  Radio, 
  Boxes, 
  Network, 
  HardDrive, 
  Brain, 
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Server
} from "lucide-react";

interface SystemOverview {
  active_smart_ids: number;
  validated_modules: number;
  configured_domains: number;
  available_nodes: number;
  offline_nodes: number;
  successful_deployments: number;
  active_equipment: number;
  available_hubs: number;
  offline_hubs: number;
}

interface SystemHealth {
  overall_status: string;
  node_discovery_status: string;
  module_scanner_status: string;
  uptime_hours: number;
  uptime_minutes?: number;
  uptime_total_minutes?: number;
  last_activity: string;
  cpu_usage?: number;
}

export default function OverviewDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch system overview data
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery<SystemOverview>({
    queryKey: ["/api/infrastructure/overview"],
    queryFn: () => fetch("/api/infrastructure/overview").then((res) => res.json()),
    refetchInterval: 5000, // Refresh every 5 seconds to stay in sync with nodes manager
    refetchIntervalInBackground: true, // Keep polling even when tab is not active
  });

  // Fetch system health data
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery<SystemHealth>({
    queryKey: ["/api/infrastructure/health"],
    queryFn: () => fetch("/api/infrastructure/health").then((res) => res.json()),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch pending items data
  const { data: modules } = useQuery({
    queryKey: ["/api/infrastructure/modules"],
    queryFn: () => fetch("/api/infrastructure/modules").then((res) => res.json()),
    refetchInterval: 10000, // Refresh more frequently
  });

  const { data: domains } = useQuery({
    queryKey: ["/api/infrastructure/domains"],
    queryFn: () => fetch("/api/infrastructure/domains").then((res) => res.json()),
    refetchInterval: 10000, // Refresh more frequently
  });

  // For nodes discovery, we'll need to simulate a discovery check
  const { data: discoveryResults } = useQuery({
    queryKey: ["/api/nodes/discover-check"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/nodes/discover", { method: "POST" });
        return response.json();
      } catch (error) {
        return { discovered_agents: [] };
      }
    },
    refetchInterval: 60000, // Check every minute
    retry: false, // Don't retry failed discovery checks
  });

  // Fetch recent activities from SMART-Ledger
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/ledger/activities"],
    queryFn: () => fetch("/api/ledger/activities?limit=15")
      .then((res) => res.json())
      .then((data) => data.activities || []), // Extract activities array from API response
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  // Fetch ledger integrity counts
  const { data: ledgerCounts } = useQuery({
    queryKey: ["/api/ledger/counts"],
    queryFn: () => fetch("/api/ledger/counts")
      .then((res) => res.json())
      .then((data) => data.counts || {}),
    refetchInterval: 10000, // Refresh every 10 seconds
  });



  // Calculate ecosystem health percentage
  const getEcosystemHealth = () => {
    if (!overview) return 0;
    
    const totalNodes = (overview.available_nodes || 0) + (overview.offline_nodes || 0);
    const totalHubs = (overview.available_hubs || 0) + (overview.offline_hubs || 0);
    const totalInfrastructure = totalNodes + totalHubs + (overview.active_equipment || 0);
    
    if (totalInfrastructure === 0) return 0;
    
    const onlineInfrastructure = (overview.available_nodes || 0) + (overview.available_hubs || 0) + (overview.active_equipment || 0);
    
    return Math.round((onlineInfrastructure / totalInfrastructure) * 100);
  };

  const handleRefresh = () => {
    refetchOverview();
    refetchHealth();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "online":
      case "active":
        return "text-green-600 border-green-600";
      case "warning":
      case "degraded":
        return "text-yellow-600 border-yellow-600";
      case "error":
      case "offline":
      case "failed":
        return "text-red-600 border-red-600";
      default:
        return "text-gray-600 border-gray-600";
    }
  };

  const normalizeStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "active":
        return "Online";
      case "error":
      case "failed":
        return "Offline";
      case "warning":
      case "degraded":
        return "Warning";
      default:
        return status || "Unknown";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "online":
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
      case "degraded":
        return <AlertTriangle className="h-4 w-4" />;
      case "error":
      case "offline":
      case "failed":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityIcon = (actionType: string) => {
    switch (actionType?.toLowerCase()) {
      case "module":
        return <Boxes className="h-4 w-4 text-purple-500" />;
      case "domain":
        return <Network className="h-4 w-4 text-green-500" />;
      case "node":
      case "hub":
        return <Server className="h-4 w-4 text-blue-500" />;
      case "equipment":
        return <HardDrive className="h-4 w-4 text-yellow-500" />;
      case "user":
        return <Users className="h-4 w-4 text-cyan-500" />;
      case "system":
        return <Activity className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Infrastructure Overview</h1>
          <p className="text-muted-foreground">
            Real-time status and metrics for your SMART-Business infrastructure
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>System Health</span>
          </CardTitle>
          <CardDescription>Overall system status and component health</CardDescription>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-smart" />
              <div className="h-4 bg-muted rounded animate-smart w-3/4" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(health?.overall_status || "unknown")}
                  <span className="text-sm font-medium">Overall Status</span>
                </div>
                <Badge variant="outline" className={getStatusColor(health?.overall_status || "unknown")}>
                  {health?.overall_status || "Unknown"}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Radio className="h-4 w-4" />
                  <span className="text-sm font-medium">Node Discovery</span>
                </div>
                <Badge variant="outline" className={getStatusColor(health?.node_discovery_status || "unknown")}>
                  {normalizeStatusText(health?.node_discovery_status || "unknown")}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Boxes className="h-4 w-4" />
                  <span className="text-sm font-medium">Module Scanner</span>
                </div>
                <Badge variant="outline" className={getStatusColor(health?.module_scanner_status || "unknown")}>
                  {normalizeStatusText(health?.module_scanner_status || "unknown")}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm font-medium">Ledger Integrity</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Modules:</span>
                    <span>{ledgerCounts?.modules || 0} entries</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nodes:</span>
                    <span>{ledgerCounts?.nodes || 0} entries</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Domains:</span>
                    <span>{ledgerCounts?.domains || 0} entries</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equipment:</span>
                    <span>{ledgerCounts?.equipment || 0} entries</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMART-Modules</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewLoading ? "..." : overview?.validated_modules || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for deployment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domain Ecosystems</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewLoading ? "..." : overview?.configured_domains || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Configured domain packages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Nodes</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {overviewLoading ? "..." : overview?.available_nodes || 0}
                </div>
                <p className="text-xs text-green-600 font-medium">
                  Online
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {overviewLoading ? "..." : overview?.offline_nodes || 0}
                </div>
                <p className="text-xs text-red-600 font-medium">
                  Offline
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Hubs</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {overviewLoading ? "..." : overview?.available_hubs || 0}
                </div>
                <p className="text-xs text-green-600 font-medium">
                  Online
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {overviewLoading ? "..." : overview?.offline_hubs || 0}
                </div>
                <p className="text-xs text-red-600 font-medium">
                  Offline
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Deployments</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewLoading ? "..." : overview?.successful_deployments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Equipment</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewLoading ? "..." : overview?.active_equipment || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered and operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active SMART-IDs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewLoading ? "..." : overview?.active_smart_ids || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-generated for modules/hardware
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ecosystem Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Infrastructure Online</span>
                <span>{getEcosystemHealth()}%</span>
              </div>
              <Progress value={getEcosystemHealth()} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Nodes, hubs, and equipment operational
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Attention Required</span>
          </CardTitle>
          <CardDescription>Items that need validation, configuration, or deployment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pending Nodes/Hubs */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Unregistered Nodes/Hubs</h3>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {discoveryResults?.discovered_agents?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Broadcasting agents awaiting registration
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLocation('/nodes')}
                className="w-full"
                disabled={(discoveryResults?.discovered_agents?.length || 0) === 0}
              >
                Register Nodes
              </Button>
            </div>

            {/* Pending Modules */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Boxes className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold text-sm">Unvalidated Modules</h3>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {modules?.filter((m: any) => m.status === 'discovered').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Discovered modules needing validation
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLocation('/modules')}
                className="w-full"
                disabled={(modules?.filter((m: any) => m.status === 'discovered').length || 0) === 0}
              >
                Validate Modules
              </Button>
            </div>

            {/* Pending Domain Deployments */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Network className="h-4 w-4 text-green-500" />
                <h3 className="font-semibold text-sm">Undeployed Domains</h3>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {domains?.filter((d: any) => d.status === 'configured').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Configured domains ready for deployment
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLocation('/domain-ecosystems')}
                className="w-full"
                disabled={(domains?.filter((d: any) => d.status === 'configured').length || 0) === 0}
              >
                Deploy Domains
              </Button>
            </div>
          </div>

          {/* Show all clear message if nothing pending */}
          {(!discoveryResults?.discovered_agents?.length && 
            !modules?.filter((m: any) => m.status === 'discovered').length &&
            !domains?.filter((d: any) => d.status === 'configured').length) && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-green-700">All Clear!</h3>
              <p className="text-muted-foreground">
                No pending actions required. All modules are validated, nodes are registered, and domains are deployed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activitiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                  </div>
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity: any) => (
                  <div key={activity.entry_id} className="flex items-start space-x-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.action_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {activity.details}
                        </p>
                        <div className="flex items-center space-x-1">
                          <Badge variant="outline" className="text-xs">
                            {activity.tab_source}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {activity.action_type}.{activity.action} • {activity.target}
                        </p>
                        {activity.smart_id && (
                          <Badge variant="secondary" className="text-xs">
                            {activity.smart_id}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(activity.timestamp)} • {activity.user_id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity available.</p>
                <p className="text-xs mt-1">System events will appear here as they occur.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
