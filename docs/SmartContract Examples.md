SMART-ClientPO

SMART-ClientPO Example

smart_contract_id: SC-2025-001-LP
client: "Aerospace Dynamics Corp"
smart_client_id: "CLI-20235"
part_number: "PART-ABC-12345"
part_description: "Turbine Blade Housing - Critical Component"
test_type: "Liquid Penetrant (LP) – Type I, Method D"
material_type: "Inconel 718"
priority: "Standard"
created_date: "2025-01-13"
required_certs: 
  - "NDT_Level_2"
  - "LP_Certified" 
  - "hazmat_certified"
qr_code: "QR-SC-001-LP-78B9"
reference_images: 
  - "ref_turbine_blade_001.jpg"
  - "ref_turbine_blade_002.jpg"
quantity: "10 Units"
tests:
  - name: "LP Penetrant Inspection"
    compliance: "LP-Checklist-Green"
    compliance_conditions:
      - "must-complete-before-test"
      - "verify-penetrant-batch"
    standard: "ASTM E165 Rev. Q"
    standard_conditions: 
      - "standard-document-available"
      - "technician-acknowledgment-required"
      - "reference-accessible-during-test"
    maintenance: "MAINT-LP-DAILY"
    maintenance_conditions:
      - "check-equipment-calibration"
    safety: "SF-LP-ENV-001"
    safety_conditions:
      - "validate-ventilation-airflow"
      - "monitor-chemical-exposure-limits"
      - "ensure-emergency-shower-access"
    inspection_scope: 
      - "Complete surface inspection of entire housing"
      - "Focus on cooling vent interfaces and inner ring welds"  
      - "Check for cracks, laps, and porosity"
    sp: "SP-LP-ST-001"
    sp_description: "Standard LP Surface Treatment Procedure"
    acceptance_criteria: "no-linear-indications-permitted"
    max_indications_size: "0.050-inches"
    total_indications_area: "must-not-exceed-0.15-in²"
    indication_within_cooling_vent_region: "zero-tolerance"
    QA: "QA-LP-TEST-001"
    QA_conditions:
      - "test_procedure_adherence"
      - "result_accuracy"

