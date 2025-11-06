export type TestStatus = "pending" | "active" | "success" | "failed" | "blocked";
export type ModuleStatus = "pending" | "active" | "success" | "failed" | "skipped";
export type AlertSeverity = "low" | "medium" | "high" | "critical" | "emergency";

export interface Scenario {
  id: string;
  name: string;
  description: string;
  type: "success" | "error";
  icon: string;
  contractId: string;
  partId: string;
  operatorName: string;
  operatorId: string;
  stationId: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  module: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
  icon: string;
  indent: number;
}

export interface LedgerEntry {
  id: string;
  timestamp: string;
  module: string;
  action: string;
  smartId: string;
  contractId: string;
  hashSignature: string;
}

export interface Broadcast {
  id: string;
  timestamp: string;
  type: "info" | "alert";
  severity: AlertSeverity;
  message: string;
}

export interface ModuleState {
  name: string;
  displayName: string;
  icon: string;
  status: ModuleStatus;
  startTime?: string;
  endTime?: string;
}

export interface SimulationState {
  scenarioId: string;
  status: TestStatus;
  currentModule?: string;
  modules: ModuleState[];
  logs: LogEntry[];
  ledgerEntries: LedgerEntry[];
  broadcasts: Broadcast[];
  metrics: {
    ledgerCount: number;
    broadcastCount: number;
    alertCount: number;
    duration: number;
  };
  contractInfo?: {
    contractId: string;
    partId: string;
    operatorName: string;
    operatorId: string;
    stationId: string;
    testType: string;
  };
}

export interface WebSocketMessage {
  type: "state" | "log" | "ledger" | "broadcast" | "moduleUpdate" | "complete";
  data: any;
}

export const scenarios: Scenario[] = [
  {
    id: "complete-success",
    name: "Complete Success",
    description: "Full workflow with all validations passing",
    type: "success",
    icon: "CheckCircle",
    contractId: "SC-2025-001-LP",
    partId: "PART-ABC-12345",
    operatorName: "John Technician",
    operatorId: "USR-TECH-001",
    stationId: "LP-Station-A2",
  },
  {
    id: "wrong-contract-type",
    name: "Wrong Contract Type",
    description: "RT contract at LP station - capability mismatch",
    type: "error",
    icon: "XCircle",
    contractId: "SC-2025-002-RT",
    partId: "PART-XYZ-67890",
    operatorName: "Jane Technician",
    operatorId: "USR-TECH-002",
    stationId: "LP-Station-A2",
  },
  {
    id: "missing-certifications",
    name: "Missing Certifications",
    description: "Operator lacks required certifications",
    type: "error",
    icon: "Ban",
    contractId: "SC-2025-003-LP",
    partId: "PART-DEF-11111",
    operatorName: "Bob Novice",
    operatorId: "USR-TECH-003",
    stationId: "LP-Station-A2",
  },
  {
    id: "wrong-part",
    name: "Wrong Part",
    description: "Part verification failure - mismatch detected",
    type: "error",
    icon: "AlertTriangle",
    contractId: "SC-2025-004-LP",
    partId: "PART-WRONG-88888",
    operatorName: "Carol Expert",
    operatorId: "USR-TECH-004",
    stationId: "LP-Station-A2",
  },
  {
    id: "missing-standards",
    name: "Missing Standards",
    description: "Station missing required SmartContracts",
    type: "error",
    icon: "FileX",
    contractId: "SC-2025-005-LP",
    partId: "PART-GHI-22222",
    operatorName: "Dave Qualified",
    operatorId: "USR-TECH-005",
    stationId: "LP-Station-A2",
  },
  {
    id: "safety-token-failure",
    name: "Safety Token Failure",
    description: "Operator missing required safety tokens",
    type: "error",
    icon: "ShieldAlert",
    contractId: "SC-2025-006-LP",
    partId: "PART-JKL-33333",
    operatorName: "Eve Uncertified",
    operatorId: "USR-TECH-006",
    stationId: "LP-Station-A2",
  },
];