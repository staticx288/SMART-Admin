# SMART-Compliance SmartContract Examples

## Overview
SMART-Compliance contracts are **simple process checklists** that get loaded and displayed on the dashboard. Compliance verifies steps are complete before dashboard continues to next section. These are just the **process steps** - no complex logic needed.

---

## Example 1: LP Green Dye Pre-Test Checklist

```yaml
# SMART-Compliance Contract
# Simple checklist - Dashboard loads it, tech verifies steps

smart_contract_id: "LP-Checklist-Green"
contract_type: "SmartCompliance"
created_date: "2025-01-15"
created_by: "USR-QA-001"
status: "active"

title: "LP Green Dye Pre-Test Checklist"
description: "Pre-test verification steps for LP Type I Method D"

# Just the steps - Dashboard will display them
checklist_steps:
  
  - step: 1
    description: "Verify penetrant batch number and expiration"
    input_type: "text" # Tech enters batch number
    requires_photo: true
    
  - step: 2
    description: "Verify developer batch number and expiration"
    input_type: "text"
    requires_photo: true
    
  - step: 3
    description: "Check UV light intensity at 15 inches"
    input_type: "number"
    unit: "µW/cm²"
    reference_value: "minimum 1000"
    
  - step: 4
    description: "Verify water wash pressure"
    input_type: "number"
    unit: "PSI"
    reference_value: "maximum 40"
    
  - step: 5
    description: "Check drying oven temperature"
    input_type: "number"
    unit: "°F"
    reference_value: "140-200"
    
  - step: 6
    description: "Confirm ventilation system operational"
    input_type: "checkbox"
    
  - step: 7
    description: "Verify part number matches work order"
    input_type: "text"
    requires_photo: true
```

---

## Example 2: MPI Daily Equipment Check

```yaml
smart_contract_id: "MPI-Daily-Check"
contract_type: "SmartCompliance"
created_date: "2025-01-15"
status: "active"

title: "MPI Daily Equipment Verification"
description: "Daily checks before MPI operations"

checklist_steps:
  
  - step: 1
    description: "Yoke lifting power test result"
    input_type: "number"
    unit: "lbs"
    reference_value: "minimum 10"
    
  - step: 2
    description: "UV light intensity reading"
    input_type: "number"
    unit: "µW/cm²"
    reference_value: "minimum 1000"
    
  - step: 3
    description: "Particle bath concentration"
    input_type: "number"
    unit: "ml/100ml"
    reference_value: "1.2-2.4"
    
  - step: 4
    description: "Particle suspension batch number"
    input_type: "text"
    requires_photo: true
    
  - step: 5
    description: "Yoke cables condition check"
    input_type: "checkbox"
    note: "No exposed wiring or damage"
```

---

## Example 3: Chemical Processing Environment Check

```yaml
smart_contract_id: "CP-Environment-Daily"
contract_type: "SmartCompliance"
created_date: "2025-01-16"
status: "active"

title: "Chemical Processing Daily Environment Check"
description: "Daily environmental compliance verification"

checklist_steps:
  
  - step: 1
    description: "Ventilation airflow measurement"
    input_type: "number"
    unit: "CFM"
    reference_value: "minimum 100"
    
  - step: 2
    description: "VOC levels check"
    input_type: "number"
    unit: "ppm"
    reference_value: "below OSHA PEL"
    
  - step: 3
    description: "Waste containers labeled properly"
    input_type: "checkbox"
    requires_photo: true
    
  - step: 4
    description: "Emergency shower/eyewash functional"
    input_type: "checkbox"
```

---

## Example 4: Welding Pre-Operation Check

```yaml
smart_contract_id: "Weld-PreOp-Check"
contract_type: "SmartCompliance"
created_date: "2025-01-16"
status: "active"

title: "Welding Pre-Operation Checklist"
description: "Safety and equipment verification before welding"

checklist_steps:
  
  - step: 1
    description: "Verify wire/rod batch and type"
    input_type: "text"
    note: "Must match procedure"
    
  - step: 2
    description: "Gas pressure reading"
    input_type: "number"
    unit: "PSI"
    reference_value: "per procedure spec"
    
  - step: 3
    description: "Confirm adequate ventilation"
    input_type: "checkbox"
    
  - step: 4
    description: "PPE verification complete"
    input_type: "checkbox"
    note: "Helmet, gloves, jacket, boots"
    
  - step: 5
    description: "Fire watch assigned if required"
    input_type: "checkbox"
```

---

## How It Works

### In the ClientSmartPO:
```yaml
tests:
  - name: "LP Penetrant Inspection"
    compliance: "LP-Checklist-Green"
    compliance_conditions:
      - "must-complete-before-test"
      - "verify-penetrant-batch"
```

### What Happens:
1. **Dashboard loads** the "LP-Checklist-Green" contract
2. **Displays the steps** to the technician
3. **Tech fills in** measurements, batch numbers, checks boxes
4. **Compliance verifies** all steps complete before dashboard continues (that's the "must-complete-before-test" condition)
5. **Everything logged** to SMART-Ledger automatically

### That's It!
- No complex logic in the contract
- Just simple steps
- Dashboard displays, Compliance verifies completion
- SMART-Ledger logs everything
- Clean, simple, fast ✅
