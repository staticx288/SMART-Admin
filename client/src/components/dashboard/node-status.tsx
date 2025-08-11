import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NodeStatus() {
  const { data: nodes } = useQuery({
    queryKey: ["/api/nodes"],
    queryFn: apiClient.getNodes,
    refetchInterval: 5000,
  });

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-red-500";
      default:
        return "bg-slate-400";
    }
  };

  const getResourceUsage = (resources: any) => {
    // Simulate current usage based on total resources
    const cpuPercent = Math.floor(Math.random() * 40) + 30; // 30-70%
    const ramUsed = (resources.ramGb * (Math.random() * 0.6 + 0.3)).toFixed(1); // 30-90%
    return { cpuPercent, ramUsed };
  };

  return (
    <Card className="border border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">Node Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {nodes?.map((node) => {
            const usage = getResourceUsage(node.resources);
            return (
              <div key={node.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`}></div>
                  <div>
                    <h4 className="font-medium text-slate-900">{node.name}</h4>
                    <p className="text-sm text-slate-600">
                      {node.ipAddress} • {node.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {node.status === "online" ? (
                    <>
                      <p className="text-sm font-medium text-slate-900">
                        CPU: {usage.cpuPercent}%
                      </p>
                      <p className="text-xs text-slate-500">
                        RAM: {usage.ramUsed}/{node.resources.ramGb}GB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-red-600">Offline</p>
                      <p className="text-xs text-slate-500">
                        Last seen: {formatLastSeen(node.lastSeen)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          
          {(!nodes || nodes.length === 0) && (
            <div className="text-center py-8 text-slate-500">
              No nodes found
            </div>
          )}
          
          <Button variant="ghost" className="w-full text-primary hover:text-primary/80">
            Manage All Nodes →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
