import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Brain, Link, Mic, Shield, ClipboardCheck, Fingerprint, Search, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { DeploymentModal } from "@/components/modals/deployment-modal";

const moduleIcons = {
  ai: Brain,
  core: Link,
  system: Shield,
};

const specificIcons: Record<string, any> = {
  "PulseAI Llama": Brain,
  "PulseLedger": Link,
  "PulseQuery": Mic,
  "PulseSecurity": Shield,
  "PulseCompliance": ClipboardCheck,
  "PulseID": Fingerprint,
};

export default function Modules() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: modules, isLoading } = useQuery({
    queryKey: ["/api/modules/available"],
    queryFn: apiClient.getModules,
  });

  const scanMutation = useMutation({
    mutationFn: apiClient.scanModules,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules/available"] });
    },
  });

  const loadMutation = useMutation({
    mutationFn: (name: string) => apiClient.loadModule(name.toLowerCase().replace(/\s+/g, '-')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules/available"] });
    },
  });

  const getModuleIcon = (module: any) => {
    const SpecificIcon = specificIcons[module.name];
    if (SpecificIcon) return SpecificIcon;
    
    const TypeIcon = moduleIcons[module.type as keyof typeof moduleIcons];
    return TypeIcon || Brain;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "loaded":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ready</Badge>;
      case "discovered":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Discovered</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canDeploy = (module: any) => module.status === "loaded";
  const canLoad = (module: any) => module.status === "discovered";

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Module Library</h2>
              <p className="text-slate-600">Manage and deploy your PulseBusiness modules</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => scanMutation.mutate()}
                disabled={scanMutation.isPending}
                variant="outline"
              >
                <Search className="w-4 h-4 mr-2" />
                {scanMutation.isPending ? "Scanning..." : "Scan Modules"}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border border-slate-200 animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-24"></div>
                          <div className="h-3 bg-slate-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              modules?.map((module) => {
                const Icon = getModuleIcon(module);
                return (
                  <Card
                    key={module.id}
                    className="border border-slate-200 hover:border-primary/30 transition-colors"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Icon className="text-primary w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{module.name}</h4>
                            <p className="text-sm text-slate-600">{module.version}</p>
                          </div>
                        </div>
                        {getStatusBadge(module.status)}
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                        {module.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-slate-500 capitalize px-2 py-1 bg-slate-100 rounded">
                          {module.type} Module
                        </span>
                        <span className="text-xs text-slate-500">
                          {module.path}
                        </span>
                      </div>

                      <div className="flex items-center justify-between space-x-2">
                        {canLoad(module) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadMutation.mutate(module.name)}
                            disabled={loadMutation.isPending}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Load
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          disabled={!canDeploy(module)}
                          onClick={() => setSelectedModule(module.id)}
                          className="flex-1"
                        >
                          {canDeploy(module) ? "Deploy" : canLoad(module) ? "Load First" : "Loading..."}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {(!modules || modules.length === 0) && !isLoading && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No modules found</h3>
              <p className="text-slate-500 mb-6">
                Click "Scan Modules" to discover available PulseBusiness modules
              </p>
              <Button onClick={() => scanMutation.mutate()}>
                <Search className="w-4 h-4 mr-2" />
                Scan for Modules
              </Button>
            </div>
          )}
        </main>
      </div>

      <DeploymentModal
        moduleId={selectedModule}
        isOpen={!!selectedModule}
        onClose={() => setSelectedModule(null)}
      />
    </>
  );
}
