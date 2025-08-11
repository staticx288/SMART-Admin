import { StatsGrid } from "@/components/dashboard/stats-grid";
import { RecentDeployments } from "@/components/dashboard/recent-deployments";
import { NodeStatus } from "@/components/dashboard/node-status";
import { ModuleLibrary } from "@/components/dashboard/module-library";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { DeploymentModal } from "@/components/modals/deployment-modal";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export default function Dashboard() {
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);

  const { data: systemStatus } = useQuery({
    queryKey: ["/api/status/overview"],
    queryFn: apiClient.getSystemStatus,
    refetchInterval: 5000,
  });

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case "healthy":
        return "text-green-600";
      case "degraded":
        return "text-amber-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Deployment Dashboard</h2>
            <p className="text-slate-600 dark:text-slate-400">Monitor and manage your PulseBusiness module deployments</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                systemStatus?.systemHealth === "healthy" ? "bg-green-500" :
                systemStatus?.systemHealth === "degraded" ? "bg-amber-500" : "bg-red-500"
              }`}></div>
              <span className={`text-sm ${getSystemHealthColor(systemStatus?.systemHealth || "unknown")}`}>
                System {systemStatus?.systemHealth || "Loading..."}
              </span>
            </div>
            
            <Button
              onClick={() => setShowDeploymentModal(true)}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Deployment
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Stats Grid */}
        <div className="mb-8">
          <StatsGrid />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RecentDeployments />
          <NodeStatus />
        </div>

        {/* Module Library */}
        <ModuleLibrary />
      </main>

      {/* Deployment Modal */}
      <DeploymentModal
        moduleId={null}
        isOpen={showDeploymentModal}
        onClose={() => setShowDeploymentModal(false)}
      />
    </div>
  );
}
