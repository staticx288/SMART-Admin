import { type ModuleState } from "../../../../shared/demo-schema";
import { CheckCircle2, XCircle, Circle, Loader2, DoorOpen, Camera, Shield, Wrench, Scale, FileText, TestTube, Target, ShieldCheck, Send } from "lucide-react";

interface WorkflowVisualizationProps {
  modules: ModuleState[];
  currentModule?: string;
  "data-testid"?: string;
}

const moduleIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  gatekeeper: DoorOpen,
  vision: Camera,
  safety: Shield,
  maintenance: Wrench,
  compliance: Scale,
  standards: FileText,
  "test-execution": TestTube,
  qa: Target,
  guardian: ShieldCheck,
  handoff: Send,
};

export function WorkflowVisualization({ modules, currentModule, "data-testid": dataTestId }: WorkflowVisualizationProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "active":
        return <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />;
      case "skipped":
        return <Circle className="w-5 h-5 text-gray-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-green-400 bg-green-900/20";
      case "failed":
        return "border-red-400 bg-red-900/20";
      case "active":
        return "border-orange-500 bg-orange-900/20 animate-pulse";
      case "skipped":
        return "border-gray-600 bg-gray-900/20";
      default:
        return "border-gray-700 bg-gray-900/30";
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6" data-testid={dataTestId}>
      <h3 className="text-lg font-semibold text-white mb-6">Workflow Progress</h3>
      
      <div className="relative">
        <div className="flex items-center justify-between">
          {modules.map((module, index) => {
            const IconComponent = moduleIconMap[module.name] || Circle;
            return (
              <div key={module.name} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${getStatusColor(
                        module.status
                      )}`}
                      data-testid={`module-${module.name}-indicator`}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full">
                      {getStatusIcon(module.status)}
                    </div>
                  </div>
                  <div className="text-center mt-1">
                    <div className="text-xs font-medium text-white whitespace-nowrap">
                      {module.displayName}
                    </div>
                    {module.status === "active" && (
                      <div className="text-xs text-orange-500 font-mono mt-1">Processing...</div>
                    )}
                    {module.status === "success" && module.endTime && (
                      <div className="text-xs text-green-400 font-mono mt-1">Complete</div>
                    )}
                    {module.status === "failed" && (
                      <div className="text-xs text-red-400 font-mono mt-1">Failed</div>
                    )}
                  </div>
                </div>
                
                {index < modules.length - 1 && (
                  <div className="flex-1 h-0.5 bg-zinc-700 mx-2 relative top-[-36px]">
                    <div
                      className={`h-full transition-all duration-500 ${
                        module.status === "success"
                          ? "bg-green-400 w-full"
                          : module.status === "active"
                          ? "bg-orange-500 w-1/2"
                          : "bg-zinc-700 w-0"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}