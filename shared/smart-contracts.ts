// Mock SmartClientPO contracts for demo dashboard

export interface SmartContractTest {
  name: string;
  sp: string;
  sp_description: string;
  standard: string;
  standard_conditions: string[];
  compliance: string;
  compliance_conditions: string[];
  required_certs: string[];
  maintenance: string;
  maintenance_conditions?: string[];
}

export interface SmartClientPO {
  id: string;
  client: string;
  part_number: string;
  part_description: string;
  test_type: string;
  priority: string;
  tests: SmartContractTest[];
}

export const mockSmartContracts: Record<string, SmartClientPO> = {
  "SC-2025-001-LP": {
    id: "SC-2025-001-LP",
    client: "Aerospace Dynamics Corp",
    part_number: "PART-ABC-12345",
    part_description: "Turbine Blade Housing - Critical Component",
    test_type: "Liquid Penetrant (LP)",
    priority: "Standard",
    tests: [{
      name: "LP Penetrant Inspection",
      sp: "SP-LP-ST-001",
      sp_description: "Standard LP Surface Treatment Procedure",
      standard: "STD-LP-ASTM-E1417",
      standard_conditions: [
        "validate-temp-humidity-live",
        "require-acknowledgement"
      ],
      compliance: "LP-Checklist-Green",
      compliance_conditions: [
        "must-complete-before-test",
        "verify-penetrant-batch"
      ],
      required_certs: ["ASNT-PT-II", "NADCAP-7114"],
      maintenance: "MAINT-LP-DAILY",
      maintenance_conditions: [
        "check-equipment-calibration"
      ]
    }]
  },

  "SC-2025-002-RT": {
    id: "SC-2025-002-RT",
    client: "DefenseTech Industries",
    part_number: "PART-XYZ-67890",
    part_description: "Missile Guidance Housing - Class A",
    test_type: "Radiographic Testing (RT)",
    priority: "High",
    tests: [{
      name: "RT X-Ray Inspection",
      sp: "SP-RT-RAD-002",
      sp_description: "Digital Radiography Procedure",
      standard: "STD-RT-ASTM-E1742",
      standard_conditions: [
        "validate-radiation-safety",
        "require-rso-approval"
      ],
      compliance: "RT-Checklist-Red",
      compliance_conditions: [
        "must-complete-before-test",
        "verify-film-quality"
      ],
      required_certs: ["ASNT-RT-III", "RSO-License"],
      maintenance: "MAINT-RT-WEEKLY"
    }]
  },

  "SC-2025-003-LP": {
    id: "SC-2025-003-LP",
    client: "Marine Systems Ltd",
    part_number: "PART-DEF-11111",
    part_description: "Submarine Hull Section - Critical Weld",
    test_type: "Liquid Penetrant (LP)",
    priority: "Critical",
    tests: [{
      name: "LP Critical Weld Inspection",
      sp: "SP-LP-WELD-003",
      sp_description: "Critical Weld LP Inspection Protocol",
      standard: "STD-LP-AWS-D1.1",
      standard_conditions: [
        "validate-limits-live",
        "require-level-3-review"
      ],
      compliance: "LP-Checklist-Critical",
      compliance_conditions: [
        "must-complete-before-test",
        "verify-critical-weld-prep"
      ],
      required_certs: ["ASNT-PT-III", "AWS-CWI", "NADCAP-Advanced"],
      maintenance: "MAINT-LP-CRITICAL"
    }]
  },

  "SC-2025-004-LP": {
    id: "SC-2025-004-LP",
    client: "Advanced Materials Inc",
    part_number: "PART-WRONG-88888",
    part_description: "Titanium Alloy Component",
    test_type: "Liquid Penetrant (LP)",
    priority: "Standard",
    tests: [{
      name: "LP Surface Inspection",
      sp: "SP-LP-TI-004",
      sp_description: "Titanium LP Inspection Procedure",
      standard: "STD-LP-ASTM-E165",
      standard_conditions: [
        "validate-temp-humidity-live"
      ],
      compliance: "LP-Checklist-Standard",
      compliance_conditions: [
        "must-complete-before-test"
      ],
      required_certs: ["ASNT-PT-II"],
      maintenance: "MAINT-LP-STANDARD"
    }]
  },

  "SC-2025-005-LP": {
    id: "SC-2025-005-LP",
    client: "Space Systems Corp",
    part_number: "PART-GHI-22222",
    part_description: "Satellite Component - Space Grade",
    test_type: "Liquid Penetrant (LP)",
    priority: "Critical",
    tests: [{
      name: "LP Space-Grade Inspection",
      sp: "SP-LP-SPACE-005",
      sp_description: "NASA Space-Grade LP Procedure",
      standard: "STD-LP-NASA-SPEC",
      standard_conditions: [
        "validate-space-grade-requirements",
        "require-nasa-approval"
      ],
      compliance: "LP-Checklist-NASA",
      compliance_conditions: [
        "must-complete-before-test",
        "verify-clean-room-conditions"
      ],
      required_certs: ["ASNT-PT-II", "NASA-Qualified", "Clean-Room-Cert"],
      maintenance: "MAINT-LP-SPACE"
    }]
  },

  "SC-2025-006-LP": {
    id: "SC-2025-006-LP",
    client: "Industrial Manufacturing",
    part_number: "PART-JKL-33333",
    part_description: "Standard Industrial Component",
    test_type: "Liquid Penetrant (LP)",
    priority: "Standard",
    tests: [{
      name: "LP Standard Inspection",
      sp: "SP-LP-STD-006",
      sp_description: "Standard Industrial LP Procedure",
      standard: "STD-LP-ASTM-E165",
      standard_conditions: [
        "validate-temp-humidity-live"
      ],
      compliance: "LP-Checklist-Standard",
      compliance_conditions: [
        "must-complete-before-test"
      ],
      required_certs: ["SafetyCertified", "ASNT-PT-I"],
      maintenance: "MAINT-LP-STANDARD"
    }]
  }
};

export function getSmartContract(contractId: string): SmartClientPO | null {
  return mockSmartContracts[contractId] || null;
}

export function getComplianceDisplayName(compliance: string): string {
  const complianceNames: Record<string, string> = {
    "LP-Checklist-Green": "Standard LP Checklist (Green)",
    "RT-Checklist-Red": "Critical RT Checklist (Red)",
    "LP-Checklist-Critical": "Critical LP Checklist",
    "LP-Checklist-Standard": "Standard LP Checklist",
    "LP-Checklist-NASA": "NASA Space-Grade Checklist"
  };
  
  return complianceNames[compliance] || compliance;
}