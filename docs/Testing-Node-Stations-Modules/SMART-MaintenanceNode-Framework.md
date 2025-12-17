# 🔧 SMART-MaintenanceNode Framework

**SmartMaintenance Contract Executor. Tool Calibration. Equipment Care. Immutable Logging.**

SMART-MaintenanceNode is a **module component** running on every testing node to **execute SmartMaintenance contracts** for tool calibration and equipment maintenance. Once loaded with SmartMaintenance contracts from MaintenanceHub, this module executes maintenance contract logic autonomously with zero dependencies.

---

## 🌐 Core Functions

### **SmartMaintenance Contract Execution**
- Executes SmartMaintenance contracts linked to active SmartClientPOs
- Enforces maintenance conditions for tool calibration and equipment readiness
- Validates equipment calibration status before testing operations
- Provides immediate feedback on equipment maintenance requirements

### **Tool Calibration Management**
- Monitors calibration schedules and validation requirements per SmartMaintenance contracts
- Tracks calibration certificates and equipment certification status
- Validates tool accuracy and measurement precision according to contract specifications
- Ensures equipment meets calibration requirements before test execution

### **Equipment Maintenance Validation**
- Executes equipment maintenance checks as defined in SmartMaintenance contracts
- Validates equipment operational status and maintenance compliance
- Monitors equipment condition against SmartMaintenance contract requirements
- Documents equipment readiness and maintenance compliance status

### **SmartMaintenance Contract Logging**
- Logs every SmartMaintenance contract execution and calibration validation to `SMART-Ledger`
- Creates tamper-proof audit trail of equipment maintenance and calibration actions
- Documents maintenance contract decisions with full context and contract reference
- Maintains immutable record of tool calibration and equipment maintenance history

---

## 🛡️ Security & Governance

- **Autonomous operation** - manages maintenance without external dependencies
- **Immutable logging** - all maintenance actions logged to blockchain
- **Protocol-based maintenance** - operates using deployed maintenance frameworks
- **Zero external calls** - no network dependencies during maintenance operations
- **Alert escalation only** - reports critical issues via AlertBroadcast

### SmartMaintenance Contract Loading
- This module receives SmartMaintenance contracts from SMART-MaintenanceHub
- Loads calibration requirements and maintenance validation rules locally
- Executes using deployed SmartMaintenance contracts as part of node ecosystem

---

## 📊 Equipment Maintenance Analytics

### **Tool Calibration Metrics**
- Real-time calibration status monitoring and reporting
- Calibration compliance tracking and validation
- Equipment readiness assessment and verification
- Tool accuracy and precision measurement tracking

### **Maintenance Contract Reporting**
- Automated generation of equipment maintenance reports from ledger data
- Real-time calibration status dashboard
- Maintenance contract execution tracking and compliance monitoring
- Audit-ready calibration and maintenance documentation

---

## 🔌 Integration

**Target Environment**: Every Testing Node (Module component - part of 13+ module ecosystem)
**Runtime**: Continuous real-time asset monitoring and maintenance management
**Integration**: MaintenanceHub (contract deployment), SMART-Ledger, AlertBroadcast

---

## 📈 Module Benefits

- **Autonomous maintenance** - asset care without network dependencies
- **Real-time monitoring** - immediate asset health feedback as part of node ecosystem
- **Immutable history** - blockchain-based maintenance documentation
- **Integrated operation** - maintenance validation seamlessly integrated with other node modules
- **Zero downtime operations** - maintenance continues as part of autonomous node operation

---

## 🔄 Equipment Maintenance Workflow

1. **SmartMaintenance Contract Loading** - Receive SmartMaintenance contracts from MaintenanceHub
2. **ClientSmartPO Linking** - Link SmartMaintenance contracts to active testing SmartClientPOs
3. **Calibration Validation** - Execute tool calibration checks per contract requirements
4. **Equipment Readiness** - Validate equipment maintenance status before testing
5. **Immutable Logging** - Document all maintenance contract executions in SMART-Ledger
6. **Alert Generation** - Escalate critical calibration or maintenance issues via AlertBroadcast

---

## 🎯 Operational Advantages

- **Point-of-testing maintenance** - calibration validated at each testing node by this module
- **Node-integrated operation** - maintenance validation runs as part of node ecosystem
- **Immutable documentation** - tamper-proof calibration and maintenance evidence
- **Real-time validation** - immediate equipment readiness feedback for operators
- **Module-level operation** - one of 13+ modules ensuring complete node functionality

---

## � Architecture

### File: `SMART_maintenance_node.py`

* **Class**: `SmartMaintenanceNode`
* **Core Methods**:

  * `load_maintenance_contracts()` - Load SmartMaintenance contracts from deployment
  * `link_contract_to_clientpo()` - Link maintenance requirements to testing job
  * `validate_equipment_calibration()` - Check calibration status before testing
  * `execute_maintenance_check()` - Run equipment maintenance validation
  * `check_calibration_expiry()` - Monitor calibration certificate expiration
  * `record_calibration_event()` - Log calibration completion or updates
  * `generate_maintenance_alert()` - Escalate critical equipment issues
  * `get_equipment_status()` - Query equipment readiness for dashboard

### SmartMaintenance Contract Execution Workflow Example

```python
# Example: Validate equipment calibration before LP testing

1. Testing node prepares to execute LP test for part SC-2025-001-LP
2. MaintenanceNode loads linked SmartMaintenance contracts:
   - Equipment calibration requirements (penetrant inspection light)
   - Tool validation requirements (digital thermometer)
   - Maintenance schedule compliance
3. MaintenanceNode validates calibration status:
   - Inspection light last calibrated: 2024-11-15 (90 days ago)
   - Calibration interval: 180 days
   - Status: CURRENT (90 days remaining)
4. MaintenanceNode checks thermometer calibration:
   - Last calibration: 2024-06-10 (190 days ago)
   - Calibration interval: 180 days
   - Status: EXPIRED (10 days overdue)
5. MaintenanceNode blocks testing until thermometer recalibrated
6. Alert generated via AlertBroadcast: "Calibration expired - NODE-LP-001"
7. Operator initiates calibration, certificate recorded
8. MaintenanceNode validates new calibration, updates status
9. Testing operations unlocked, all equipment current
10. Complete maintenance validation logged to SMART-Ledger
```

### Equipment Calibration States

* **current** - Calibration valid, equipment ready for testing
* **expiring_soon** - Within warning period (typically 30 days before expiry)
* **expired** - Past calibration date, testing operations blocked
* **pending_calibration** - Calibration scheduled, awaiting completion
* **calibration_failed** - Calibration attempt unsuccessful
* **out_of_service** - Equipment down for maintenance or repair
* **ready** - All maintenance requirements met, testing approved

### Example Code Structure

```python
from server.smart_ledger import get_ledger
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
import yaml
from pathlib import Path

class SmartMaintenanceNode:
    def __init__(self, node_id: str, station_type: str):
        self.node_id = node_id
        self.station_type = station_type
        self.loaded_contracts = {}
        self.equipment_status = {}
        self.calibration_records = {}
        
        # Get ledger instance - reports maintenance actions, doesn't write directly
        self.ledger = get_ledger("maintenance_node")
        
        # Local contract storage (deployed from MaintenanceHub)
        self.contract_path = Path("/opt/smart/maintenance-contracts")
        
        # Equipment tracking storage
        self.equipment_data_path = Path("/opt/smart/equipment-data")
        self.equipment_data_path.mkdir(parents=True, exist_ok=True)
    
    def load_maintenance_contracts(self, contract_ids: List[str] = None) -> Dict[str, dict]:
        """
        Load SmartMaintenance contracts from deployed location
        Returns dict of loaded contracts by contract_id
        """
        loaded = {}
        
        # If no specific contracts requested, load all for this station type
        if not contract_ids:
            contract_files = self.contract_path.glob(f"{self.station_type}-*.yaml")
        else:
            contract_files = [self.contract_path / f"{cid}.yaml" for cid in contract_ids]
        
        for contract_file in contract_files:
            if contract_file.exists():
                with open(contract_file, 'r') as f:
                    contract = yaml.safe_load(f)
                    contract_id = contract['smart_contract_id']
                    loaded[contract_id] = contract
                    self.loaded_contracts[contract_id] = contract
                    
                    # Initialize equipment tracking from contract
                    self._initialize_equipment_tracking(contract)
        
        # Report contract loading to SMART-Ledger
        self.ledger.record_action(
            action_type="maintenance",
            action="load_contracts",
            target=self.node_id,
            details=f"Loaded {len(loaded)} maintenance contracts",
            user_id="system",
            smart_id=self.node_id,
            metadata={
                "contract_ids": list(loaded.keys()),
                "station_type": self.station_type
            }
        )
        
        return loaded
    
    def _initialize_equipment_tracking(self, contract: dict):
        """
        Initialize equipment status tracking from maintenance contract
        """
        for equipment in contract.get('equipment_list', []):
            equipment_id = equipment['equipment_id']
            
            if equipment_id not in self.equipment_status:
                self.equipment_status[equipment_id] = {
                    "equipment_id": equipment_id,
                    "description": equipment['description'],
                    "equipment_type": equipment['equipment_type'],
                    "calibration_interval_days": equipment.get('calibration_interval_days', 365),
                    "last_calibration_date": equipment.get('last_calibration_date'),
                    "calibration_certificate": equipment.get('calibration_certificate'),
                    "status": "pending_calibration",
                    "maintenance_schedule": equipment.get('maintenance_schedule', {}),
                    "contract_id": contract['smart_contract_id']
                }
                
                # Update status based on calibration
                if equipment.get('last_calibration_date'):
                    self._update_equipment_status(equipment_id)
    
    def link_contract_to_clientpo(self, clientpo_id: str, equipment_requirements: List[str]):
        """
        Link SmartMaintenance contracts to active testing job
        Validates required equipment calibration before testing
        """
        validation_results = {
            "clientpo_id": clientpo_id,
            "required_equipment": equipment_requirements,
            "validation_checks": [],
            "all_equipment_ready": True
        }
        
        # Validate each required equipment item
        for equipment_id in equipment_requirements:
            equipment = self.equipment_status.get(equipment_id)
            
            if not equipment:
                validation_results['all_equipment_ready'] = False
                validation_results['validation_checks'].append({
                    "equipment_id": equipment_id,
                    "status": "not_found",
                    "ready": False
                })
                continue
            
            # Check calibration status
            calibration_valid = self._check_calibration_validity(equipment_id)
            
            validation_results['validation_checks'].append({
                "equipment_id": equipment_id,
                "description": equipment['description'],
                "status": equipment['status'],
                "calibration_valid": calibration_valid,
                "ready": calibration_valid
            })
            
            if not calibration_valid:
                validation_results['all_equipment_ready'] = False
        
        # Report contract linking to SMART-Ledger
        self.ledger.record_action(
            action_type="maintenance",
            action="link_contracts",
            target=clientpo_id,
            details=f"Maintenance validation: {len(equipment_requirements)} equipment items checked",
            user_id="system",
            smart_id=self.node_id,
            metadata=validation_results
        )
        
        # Generate alerts for equipment not ready
        if not validation_results['all_equipment_ready']:
            self.generate_maintenance_alert({
                "alert_type": "equipment_not_ready",
                "clientpo_id": clientpo_id,
                "validation_results": validation_results
            })
        
        return validation_results
    
    def validate_equipment_calibration(self, equipment_id: str) -> dict:
        """
        Check equipment calibration status before testing operations
        Returns validation result with calibration details
        """
        equipment = self.equipment_status.get(equipment_id)
        
        if not equipment:
            return {
                "valid": False,
                "error": "Equipment not found"
            }
        
        # Check if calibration exists
        if not equipment.get('last_calibration_date'):
            result = {
                "valid": False,
                "equipment_id": equipment_id,
                "reason": "No calibration on record",
                "status": "pending_calibration"
            }
        else:
            # Calculate calibration age
            last_cal_date = datetime.fromisoformat(equipment['last_calibration_date'])
            cal_age_days = (datetime.now(timezone.utc) - last_cal_date).days
            interval = equipment['calibration_interval_days']
            days_remaining = interval - cal_age_days
            
            # Determine validity
            if cal_age_days <= interval:
                # Check if expiring soon (within 30 days)
                if days_remaining <= 30:
                    status = "expiring_soon"
                else:
                    status = "current"
                
                result = {
                    "valid": True,
                    "equipment_id": equipment_id,
                    "description": equipment['description'],
                    "status": status,
                    "last_calibration_date": equipment['last_calibration_date'],
                    "calibration_age_days": cal_age_days,
                    "days_remaining": days_remaining,
                    "calibration_certificate": equipment.get('calibration_certificate')
                }
            else:
                # Calibration expired
                status = "expired"
                result = {
                    "valid": False,
                    "equipment_id": equipment_id,
                    "description": equipment['description'],
                    "status": status,
                    "last_calibration_date": equipment['last_calibration_date'],
                    "calibration_age_days": cal_age_days,
                    "days_overdue": abs(days_remaining),
                    "reason": f"Calibration expired {abs(days_remaining)} days ago"
                }
            
            # Update equipment status
            equipment['status'] = status
        
        # Report calibration validation to SMART-Ledger
        self.ledger.record_action(
            action_type="maintenance",
            action="validate_calibration",
            target=equipment_id,
            details=f"Calibration check: {equipment['description']} - {result.get('status', 'ERROR')}",
            user_id="system",
            smart_id=self.node_id,
            metadata=result
        )
        
        return result
    
    def execute_maintenance_check(self, equipment_id: str, check_type: str) -> dict:
        """
        Run equipment maintenance validation per SmartMaintenance contract
        Returns maintenance check result
        """
        equipment = self.equipment_status.get(equipment_id)
        
        if not equipment:
            return {"success": False, "error": "Equipment not found"}
        
        # Get maintenance contract
        contract = self.loaded_contracts.get(equipment['contract_id'])
        
        if not contract:
            return {"success": False, "error": "Maintenance contract not found"}
        
        # Execute maintenance check based on type
        check_result = {
            "equipment_id": equipment_id,
            "check_type": check_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks_performed": []
        }
        
        # Get check procedures from contract
        maintenance_procedures = contract.get('maintenance_procedures', {})
        check_procedure = maintenance_procedures.get(check_type, {})
        
        for step in check_procedure.get('steps', []):
            step_result = {
                "step": step['description'],
                "status": "completed",
                "notes": ""
            }
            
            # In actual implementation, this would perform real checks
            # For example: sensor readings, visual inspections, etc.
            
            check_result['checks_performed'].append(step_result)
        
        # Determine overall success
        check_result['success'] = all(
            step['status'] == 'completed' 
            for step in check_result['checks_performed']
        )
        
        # Update equipment status
        if check_result['success']:
            equipment['last_maintenance_check'] = check_result['timestamp']
            equipment['last_check_type'] = check_type
        
        # Report maintenance check to SMART-Ledger
        self.ledger.record_action(
            action_type="maintenance",
            action="execute_check",
            target=equipment_id,
            details=f"Maintenance check: {check_type} - {'SUCCESS' if check_result['success'] else 'FAILED'}",
            user_id="system",
            smart_id=self.node_id,
            metadata=check_result
        )
        
        return check_result
    
    def check_calibration_expiry(self):
        """
        Monitor calibration certificate expiration across all equipment
        Generates alerts for expiring or expired calibrations
        """
        today = datetime.now(timezone.utc)
        warning_period = timedelta(days=30)
        
        expiry_report = {
            "check_timestamp": today.isoformat(),
            "node_id": self.node_id,
            "expired_count": 0,
            "expiring_soon_count": 0,
            "current_count": 0,
            "equipment_status": []
        }
        
        for equipment_id, equipment in self.equipment_status.items():
            if not equipment.get('last_calibration_date'):
                continue
            
            last_cal_date = datetime.fromisoformat(equipment['last_calibration_date'])
            cal_age = today - last_cal_date
            interval = timedelta(days=equipment['calibration_interval_days'])
            expiry_date = last_cal_date + interval
            days_until_expiry = (expiry_date - today).days
            
            status_info = {
                "equipment_id": equipment_id,
                "description": equipment['description'],
                "last_calibration": equipment['last_calibration_date'],
                "days_until_expiry": days_until_expiry
            }
            
            # Check if expired
            if days_until_expiry < 0:
                equipment['status'] = "expired"
                expiry_report['expired_count'] += 1
                status_info['status'] = "expired"
                
                # Generate alert for expired calibration
                self.generate_maintenance_alert({
                    "alert_type": "calibration_expired",
                    "equipment_id": equipment_id,
                    "description": equipment['description'],
                    "days_overdue": abs(days_until_expiry)
                })
            
            # Check if expiring soon
            elif days_until_expiry <= 30:
                equipment['status'] = "expiring_soon"
                expiry_report['expiring_soon_count'] += 1
                status_info['status'] = "expiring_soon"
                
                # Generate warning for expiring calibration
                self.generate_maintenance_alert({
                    "alert_type": "calibration_expiring",
                    "equipment_id": equipment_id,
                    "description": equipment['description'],
                    "days_remaining": days_until_expiry
                })
            
            else:
                equipment['status'] = "current"
                expiry_report['current_count'] += 1
                status_info['status'] = "current"
            
            expiry_report['equipment_status'].append(status_info)
        
        # Report expiry check to SMART-Ledger
        self.ledger.record_action(
            action_type="maintenance",
            action="check_expiry",
            target=self.node_id,
            details=f"Calibration expiry check: {expiry_report['expired_count']} expired, {expiry_report['expiring_soon_count']} expiring soon",
            user_id="system",
            smart_id=self.node_id,
            metadata=expiry_report
        )
    
    def record_calibration_event(self, equipment_id: str, calibration_data: dict) -> dict:
        """
        Log calibration completion or updates to equipment records
        Returns confirmation with updated calibration status
        """
        equipment = self.equipment_status.get(equipment_id)
        
        if not equipment:
            return {"success": False, "error": "Equipment not found"}
        
        # Update calibration information
        previous_cal_date = equipment.get('last_calibration_date')
        equipment['last_calibration_date'] = calibration_data['calibration_date']
        equipment['calibration_certificate'] = calibration_data.get('certificate_number')
        equipment['calibration_provider'] = calibration_data.get('provider')
        equipment['status'] = "current"
        
        # Store calibration record
        cal_record = {
            "equipment_id": equipment_id,
            "calibration_date": calibration_data['calibration_date'],
            "certificate_number": calibration_data.get('certificate_number'),
            "provider": calibration_data.get('provider'),
            "technician": calibration_data.get('technician'),
            "calibration_results": calibration_data.get('results', {}),
            "next_due_date": self._calculate_next_due_date(
                calibration_data['calibration_date'],
                equipment['calibration_interval_days']
            ),
            "recorded_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Store in calibration records
        if equipment_id not in self.calibration_records:
            self.calibration_records[equipment_id] = []
        self.calibration_records[equipment_id].append(cal_record)
        
        result = {
            "success": True,
            "equipment_id": equipment_id,
            "previous_calibration": previous_cal_date,
            "new_calibration": calibration_data['calibration_date'],
            "certificate": calibration_data.get('certificate_number'),
            "next_due": cal_record['next_due_date']
        }
        
        # Report calibration event to SMART-Ledger
        self.ledger.record_action(
            action_type="maintenance",
            action="record_calibration",
            target=equipment_id,
            details=f"Calibration recorded: {equipment['description']} - Cert: {calibration_data.get('certificate_number')}",
            user_id=calibration_data.get('technician', 'system'),
            smart_id=self.node_id,
            metadata=result
        )
        
        return result
    
    def generate_maintenance_alert(self, alert_data: dict):
        """
        Escalate critical equipment issues via AlertBroadcast
        Only called for maintenance problems requiring attention
        """
        alert = {
            "alert_type": alert_data['alert_type'],
            "severity": "high" if "expired" in alert_data['alert_type'] else "medium",
            "node_id": self.node_id,
            "station_type": self.station_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "requires_action": True,
            **alert_data
        }
        
        # Send alert via AlertBroadcast (implementation would use actual broadcast system)
        self._send_alert_broadcast(alert)
        
        # Report alert generation to SMART-Ledger
        self.ledger.record_action(
            action_type="maintenance",
            action="generate_alert",
            target=alert_data.get('equipment_id', self.node_id),
            details=f"Maintenance alert: {alert_data['alert_type']}",
            user_id="system",
            smart_id=self.node_id,
            metadata=alert
        )
    
    def get_equipment_status(self, equipment_id: str = None) -> dict:
        """
        Query equipment readiness for dashboard display
        Returns real-time equipment status
        """
        if equipment_id:
            equipment = self.equipment_status.get(equipment_id)
            if not equipment:
                return {"error": "Equipment not found"}
            
            # Validate current calibration status
            self._update_equipment_status(equipment_id)
            
            return equipment
        else:
            # Return all equipment status
            return {
                "node_id": self.node_id,
                "station_type": self.station_type,
                "equipment": list(self.equipment_status.values()),
                "summary": {
                    "total_equipment": len(self.equipment_status),
                    "current": sum(1 for e in self.equipment_status.values() if e['status'] == 'current'),
                    "expiring_soon": sum(1 for e in self.equipment_status.values() if e['status'] == 'expiring_soon'),
                    "expired": sum(1 for e in self.equipment_status.values() if e['status'] == 'expired')
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    # Helper methods
    
    def _check_calibration_validity(self, equipment_id: str) -> bool:
        """Check if equipment calibration is currently valid"""
        validation = self.validate_equipment_calibration(equipment_id)
        return validation.get('valid', False)
    
    def _update_equipment_status(self, equipment_id: str):
        """Update equipment status based on current calibration"""
        validation = self.validate_equipment_calibration(equipment_id)
        equipment = self.equipment_status.get(equipment_id)
        if equipment:
            equipment['status'] = validation.get('status', 'pending_calibration')
    
    def _calculate_next_due_date(self, calibration_date: str, interval_days: int) -> str:
        """Calculate next calibration due date"""
        cal_date = datetime.fromisoformat(calibration_date)
        next_due = cal_date + timedelta(days=interval_days)
        return next_due.isoformat()
    
    def _send_alert_broadcast(self, alert: dict):
        """Send alert via AlertBroadcast system"""
        # Implementation would use actual broadcast mechanism
        pass
```

---

## �📋 Closing Statement

**MaintenanceNode Module: Tool Calibration Enforcer. SmartContract Executor. Node Component.**  
SmartMaintenance contracts deployed once. Calibration validated continuously. Evidence preserved forever.  
**Module integration. No uncalibrated tools. Maintenance compliance only.**