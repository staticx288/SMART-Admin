import { useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";

interface TestStageProgress {
  stage: string;
  description: string;
  actualTime: string;
  demoTime: number; // in seconds
  isActive: boolean;
  isCompleted: boolean;
}

interface TestProgressTrackerProps {
  isActive: boolean;
  currentStage?: string;
}

const LP_TEST_STAGES: TestStageProgress[] = [
  {
    stage: "pre-cleaning",
    description: "Pre-cleaning part surface",
    actualTime: "2-3 minutes",
    demoTime: 2.5,
    isActive: false,
    isCompleted: false
  },
  {
    stage: "penetrant-application", 
    description: "Applying penetrant solution",
    actualTime: "1-2 minutes",
    demoTime: 3.5,
    isActive: false,
    isCompleted: false
  },
  {
    stage: "penetrant-dwell",
    description: "Penetrant dwell time (Critical)",
    actualTime: "5-10 minutes",
    demoTime: 10,
    isActive: false,
    isCompleted: false
  },
  {
    stage: "excess-removal",
    description: "Removing excess penetrant", 
    actualTime: "2-3 minutes",
    demoTime: 4.5,
    isActive: false,
    isCompleted: false
  },
  {
    stage: "developer-application",
    description: "Applying developer",
    actualTime: "1-2 minutes", 
    demoTime: 3.5,
    isActive: false,
    isCompleted: false
  },
  {
    stage: "developer-development",
    description: "Developer development time (Critical)",
    actualTime: "3-7 minutes",
    demoTime: 8,
    isActive: false,
    isCompleted: false
  },
  {
    stage: "uv-inspection",
    description: "Visual inspection under UV light",
    actualTime: "2-4 minutes",
    demoTime: 5,
    isActive: false,
    isCompleted: false
  },
  {
    stage: "results-recording",
    description: "Recording inspection results",
    actualTime: "1-2 minutes",
    demoTime: 2.5,
    isActive: false,
    isCompleted: false
  }
];

export function TestProgressTracker({ isActive, currentStage }: TestProgressTrackerProps) {
  const [stages, setStages] = useState<TestStageProgress[]>(LP_TEST_STAGES);

  useEffect(() => {
    if (!isActive && !currentStage) {
      // Reset all stages
      setStages(LP_TEST_STAGES.map(stage => ({ ...stage, isActive: false, isCompleted: false })));
      return;
    }

    if (currentStage) {
      setStages(prevStages => {
        const newStages = [...prevStages];
        
        // Special case: if test is completed, mark all stages as completed
        if (currentStage.includes("✅ Test completed successfully") || 
            currentStage.includes("Test completed successfully") ||
            currentStage.includes("Total Process Time") ||
            currentStage.includes("LIQUID_PENETRANT_TEST_COMPLETE") ||
            currentStage.includes("Test completed - all stages finished")) {
          for (let i = 0; i < newStages.length; i++) {
            newStages[i].isCompleted = true;
            newStages[i].isActive = false;
          }
          return newStages;
        }
        
        // Determine which stage is currently active based on the log message
        let activeStageIndex = -1;
        
        if (currentStage.includes("Stage 1") || currentStage.includes("Pre-cleaning part surface")) {
          activeStageIndex = 0;
        } else if (currentStage.includes("Stage 2") || currentStage.includes("Applying penetrant solution")) {
          activeStageIndex = 1;
        } else if (currentStage.includes("Stage 3") || currentStage.includes("Penetrant dwell time")) {
          activeStageIndex = 2;
        } else if (currentStage.includes("Stage 4") || currentStage.includes("Removing excess penetrant")) {
          activeStageIndex = 3;
        } else if (currentStage.includes("Stage 5") || currentStage.includes("Applying developer")) {
          activeStageIndex = 4;
        } else if (currentStage.includes("Stage 6") || currentStage.includes("Developer development time")) {
          activeStageIndex = 5;
        } else if (currentStage.includes("Stage 7") || currentStage.includes("Visual inspection under UV")) {
          activeStageIndex = 6;
        } else if (currentStage.includes("Stage 8") || currentStage.includes("Recording inspection results")) {
          activeStageIndex = 7;
        }
        
        if (activeStageIndex >= 0) {
          // Mark previous stages as completed
          for (let i = 0; i < activeStageIndex; i++) {
            newStages[i].isCompleted = true;
            newStages[i].isActive = false;
          }
          
          // Mark current stage as active
          if (activeStageIndex < newStages.length) {
            newStages[activeStageIndex].isActive = true;
            newStages[activeStageIndex].isCompleted = false;
          }
          
          // Mark future stages as not active/completed
          for (let i = activeStageIndex + 1; i < newStages.length; i++) {
            newStages[i].isActive = false;
            newStages[i].isCompleted = false;
          }
        }
        
        // Special handling: if we see stage 8 completion or any completion message, mark all as done
        if (currentStage.includes("Stage 8") && !currentStage.includes("(Actual:")) {
          // This means stage 8 is completed, mark all as completed
          for (let i = 0; i < newStages.length; i++) {
            newStages[i].isCompleted = true;
            newStages[i].isActive = false;
          }
        }
        
        return newStages;
      });
    }
  }, [isActive, currentStage]);

  const totalActualTime = "15-20 minutes";
  const totalDemoTime = stages.reduce((sum, stage) => sum + stage.demoTime, 0);
  const completedStages = stages.filter(stage => stage.isCompleted).length;
  const overallProgress = (completedStages / stages.length) * 100;

  // Always show the component when simulation is active
  if (!isActive && completedStages === 0 && !currentStage) {
    return (
      <div className="w-full bg-zinc-900 border border-zinc-700 rounded-lg">
        <div className="p-4 border-b border-zinc-700">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              🔬 Liquid Penetrant Test Progress
            </h3>
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Actual: 15-20 minutes</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                <span>Demo: ~40s (20x speed)</span>
              </div>
            </div>
          </div>
          <div className="mt-3 bg-zinc-800 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `0%` }}
            />
          </div>
        </div>
        <div className="p-4">
          <div className="text-center text-zinc-400 py-4">
            Progress tracker will appear during test execution phase
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-900 border border-zinc-700 rounded-lg">
      <div className="p-4 border-b border-zinc-700">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            🔬 Liquid Penetrant Test Progress
          </h3>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Actual: {totalActualTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span>Demo: ~{Math.round(totalDemoTime)}s (20x speed)</span>
            </div>
          </div>
        </div>
        <div className="mt-3 bg-zinc-800 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>
      <div className="p-4 space-y-3">
        {stages.map((stage, index) => (
          <div
            key={stage.stage}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              stage.isCompleted
                ? "bg-green-900/30 border-green-600 text-green-300"
                : stage.isActive
                ? "bg-blue-900/30 border-blue-600 text-blue-300"
                : "bg-zinc-800/50 border-zinc-700 text-zinc-400"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  stage.isCompleted
                    ? "bg-green-600 text-white"
                    : stage.isActive
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-700 text-zinc-400"
                }`}
              >
                {stage.isCompleted ? "✓" : index + 1}
              </div>
              <div>
                <div className="font-medium">{stage.description}</div>
                <div className="text-xs text-zinc-500">
                  Stage {index + 1} of {stages.length}
                </div>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-medium">Real: {stage.actualTime}</div>
              <div className="text-zinc-500">Demo: {stage.demoTime}s</div>
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-amber-900/30 border border-amber-600 rounded-lg">
          <div className="flex items-center gap-2 text-amber-300">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">
              ⚡ Demo Speed: Time has been accelerated 20x for demonstration purposes
            </span>
          </div>
          <div className="text-xs text-amber-400 mt-1">
            Actual NDT process requires proper dwell times for accurate defect detection
          </div>
        </div>
      </div>
    </div>
  );
}