import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Play, Square, RotateCcw, Trash2, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Deployments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: deployments, isLoading } = useQuery({
    queryKey: ["/api/deployments"],
    queryFn: apiClient.getDeployments,
    refetchInterval: 2000,
  });

  const startMutation = useMutation({
    mutationFn: apiClient.startDeployment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
      toast({ title: "Deployment started successfully" });
    },
  });

  const stopMutation = useMutation({
    mutationFn: apiClient.stopDeployment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
      toast({ title: "Deployment stopped successfully" });
    },
  });

  const restartMutation = useMutation({
    mutationFn: apiClient.restartDeployment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
      toast({ title: "Deployment restarted successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiClient.deleteDeployment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
      toast({ title: "Deployment removed successfully" });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "deployed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "deploying":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "stopped":
        return <Square className="w-4 h-4 text-slate-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "deployed":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Running</Badge>;
      case "deploying":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Deploying</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "stopped":
        return <Badge variant="secondary">Stopped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
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

  const canStart = (deployment: any) => deployment.status === "stopped" || deployment.status === "failed";
  const canStop = (deployment: any) => deployment.status === "deployed";
  const canRestart = (deployment: any) => deployment.status === "deployed";
  const canDelete = (deployment: any) => deployment.status !== "deploying";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Deployments</h2>
            <p className="text-slate-600">Monitor and control your module deployments</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-600">
              {deployments?.length || 0} total deployments
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border border-slate-200 animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-5 bg-slate-200 rounded w-48"></div>
                        <div className="h-4 bg-slate-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            deployments?.map((deployment) => (
              <Card key={deployment.id} className="border border-slate-200 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getStatusIcon(deployment.status)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {deployment.module?.name || `Module ${deployment.moduleId}`}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <span>→ {deployment.node?.name || `Node ${deployment.nodeId}`}</span>
                          <span>•</span>
                          <span>{deployment.node?.ipAddress}</span>
                          {deployment.deployedAt && (
                            <>
                              <span>•</span>
                              <span>Deployed {formatTimeAgo(deployment.deployedAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(deployment.status)}
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canStart(deployment) || startMutation.isPending}
                          onClick={() => startMutation.mutate(deployment.id)}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canStop(deployment) || stopMutation.isPending}
                          onClick={() => stopMutation.mutate(deployment.id)}
                        >
                          <Square className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canRestart(deployment) || restartMutation.isPending}
                          onClick={() => restartMutation.mutate(deployment.id)}
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canDelete(deployment) || deleteMutation.isPending}
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this deployment?")) {
                              deleteMutation.mutate(deployment.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {deployment.configuration && Object.keys(deployment.configuration).length > 0 && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Configuration</h4>
                      <pre className="text-xs text-slate-600 font-mono overflow-x-auto">
                        {JSON.stringify(deployment.configuration, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {(!deployments || deployments.length === 0) && !isLoading && (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No deployments found</h3>
            <p className="text-slate-500">
              No module deployments are currently active
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
