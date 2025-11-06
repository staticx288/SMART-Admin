import { type Scenario } from "../../../../shared/demo-schema";
import { Play, CheckCircle, XCircle, Ban, AlertTriangle, FileX, ShieldAlert } from "lucide-react";

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  onSelectScenario: (scenario: Scenario) => void;
  "data-testid"?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckCircle,
  XCircle,
  Ban,
  AlertTriangle,
  FileX,
  ShieldAlert,
};

export function ScenarioSelector({ scenarios, onSelectScenario, "data-testid": dataTestId }: ScenarioSelectorProps) {
  return (
    <div className="max-w-7xl mx-auto" data-testid={dataTestId}>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white mb-2">
          Select Test Scenario
        </h2>
        <p className="text-gray-300">
          Choose a scenario to demonstrate the SMART Testing Node workflow validation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((scenario) => {
          const IconComponent = iconMap[scenario.icon] || CheckCircle;
          return (
            <div
              key={scenario.id}
              className="p-6 bg-zinc-900 border border-zinc-700 rounded-lg hover:border-orange-500 cursor-pointer transition-all duration-150 hover:shadow-lg hover:-translate-y-1 group"
              onClick={() => onSelectScenario(scenario)}
              data-testid={`scenario-card-${scenario.id}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={scenario.type === "success" ? "text-green-400" : "text-red-400"}>
                    <IconComponent className="w-10 h-10" />
                  </div>
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                      scenario.type === "success"
                        ? "bg-green-900/50 text-green-400 border border-green-600"
                        : "bg-red-900/50 text-red-400 border border-red-600"
                    }`}
                    data-testid={`badge-${scenario.id}-type`}
                  >
                    {scenario.type === "success" ? "Success" : "Error"}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {scenario.name}
                  </h3>
                  <p className="text-sm text-gray-300 line-clamp-2">
                    {scenario.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-700 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Contract:</span>
                    <span className="font-mono text-white">{scenario.contractId}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Operator:</span>
                    <span className="font-mono text-white">{scenario.operatorName}</span>
                  </div>
                </div>

                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-black font-medium hover:bg-orange-600 transition-all"
                  data-testid={`button-start-${scenario.id}`}
                >
                  <Play className="w-4 h-4" />
                  Run Scenario
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}