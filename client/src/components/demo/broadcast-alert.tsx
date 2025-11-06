import { useEffect, useState } from "react";
import { type Broadcast } from "../../../../shared/demo-schema";
import { X, AlertTriangle, Info, AlertCircle } from "lucide-react";

interface BroadcastAlertProps {
  broadcast: Broadcast;
  onDismiss: () => void;
  "data-testid"?: string;
}

export function BroadcastAlert({ broadcast, onDismiss, "data-testid": dataTestId }: BroadcastAlertProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    if (broadcast.type === "info" || broadcast.severity === "low") {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [broadcast, onDismiss]);

  const getSeverityConfig = () => {
    switch (broadcast.severity) {
      case "critical":
      case "emergency":
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          bgColor: "bg-red-900/50",
          borderColor: "border-red-400",
          textColor: "text-red-400",
        };
      case "high":
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: "bg-red-900/30",
          borderColor: "border-red-500",
          textColor: "text-red-400",
        };
      case "medium":
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: "bg-yellow-900/30",
          borderColor: "border-yellow-500",
          textColor: "text-yellow-400",
        };
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          bgColor: "bg-blue-900/30",
          borderColor: "border-blue-500",
          textColor: "text-blue-400",
        };
    }
  };

  const config = getSeverityConfig();

  return (
    <div
      className={`p-4 border-2 ${config.borderColor} ${config.bgColor} bg-zinc-900 rounded-lg transition-all duration-300 transform ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
      data-testid={dataTestId}
    >
      <div className="flex items-start gap-3">
        <div className={config.textColor}>{config.icon}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className={`text-xs font-medium uppercase tracking-wider ${config.textColor}`}>
              {broadcast.type === "alert" ? broadcast.severity : "Info"}
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className="hover:bg-zinc-700 rounded p-1 transition-colors"
              data-testid="button-dismiss-alert"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <p className="text-sm text-white">{broadcast.message}</p>
          
          <div className="text-xs text-gray-400 font-mono mt-2">
            {broadcast.timestamp}
          </div>
        </div>
      </div>
    </div>
  );
}