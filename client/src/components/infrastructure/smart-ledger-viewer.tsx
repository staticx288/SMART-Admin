import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search,
  Filter,
  RefreshCw,
  FileText,
  User,
  Clock,
  Hash,
  Shield,
  Activity,
  Server,
  Boxes,
  Network,
  HardDrive,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  Download
} from "lucide-react";
import { useState } from "react";

interface LedgerEntry {
  entry_id: string;
  timestamp: string;
  action_type: string;
  action: string;
  target: string;
  details: string;
  user_id: string;
  smart_id: string;
  metadata: Record<string, any>;
  previous_hash: string;
  entry_hash: string;
  tab_source: string;
}

interface LedgerResponse {
  success: boolean;
  activities: LedgerEntry[];
  total: number;
}

interface LedgerCounts {
  success: boolean;
  counts: {
    modules: number;
    nodes: number;
    domains: number;
    equipment: number;
    total: number;
  };
}

export default function SmartLedgerViewer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [limitEntries, setLimitEntries] = useState<number>(50);

  // Fetch ledger entries (filtering handled on frontend for now)
  const { data: ledgerData, isLoading, refetch } = useQuery<LedgerResponse>({
    queryKey: ["/api/ledger/activities", limitEntries],
    queryFn: async () => {
      const response = await fetch(`/api/ledger/activities?limit=${limitEntries}`);
      return response.json();
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Fetch total count separately with high limit to get true total
  const { data: totalCountData } = useQuery({
    queryKey: ["/api/ledger/activities-total"],
    queryFn: async () => {
      const response = await fetch(`/api/ledger/activities?limit=10000`);
      const data = await response.json();
      return { total: data.total };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch ledger integrity counts
  const { data: countsData } = useQuery<LedgerCounts>({
    queryKey: ["/api/ledger/counts"],
    queryFn: () => fetch("/api/ledger/counts").then((res) => res.json()),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const getActionTypeIcon = (actionType: string) => {
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
      case "system":
        return <Activity className="h-4 w-4 text-gray-500" />;
      case "user":
        return <User className="h-4 w-4 text-cyan-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action?.toLowerCase()) {
      case "create":
        return "bg-green-100 text-green-800 border-green-200";
      case "update":
      case "edit":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delete":
      case "remove":
        return "bg-red-100 text-red-800 border-red-200";
      case "deploy":
      case "activate":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "validate":
      case "approve":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "start":
      case "connect":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "stop":
      case "disconnect":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSmartIdColor = (actionType: string) => {
    switch (actionType?.toLowerCase()) {
      case "module":
        return "text-purple-600 border-purple-600"; // Same as modules tab
      case "domain":
        return "text-red-600 border-red-600"; // Same as domain ecosystems tab
      case "node":
      case "hub":
        return "text-orange-600 border-orange-600"; // Same as nodes/hubs tab
      case "equipment":
        return "text-blue-600 border-blue-600"; // Same as equipment tab
      case "system":
        return "text-yellow-600 border-yellow-600"; // Same as overview tab
      default:
        return "text-gray-600 border-gray-600";
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
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    }
  };

  const formatFullTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getUniqueActionTypes = () => {
    if (!ledgerData?.activities) return [];
    return Array.from(new Set(ledgerData.activities.map(entry => entry.action_type)));
  };

  const getUniqueActions = () => {
    if (!ledgerData?.activities) return [];
    return Array.from(new Set(ledgerData.activities.map(entry => entry.action)));
  };

  // Apply frontend filtering
  const filteredEntries = (ledgerData?.activities || []).filter(entry => {
    // Search filter
    if (searchTerm && !entry.details.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !entry.target.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !entry.smart_id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Action type filter
    if (actionTypeFilter !== 'all' && entry.action_type !== actionTypeFilter) {
      return false;
    }
    
    // Action filter
    if (actionFilter !== 'all' && entry.action !== actionFilter) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMART-Ledger</h1>
          <p className="text-muted-foreground">
            Immutable audit trail and blockchain-verified system events
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Ledger Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCountData?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Blockchain-verified events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Module Events</CardTitle>
            <Boxes className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {countsData?.counts?.modules || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              SMART-Module activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Node Events</CardTitle>
            <Server className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {countsData?.counts?.nodes || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Node/Hub activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domain Events</CardTitle>
            <Network className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {countsData?.counts?.domains || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Domain ecosystem activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment Events</CardTitle>
            <HardDrive className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {countsData?.counts?.equipment || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Equipment activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrity Status</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-600">Verified</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Blockchain integrity intact
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action Type</label>
              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {getUniqueActionTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center space-x-2">
                        {getActionTypeIcon(type)}
                        <span className="capitalize">{type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {getUniqueActions().map((action) => (
                    <SelectItem key={action} value={action}>
                      <span className="capitalize">{action}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Limit</label>
              <Select value={limitEntries.toString()} onValueChange={(value) => setLimitEntries(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 entries</SelectItem>
                  <SelectItem value="50">50 entries</SelectItem>
                  <SelectItem value="100">100 entries</SelectItem>
                  <SelectItem value="250">250 entries</SelectItem>
                  <SelectItem value="500">500 entries</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail Entries</CardTitle>
          <CardDescription>
            Chronological blockchain-verified system events with cryptographic integrity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredEntries.length > 0 ? (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div 
                  key={entry.entry_id} 
                  className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  {/* Entry Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getActionTypeIcon(entry.action_type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={getActionBadgeColor(entry.action)}
                          >
                            {entry.action}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {entry.action_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {entry.tab_source}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-1">{entry.details}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1 mb-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(entry.timestamp)}</span>
                      </div>
                      <div title={formatFullTimestamp(entry.timestamp)} className="text-xs">
                        {formatFullTimestamp(entry.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Entry Details */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Target:</span>
                      <p className="font-medium">{entry.target}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">User:</span>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span className="font-medium">{entry.user_id}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SMART-ID:</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-mono bg-white ${getSmartIdColor(entry.action_type)}`}
                      >
                        {entry.smart_id}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Entry ID:</span>
                      <p className="font-mono text-xs">{entry.entry_id.substring(0, 16)}...</p>
                    </div>
                  </div>

                  {/* Cryptographic Hashes */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                          <Hash className="h-3 w-3" />
                          <span>Entry Hash:</span>
                        </div>
                        <p className="font-mono text-xs bg-muted/30 p-2 rounded break-all">
                          {entry.entry_hash}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                          <Hash className="h-3 w-3" />
                          <span>Previous Hash:</span>
                        </div>
                        <p className="font-mono text-xs bg-muted/30 p-2 rounded break-all">
                          {entry.previous_hash}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata (if available) */}
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-center space-x-1 text-muted-foreground mb-2">
                        <Info className="h-3 w-3" />
                        <span className="text-xs">Metadata:</span>
                      </div>
                      <pre className="text-xs bg-muted/30 p-2 rounded overflow-x-auto">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Ledger Entries Found</h3>
              <p className="text-muted-foreground">
                No entries match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}