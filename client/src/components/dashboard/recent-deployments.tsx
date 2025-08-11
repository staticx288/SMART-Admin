import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function RecentDeployments() {
  const { data: deployments } = useQuery({
    queryKey: ["/api/deployments"],
    queryFn: apiClient.getDeployments,
    refetchInterval: 2000,
  });

  const recentDeployments = deployments?.slice(-3).reverse() || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "deployed":
        return <Check className="text-green-600" />;
      case "deploying":
        return <Loader2 className="text-blue-600 animate-spin" />;
      case "failed":
        return <X className="text-red-600" />;
      default:
        return <Loader2 className="text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed":
        return "text-green-600";
      case "deploying":
        return "text-blue-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-slate-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "deployed":
        return "Deployed";
      case "deploying":
        return "Deploying";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
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

  return (
    <Card className="border border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">Recent Deployments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentDeployments.map((deployment) => (
            <div key={deployment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border">
                  {getStatusIcon(deployment.status)}
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">{deployment.module?.name}</h4>
                  <p className="text-sm text-slate-600">
                    {deployment.status === "deploying" ? "Deploying to" : "Deployed to"} {deployment.node?.name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${getStatusColor(deployment.status)}`}>
                  {getStatusText(deployment.status)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatTimeAgo(deployment.updatedAt)}
                </p>
              </div>
            </div>
          ))}
          
          {recentDeployments.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No recent deployments
            </div>
          )}
          
          <Button variant="ghost" className="w-full text-primary hover:text-primary/80">
            View All Deployments →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
