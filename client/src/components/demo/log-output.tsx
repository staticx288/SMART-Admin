import { type LogEntry } from "../../../../shared/demo-schema";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

interface LogOutputProps {
  logs: LogEntry[];
  isSimulating: boolean;
  "data-testid"?: string;
}

export function LogOutput({ logs, isSimulating, "data-testid": dataTestId }: LogOutputProps) {
  const getLogIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getLogTextColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-gray-300";
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6" data-testid={dataTestId}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">System Log</h3>
        {isSimulating && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Live</span>
          </div>
        )}
      </div>
      
      <div className="h-96 overflow-y-auto">
        <div className="space-y-2 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No logs yet. Start a simulation to see the SMART module workflow.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-2 ${getLogTextColor(log.type)}`}
                style={{ paddingLeft: `${log.indent * 16}px` }}
              >
                <span className="text-gray-500 text-xs mt-0.5 min-w-[80px]">
                  {log.timestamp}
                </span>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getLogIcon(log.type)}
                  <span className="text-orange-500 text-xs min-w-[100px]">
                    [{log.module}]
                  </span>
                  <span className="break-words">{log.message}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}