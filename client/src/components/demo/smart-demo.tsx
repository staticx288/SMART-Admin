import { useState, useEffect, useRef } from "react";
import { scenarios, type Scenario, type SimulationState, type LogEntry, type Broadcast } from "../../../../shared/demo-schema";
import { ScenarioSelector } from "../demo/scenario-selector";
import { WorkflowVisualization } from "../demo/workflow-visualization";
import { LogOutput } from "../demo/log-output";
import { BroadcastAlert } from "../demo/broadcast-alert";
import { SmartContractDisplay } from "../demo/smart-contract-display";
import { TestProgressTracker } from "../demo/test-progress-tracker";
import { CheckCircle, XCircle, Ban, AlertTriangle, FileX, ShieldAlert } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckCircle,
  XCircle,
  Ban,
  AlertTriangle,
  FileX,
  ShieldAlert,
};

export default function SmartDemo() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isTestExecuting, setIsTestExecuting] = useState(false);
  const [currentTestStage, setCurrentTestStage] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleStartSimulation = async (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setIsSimulating(true);
    setBroadcasts([]);

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "start", scenarioId: scenario.id }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "state":
          setSimulationState(message.data);
          break;
        case "log":
          setSimulationState((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              logs: [...prev.logs, message.data],
            };
          });
          
          // Track test execution stages
          const logMessage = message.data.message;
          if (logMessage.includes("Performing liquid penetrant test")) {
            setIsTestExecuting(true);
          } else if (logMessage.includes("✅ Test completed successfully") || 
                     logMessage.includes("Test completed successfully") ||
                     logMessage.includes("Total Process Time") ||
                     logMessage.includes("LIQUID_PENETRANT_TEST_COMPLETE") ||
                     logMessage.includes("Process completed")) {
            setIsTestExecuting(false);
            setCurrentTestStage("Test completed - all stages finished");
          } else if (logMessage.includes("Stage ") || 
                     logMessage.includes("Pre-cleaning part surface") ||
                     logMessage.includes("Applying penetrant solution") ||
                     logMessage.includes("Penetrant dwell time") ||
                     logMessage.includes("Removing excess penetrant") ||
                     logMessage.includes("Applying developer") ||
                     logMessage.includes("Developer development time") ||
                     logMessage.includes("Visual inspection under UV") ||
                     logMessage.includes("Recording inspection results")) {
            setCurrentTestStage(logMessage);
          }
          break;
        case "ledger":
          setSimulationState((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ledgerEntries: [...prev.ledgerEntries, message.data],
              metrics: {
                ...prev.metrics,
                ledgerCount: prev.metrics.ledgerCount + 1,
              },
            };
          });
          break;
        case "broadcast":
          setBroadcasts((prev) => [...prev, message.data]);
          setSimulationState((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              broadcasts: [...prev.broadcasts, message.data],
              metrics: {
                ...prev.metrics,
                broadcastCount: prev.metrics.broadcastCount + 1,
                alertCount:
                  message.data.type === "alert"
                    ? prev.metrics.alertCount + 1
                    : prev.metrics.alertCount,
              },
            };
          });
          break;
        case "moduleUpdate":
          setSimulationState((prev) => {
            if (!prev) return null;
            const updatedModules = prev.modules.map((m) =>
              m.name === message.data.name ? { ...m, ...message.data } : m
            );
            return {
              ...prev,
              modules: updatedModules,
              currentModule: message.data.status === "active" ? message.data.name : prev.currentModule,
            };
          });
          break;
        case "complete":
          setSimulationState((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              status: message.data.status,
              metrics: {
                ...prev.metrics,
                duration: message.data.duration,
              },
            };
          });
          setIsSimulating(false);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsSimulating(false);
    };

    ws.onclose = () => {
      setIsSimulating(false);
    };
  };

  const handleReset = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setSelectedScenario(null);
    setIsSimulating(false);
    setSimulationState(null);
    setBroadcasts([]);
    setIsTestExecuting(false);
    setCurrentTestStage("");
  };

  const handleDismissBroadcast = (broadcastId: string) => {
    setBroadcasts((prev) => prev.filter((b) => b.id !== broadcastId));
  };

  const ScenarioIcon = selectedScenario ? iconMap[selectedScenario.icon] || CheckCircle : CheckCircle;

  return (
    <div className="min-h-screen">
      {/* Broadcast Alerts */}
      <div className="fixed top-20 right-6 z-50 space-y-2 max-w-sm">
        {broadcasts.map((broadcast) => (
          <BroadcastAlert
            key={broadcast.id}
            broadcast={broadcast}
            onDismiss={() => handleDismissBroadcast(broadcast.id)}
            data-testid={`broadcast-alert-${broadcast.id}`}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="py-12 bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            SMART NDT Demo
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Experience our revolutionary blockchain-verified NDT testing system in action. See how SMART modules validate every step of the testing process.
          </p>
        </div>
      </section>

      <main className="px-8 py-6">
        {!selectedScenario ? (
          <ScenarioSelector
            scenarios={scenarios}
            onSelectScenario={handleStartSimulation}
            data-testid="scenario-selector"
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ScenarioIcon className={`w-8 h-8 ${selectedScenario.type === "success" ? "text-green-400" : "text-red-400"}`} />
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {selectedScenario.name}
                  </h2>
                  <p className="text-sm text-slate-300 mt-1">
                    {selectedScenario.description}
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                disabled={isSimulating}
                className="px-6 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                data-testid="button-reset"
              >
                Reset Simulation
              </button>
            </div>

            {/* SmartContract Display */}
            <SmartContractDisplay scenario={selectedScenario} />

            {/* Test Progress Tracker */}
            <TestProgressTracker
              isActive={isTestExecuting}
              currentStage={currentTestStage}
            />

            {simulationState && (
              <>
                <WorkflowVisualization
                  modules={simulationState.modules}
                  currentModule={simulationState.currentModule}
                  data-testid="workflow-visualization"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <LogOutput
                      logs={simulationState.logs}
                      isSimulating={isSimulating}
                      data-testid="log-output"
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Test Details</h3>
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Contract ID:</span>
                          <span className="text-orange-500 font-mono ml-2">{selectedScenario.contractId}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Part ID:</span>
                          <span className="text-white font-mono ml-2">{selectedScenario.partId}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Operator:</span>
                          <span className="text-white ml-2">{selectedScenario.operatorName}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Station:</span>
                          <span className="text-white ml-2">{selectedScenario.stationId}</span>
                        </div>
                      </div>
                    </div>

                    {simulationState.metrics && (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Metrics</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Ledger Entries:</span>
                            <span className="text-white">{simulationState.metrics.ledgerCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Broadcasts:</span>
                            <span className="text-white">{simulationState.metrics.broadcastCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Alerts:</span>
                            <span className="text-white">{simulationState.metrics.alertCount}</span>
                          </div>
                          {simulationState.metrics.duration > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Duration:</span>
                              <span className="text-white">{simulationState.metrics.duration.toFixed(1)}s</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Show ready state when scenario is selected but simulation hasn't started */}
            {!simulationState && !isSimulating && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Ready to Run</h3>
                <div className="p-4 bg-slate-950 rounded border border-zinc-700">
                  <h4 className="text-orange-500 font-semibold mb-2">Demo Ready</h4>
                  <p className="text-slate-300 text-sm">
                    This scenario will demonstrate the complete SMART testing workflow with real-time WebSocket updates, 
                    module status tracking, and blockchain ledger integration.
                  </p>
                  <p className="text-slate-400 text-xs mt-2">
                    Click "Run Scenario" in the card above to start the live simulation.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}