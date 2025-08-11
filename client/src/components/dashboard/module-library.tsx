import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Brain, Link, Mic, Shield, ClipboardCheck, Fingerprint, Search } from "lucide-react";
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

export function ModuleLibrary() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: modules } = useQuery({
    queryKey: ["/api/modules/available"],
    queryFn: apiClient.getModules,
  });

  const scanMutation = useMutation({
    mutationFn: apiClient.scanModules,
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
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Loading</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canDeploy = (module: any) => module.status === "loaded";

  return (
    <>
      <Card className="border border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">Module Library</CardTitle>
          <Button
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Search className="w-4 h-4 mr-2" />
            {scanMutation.isPending ? "Scanning..." : "Scan for Modules"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules?.map((module) => {
              const Icon = getModuleIcon(module);
              return (
                <div
                  key={module.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 capitalize">
                      {module.type} Module
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canDeploy(module)}
                      onClick={() => setSelectedModule(module.id)}
                      className="text-primary hover:text-primary/80 disabled:text-slate-400"
                    >
                      {canDeploy(module) ? "Deploy →" : "Loading..."}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {(!modules || modules.length === 0) && (
            <div className="text-center py-12 text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No modules found</p>
              <p className="text-sm">Click "Scan for Modules" to discover available modules</p>
            </div>
          )}
        </CardContent>
      </Card>

      <DeploymentModal
        moduleId={selectedModule}
        isOpen={!!selectedModule}
        onClose={() => setSelectedModule(null)}
      />
    </>
  );
}
