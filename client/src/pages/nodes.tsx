import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Server, Activity, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export default function Nodes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: nodes, isLoading } = useQuery({
    queryKey: ["/api/nodes"],
    queryFn: apiClient.getNodes,
    refetchInterval: 5000,
  });

  const testNodeMutation = useMutation({
    mutationFn: (nodeId: string) => apiClient.testNode(nodeId),
    onSuccess: (data, nodeId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/nodes"] });
      toast({
        title: "Node Test Complete",
        description: `Node connectivity test ${data.success ? "passed" : "failed"}`,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Test Failed",
        description: "Failed to test node connectivity",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Online</Badge>;
      case "offline":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Offline</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <Wifi className="w-4 h-4 text-green-600" />;
      case "offline":
        return <WifiOff className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const getResourceUsage = (resources: any) => {
    // Simulate current usage
    const cpuPercent = Math.floor(Math.random() * 40) + 30; // 30-70%
    const ramPercent = Math.floor(Math.random() * 50) + 30; // 30-80%
    const storagePercent = Math.floor(Math.random() * 60) + 20; // 20-80%
    return { cpuPercent, ramPercent, storagePercent };
  };

  const getNodeTypeDisplay = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Node Management</h2>
            <p className="text-slate-600">Monitor and manage your deployment nodes</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/nodes"] })}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border border-slate-200 animate-pulse">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-5 bg-slate-200 rounded w-32"></div>
                      <div className="h-4 bg-slate-200 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-16"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            nodes?.map((node) => {
              const usage = getResourceUsage(node.resources);
              const isTestingThisNode = testNodeMutation.isPending;
              
              return (
                <Card key={node.id} className="border border-slate-200 hover:border-primary/30 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(node.status)}
                        <div>
                          <CardTitle className="text-lg">{node.name}</CardTitle>
                          <p className="text-sm text-slate-600">
                            {getNodeTypeDisplay(node.type)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(node.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Connection Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">IP Address:</span>
                          <span className="font-mono">{node.ipAddress}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">SSH Port:</span>
                          <span className="font-mono">{node.sshPort}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Last Seen:</span>
                          <span>{formatLastSeen(node.lastSeen)}</span>
                        </div>
                      </div>

                      {/* Resources */}
                      {node.status === "online" && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-slate-700">Resource Usage</h4>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span>CPU</span>
                              <span>{usage.cpuPercent}%</span>
                            </div>
                            <Progress value={usage.cpuPercent} className="h-1" />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span>RAM</span>
                              <span>{Math.round(node.resources.ramGb * usage.ramPercent / 100)}/{node.resources.ramGb}GB</span>
                            </div>
                            <Progress value={usage.ramPercent} className="h-1" />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span>Storage</span>
                              <span>{Math.round(node.resources.storageGb * usage.storagePercent / 100)}/{node.resources.storageGb}GB</span>
                            </div>
                            <Progress value={usage.storagePercent} className="h-1" />
                          </div>
                        </div>
                      )}

                      {/* Capabilities */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Capabilities</h4>
                        <div className="flex flex-wrap gap-1">
                          {node.capabilities.map((capability) => (
                            <Badge key={capability} variant="outline" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testNodeMutation.mutate(node.id)}
                          disabled={isTestingThisNode}
                          className="flex-1"
                        >
                          {isTestingThisNode ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              Testing
                            </>
                          ) : (
                            <>
                              <Activity className="w-3 h-3 mr-1" />
                              Test
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {(!nodes || nodes.length === 0) && !isLoading && (
          <div className="text-center py-12">
            <Server className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No nodes found</h3>
            <p className="text-slate-500">
              No deployment nodes are currently registered with the system
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
