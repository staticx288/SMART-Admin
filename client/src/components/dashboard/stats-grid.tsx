import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Server, Box, Cpu, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatsGrid() {
  const { data: stats } = useQuery({
    queryKey: ["/api/status/overview"],
    queryFn: apiClient.getSystemStatus,
    refetchInterval: 5000, // Update every 5 seconds
  });

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Active Nodes</p>
              <p className="text-3xl font-bold text-slate-900">{stats.onlineNodes}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Server className="text-green-600 text-xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-600 text-sm font-medium">
              {stats.onlineNodes} of {stats.totalNodes} online
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Deployed Modules</p>
              <p className="text-3xl font-bold text-slate-900">{stats.activeDeployments}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Box className="text-blue-600 text-xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-blue-600 text-sm font-medium">
              {stats.activeDeployments} running
            </span>
            <span className="text-slate-500 text-sm ml-2">right now</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">CPU Usage</p>
              <p className="text-3xl font-bold text-slate-900">{stats.cpuUsage}%</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Cpu className="text-amber-600 text-xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-amber-600 text-sm font-medium">Normal load</span>
            <span className="text-slate-500 text-sm ml-2">across cluster</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Failed Deployments</p>
              <p className="text-3xl font-bold text-slate-900">{stats.failedDeployments}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-red-600 text-xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-red-600 text-sm font-medium">
              {stats.failedDeployments > 0 ? "Needs attention" : "All good"}
            </span>
            <span className="text-slate-500 text-sm ml-2">
              {stats.failedDeployments > 0 ? "review logs" : ""}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
