# ✅ SMART-HandoffNodeDispatcher Framework

**Simple Transfer Mechanism. ## 🔗 SmartContract Chaining Workflow

### **Multiple Contract Sequence**
- **Complex Jobs Split**: Client requiring multiple tests gets multiple SmartContracts in sequence
- **Contract Chaining**: Each contract has order-dependent routing triggers
- **Routing Triggers**: Located at bottom of each SmartContract, shows next step in workflow
- **Chain Logic**: HandoffNode reads trigger to determine next node or workflow completion

### **Transfer Types**
- **Vault Hub Transfer**: Always sends completed test results for client records
- **Next Node Transfer**: Sends "part ready for pickup" + next SmartContract in sequence
- **Workflow Completion**: Final contract in sequence may only transfer to Business Hub
- **Contract Handoff**: Each node receives next SmartContract to execute in sequencen H## 🔌 Integration

**Target Environment**: Node Module (All Testing Nodes)
**Runtime**: Post-test transfer execution after SMART-Guardian authorization
**Integration**: SMART-Guardian, SMART-Ledgerf. Transfer Logging.**

SMART-HandoffNodeDispatcher operates as a node module to **execute data transfers** when instructed by SMART-Guardian. It's a simple transfer mechanism that handles the actual movement of data in dual directions.

---

## 🌐 Core Functions

### **Simple Transfer Execution**
- Receives completion notification from SMART-Guardian ("all signoffs complete")
- Reads completed SmartContract routing trigger to determine next step in workflow
- Executes dual-direction data transfers: Business Hub (test results for client) and next node (part ready for pickup/testing)
- Handles the actual movement of data packages based on contract routing triggers
- Logs transfer operations to SMART-Ledger

### **Dual-Direction Handoff**
- **To Vault Hub**: Sends completed test results, compliance metadata, audit chain for client records
- **To Next Node**: Reads routing trigger from completed SmartContract, sends "part ready for pickup" signal and next SmartContract in sequence
- **Contract Chaining**: Multiple SmartContracts for complex jobs, each with routing triggers for next steps
- Logs both transfers independently to SMART-Ledger
- Maintains separate audit trails for each destination

### **Simple Dispatching**
- Executes transfer operations to both destinations based on completed SmartContract routing triggers
- Attempts transfer to each destination independently
- Logs transfer attempts to SMART-Ledger regardless of success/failure
- Operates autonomously based on contract completion status

### **Transfer Logging**
- Logs all transfer operations to SMART-Ledger
- Records transfer timing and destination information
- Links transfers to SMART-ID and Domain information

---

## 🛡️ Security & Governance

- **Guardian-controlled operation** - executes transfers only when instructed by SMART-Guardian
- **Transfer logging** - all transfer actions logged to SMART-Ledger with full audit trails
- **Standalone module** - lives on each node as simple transfer mechanism
- **Dual-path operation** - independent transfer handling for each destination
- **Simple transfer policy** - focuses only on executing the transfer, not validation

### Integration Points
- **SMART-Guardian**: Completion notification ("all signoffs complete")
- **SmartContract**: Contains routing trigger at bottom showing next step in workflow sequence
- **SMART-Ledger**: Immutable logging of all transfer events
- **Vault Hub**: Receives completed test results, compliance metadata, audit chain
- **Next Node**: Receives "part ready for pickup" signal and next SmartContract in sequence

---

## 📊 Transfer Tracking

### **Post-Test Metrics**
- Transfer completion rates for both destinations
- Authorization validation timing and success rates
- Dual-direction handoff performance monitoring
- Retry logic effectiveness and failure recovery

### **Audit Documentation**
- Complete transfer audit trails in SMART-Ledger
- Authorization chain verification records
- Transfer timing and delivery confirmation logs
- Failure analysis and retry attempt documentation

---

## � SmartClientPO Chaining Workflow

### **Multiple Contract Sequence**
- **Complex Jobs Split**: Client requiring multiple tests gets multiple SmartClientPO in sequence
- **Contract Dependencies**: Each contract has order-dependent routing triggers
- **Routing Triggers**: Located at bottom of each SmartClientPO, shows next step in workflow
- **Chain Logic**: HandoffNode reads trigger to determine next node or workflow completion

### **Transfer Types**
- **Vault Hub Transfer**: Always sends completed test results for client records
- **Next Node Transfer**: Sends "part ready for pickup" + next SmartClientPO in sequence
- **Workflow Completion**: Final contract in sequence may only transfer to Business Hub
- **Contract Handoff**: Each node receives next SmartClientPO to execute in sequence

---

## �🔌 Integration

**Target Environment**: Station Level (All Testing Nodes)
**Runtime**: Post-test transfer execution after SMART-Guardian authorization
**Dependencies**: SMART-Guardian, SMART-Ledger, SMART-Gatekeeper

---

## 📈 Operational Benefits

- **Authorization-gated transfers** - no movement without complete validation
- **Dual-direction reliability** - independent transfer paths with separate retry logic
- **Immutable audit trail** - blockchain-based documentation of all transfer events
- **Fault-tolerant operation** - continues functioning even if one destination fails
- **Local-first operation** - standalone module with no external dependencies during transfer

---

## 🔄 Transfer Workflow

1. **Completion Notification** - SMART-Guardian signals "all signoffs complete"
2. **Read Contract Trigger** - Check routing trigger at bottom of completed SmartContract for next step
3. **Contract Chaining Logic** - Determine if more contracts in sequence or workflow complete
4. **Transfer Preparation** - Prepare dual-direction data packages (Vault Hub: test results + Next Node: part ready signal + next SmartContract)
5. **Dual Dispatch** - Execute independent transfers to both destinations
6. **Transfer Logging** - Document transfer events in SMART-Ledger
7. **Delivery Confirmation** - Track and confirm successful delivery to both destinations
8. **Retry Management** - Handle failed deliveries with independent retry logic per destination

---

## 🎯 Strategic Advantages

- **Simple transfer mechanism** - focuses only on moving data when instructed
- **Dual-path handling** - separate transfer processes for business records and workflow continuation
- **Network resilience** - continues operating during connectivity issues
- **Transfer documentation** - complete logging of all transfer activities
- **Guardian-controlled** - executes only authorized transfers from SMART-Guardian

---

## � Architecture

### File: `SMART_handoff_node_dispatcher.py`

* **Class**: `SmartHandoffNodeDispatcher`
* **Core Methods**:

  * `receive_authorized_package()` - Receive transfer authorization from Guardian
  * `read_routing_trigger()` - Extract next step from SmartContract routing logic
  * `prepare_vault_transfer()` - Package test results for Vault Hub
  * `prepare_next_node_transfer()` - Package part signal and next contract
  * `execute_dual_transfer()` - Dispatch to both destinations
  * `transfer_to_vault()` - Send test results to Vault Hub
  * `transfer_to_next_node()` - Send part ready signal to next station
  * `handle_transfer_retry()` - Retry failed transfers independently

### Dual-Direction Transfer Workflow Example

```python
# Example: Dispatcher handles completed LP test with contract chaining

1. SMART-Guardian authorizes completed LP test package (SC-2025-001-LP-TEST1)
2. Dispatcher receives authorization with test results and signatures
3. Dispatcher reads routing trigger from SmartContract:
   - routing_type: "next_node"
   - next_station: "NODE-CP-001" (Chemical Processing)
   - next_contract: "SC-2025-001-CP-TEST1.yaml"
   - vault_transfer: true
4. Dispatcher prepares Vault Hub package:
   - Complete test results
   - All approval signatures
   - Compliance metadata
   - Audit chain
5. Dispatcher prepares Next Node package:
   - Part ready for pickup signal
   - Next SmartContract (CP test requirements)
   - Part tracking information
6. Dispatcher executes dual transfer (parallel operations):
   - Transfer A: Test results → Vault Hub
   - Transfer B: Part signal + next contract → NODE-CP-001
7. Both transfers logged to SMART-Ledger independently
8. If either fails, retry logic handles independently
9. Delivery confirmations tracked separately
10. Complete transfer audit trail preserved
```

### Transfer Package States

* **authorized** - Received from Guardian, ready for dispatch
* **preparing_vault** - Packaging test results for Vault Hub
* **preparing_next_node** - Packaging part signal and next contract
* **transferring_vault** - Vault Hub transfer in progress
* **transferring_next_node** - Next node transfer in progress
* **vault_complete** - Vault Hub transfer successful
* **next_node_complete** - Next node transfer successful
* **fully_complete** - Both transfers successful
* **retry_pending** - One or both transfers failed, retry scheduled

### Example Code Structure

```python
from server.smart_ledger import get_ledger
from datetime import datetime, timezone
from typing import Dict, Optional, List
import json
import yaml
from pathlib import Path
import requests

class SmartHandoffNodeDispatcher:
    def __init__(self, node_id: str, station_type: str):
        self.node_id = node_id
        self.station_type = station_type
        self.pending_transfers = {}
        self.retry_queue = []
        self.max_retry_attempts = 3
        
        # Get ledger instance - reports transfer operations, doesn't write directly
        self.ledger = get_ledger("handoff_dispatcher")
        
        # Hub endpoints
        self.vault_hub_endpoint = "http://vault-hub:8080/receive-test-results"
        self.floor_hub_endpoint = "http://floor-hub:8080/route-to-node"
        
    def receive_authorized_package(self, authorization: dict) -> dict:
        """
        Receive transfer authorization from SMART-Guardian
        Begins dual-direction transfer workflow
        """
        package_id = authorization['package_id']
        clientpo_id = authorization['clientpo_id']
        
        # Create transfer tracking record
        transfer = {
            "transfer_id": f"XFER-{package_id}",
            "package_id": package_id,
            "clientpo_id": clientpo_id,
            "authorization": authorization,
            "status": "authorized",
            "received_timestamp": datetime.now(timezone.utc).isoformat(),
            "vault_status": "pending",
            "next_node_status": "pending",
            "retry_count": 0
        }
        
        self.pending_transfers[package_id] = transfer
        
        # Report transfer receipt to SMART-Ledger
        self.ledger.record_action(
            action_type="handoff",
            action="receive_authorization",
            target=package_id,
            details=f"Transfer authorization received from Guardian",
            user_id="system",
            smart_id=self.node_id,
            metadata={
                "transfer_id": transfer['transfer_id'],
                "clientpo_id": clientpo_id
            }
        )
        
        # Begin transfer workflow
        result = self._process_transfer(package_id)
        
        return result
    
    def _process_transfer(self, package_id: str) -> dict:
        """
        Process transfer workflow: read routing, prepare packages, execute transfers
        """
        transfer = self.pending_transfers.get(package_id)
        
        if not transfer:
            return {"error": "Transfer not found"}
        
        authorization = transfer['authorization']
        
        # Step 1: Read routing trigger from SmartContract
        routing = self.read_routing_trigger(authorization['test_data'])
        transfer['routing'] = routing
        
        # Step 2: Prepare transfer packages
        vault_package = self.prepare_vault_transfer(authorization, routing)
        next_node_package = self.prepare_next_node_transfer(authorization, routing)
        
        transfer['vault_package'] = vault_package
        transfer['next_node_package'] = next_node_package
        
        # Step 3: Execute dual-direction transfer
        result = self.execute_dual_transfer(package_id)
        
        return result
    
    def read_routing_trigger(self, test_data: dict) -> dict:
        """
        Extract routing trigger from completed SmartContract
        Determines next step in workflow chain
        """
        # SmartContracts have routing_trigger field at the bottom
        routing = test_data.get('routing_trigger', {})
        
        routing_info = {
            "routing_type": routing.get('type', 'workflow_complete'),
            "next_station": routing.get('next_station'),
            "next_contract": routing.get('next_contract'),
            "vault_transfer": routing.get('vault_transfer', True),
            "workflow_complete": routing.get('type') == 'workflow_complete',
            "is_final_contract": routing.get('is_final_contract', False)
        }
        
        # Report routing decision to SMART-Ledger
        self.ledger.record_action(
            action_type="handoff",
            action="read_routing",
            target=test_data.get('smart_contract_id'),
            details=f"Routing: {routing_info['routing_type']}",
            user_id="system",
            smart_id=self.node_id,
            metadata=routing_info
        )
        
        return routing_info
    
    def prepare_vault_transfer(self, authorization: dict, routing: dict) -> dict:
        """
        Package test results for Vault Hub transfer
        Includes complete test data, signatures, compliance metadata
        """
        vault_package = {
            "package_type": "test_results",
            "source_node": self.node_id,
            "clientpo_id": authorization['clientpo_id'],
            "test_id": authorization['test_id'],
            "test_data": authorization['test_data'],
            "approvals": authorization['approvals'],
            "guardian_signature": authorization['guardian_signature'],
            "completion_timestamp": authorization['test_data'].get('completion_timestamp'),
            "compliance_metadata": {
                "all_approvals_verified": True,
                "approval_count": len(authorization['approvals']),
                "test_procedure_followed": True
            },
            "audit_chain": {
                "local_backup_path": authorization.get('local_backup_path'),
                "guardian_node": self.node_id,
                "transfer_timestamp": datetime.now(timezone.utc).isoformat()
            },
            "workflow_status": {
                "is_final_contract": routing.get('is_final_contract', False),
                "has_next_step": routing.get('next_station') is not None
            }
        }
        
        return vault_package
    
    def prepare_next_node_transfer(self, authorization: dict, routing: dict) -> Optional[dict]:
        """
        Package part ready signal and next SmartContract for next station
        Returns None if workflow is complete (no next station)
        """
        # Check if there's a next step in the workflow
        if not routing.get('next_station') or routing.get('workflow_complete'):
            return None
        
        # Load next SmartContract from local storage
        next_contract_path = Path(f"/opt/smart/contracts/{routing['next_contract']}")
        
        if not next_contract_path.exists():
            # Contract not found - log error but continue with vault transfer
            self.ledger.record_action(
                action_type="handoff",
                action="contract_missing",
                target=routing['next_contract'],
                details=f"Next contract not found: {routing['next_contract']}",
                user_id="system",
                smart_id=self.node_id,
                metadata={"error": "contract_not_found"}
            )
            return None
        
        with open(next_contract_path, 'r') as f:
            next_contract = yaml.safe_load(f)
        
        # Build next node package
        next_node_package = {
            "package_type": "part_ready",
            "source_node": self.node_id,
            "target_node": routing['next_station'],
            "clientpo_id": authorization['clientpo_id'],
            "part_tracking": {
                "part_id": authorization['test_data'].get('part_id'),
                "part_number": authorization['test_data'].get('part_number'),
                "previous_test": authorization['test_id'],
                "previous_test_status": "complete",
                "ready_for_pickup": True
            },
            "next_contract": next_contract,
            "contract_metadata": {
                "contract_id": next_contract['smart_contract_id'],
                "contract_type": next_contract['contract_type'],
                "test_type": next_contract.get('test_type'),
                "sequence_number": next_contract.get('sequence_number')
            },
            "previous_test_summary": {
                "test_id": authorization['test_id'],
                "completion_timestamp": authorization['test_data'].get('completion_timestamp'),
                "all_approvals": True
            },
            "dispatch_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return next_node_package
    
    def execute_dual_transfer(self, package_id: str) -> dict:
        """
        Execute transfers to both Vault Hub and next node (if applicable)
        Handles both transfers independently with separate error handling
        """
        transfer = self.pending_transfers.get(package_id)
        
        if not transfer:
            return {"error": "Transfer not found"}
        
        results = {
            "transfer_id": transfer['transfer_id'],
            "vault_result": None,
            "next_node_result": None,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Transfer to Vault Hub (always happens)
        vault_result = self.transfer_to_vault(package_id)
        results['vault_result'] = vault_result
        
        if vault_result['success']:
            transfer['vault_status'] = "complete"
        else:
            transfer['vault_status'] = "failed"
            self._queue_retry(package_id, 'vault')
        
        # Transfer to next node (only if there's a next step)
        if transfer['next_node_package']:
            next_node_result = self.transfer_to_next_node(package_id)
            results['next_node_result'] = next_node_result
            
            if next_node_result['success']:
                transfer['next_node_status'] = "complete"
            else:
                transfer['next_node_status'] = "failed"
                self._queue_retry(package_id, 'next_node')
        else:
            transfer['next_node_status'] = "not_applicable"
            results['next_node_result'] = {"success": True, "reason": "workflow_complete"}
        
        # Update overall transfer status
        if transfer['vault_status'] == "complete" and transfer['next_node_status'] in ["complete", "not_applicable"]:
            transfer['status'] = "fully_complete"
        elif transfer['vault_status'] == "failed" or transfer['next_node_status'] == "failed":
            transfer['status'] = "retry_pending"
        
        # Report dual transfer results to SMART-Ledger
        self.ledger.record_action(
            action_type="handoff",
            action="execute_dual_transfer",
            target=package_id,
            details=f"Dual transfer: Vault={transfer['vault_status']}, NextNode={transfer['next_node_status']}",
            user_id="system",
            smart_id=self.node_id,
            metadata=results
        )
        
        return results
    
    def transfer_to_vault(self, package_id: str) -> dict:
        """
        Send test results package to Vault Hub
        Returns transfer result with delivery confirmation
        """
        transfer = self.pending_transfers.get(package_id)
        
        if not transfer:
            return {"success": False, "error": "Transfer not found"}
        
        vault_package = transfer['vault_package']
        
        try:
            # Execute transfer to Vault Hub
            response = requests.post(
                self.vault_hub_endpoint,
                json=vault_package,
                timeout=30
            )
            
            if response.status_code == 200:
                result = {
                    "success": True,
                    "destination": "vault_hub",
                    "package_id": package_id,
                    "response": response.json(),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            else:
                result = {
                    "success": False,
                    "destination": "vault_hub",
                    "error": f"HTTP {response.status_code}",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            
        except Exception as e:
            result = {
                "success": False,
                "destination": "vault_hub",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        # Report vault transfer to SMART-Ledger
        self.ledger.record_action(
            action_type="handoff",
            action="transfer_to_vault",
            target=package_id,
            details=f"Vault transfer: {'SUCCESS' if result['success'] else 'FAILED'}",
            user_id="system",
            smart_id=self.node_id,
            metadata=result
        )
        
        return result
    
    def transfer_to_next_node(self, package_id: str) -> dict:
        """
        Send part ready signal and next SmartContract to next testing station
        Returns transfer result with delivery confirmation
        """
        transfer = self.pending_transfers.get(package_id)
        
        if not transfer:
            return {"success": False, "error": "Transfer not found"}
        
        next_node_package = transfer['next_node_package']
        
        if not next_node_package:
            return {"success": True, "reason": "no_next_node"}
        
        try:
            # Route through Floor Hub to target node
            response = requests.post(
                self.floor_hub_endpoint,
                json={
                    "target_node": transfer['routing']['next_station'],
                    "package": next_node_package
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = {
                    "success": True,
                    "destination": transfer['routing']['next_station'],
                    "package_id": package_id,
                    "next_contract": transfer['routing']['next_contract'],
                    "response": response.json(),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            else:
                result = {
                    "success": False,
                    "destination": transfer['routing']['next_station'],
                    "error": f"HTTP {response.status_code}",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            
        except Exception as e:
            result = {
                "success": False,
                "destination": transfer['routing']['next_station'],
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        # Report next node transfer to SMART-Ledger
        self.ledger.record_action(
            action_type="handoff",
            action="transfer_to_next_node",
            target=package_id,
            details=f"Next node transfer to {transfer['routing']['next_station']}: {'SUCCESS' if result['success'] else 'FAILED'}",
            user_id="system",
            smart_id=self.node_id,
            metadata=result
        )
        
        return result
    
    def handle_transfer_retry(self, package_id: str, destination: str):
        """
        Retry failed transfer independently (vault or next_node)
        Each destination has separate retry logic
        """
        transfer = self.pending_transfers.get(package_id)
        
        if not transfer:
            return
        
        transfer['retry_count'] += 1
        
        if transfer['retry_count'] > self.max_retry_attempts:
            # Max retries exceeded - escalate
            self._escalate_transfer_failure(package_id, destination)
            return
        
        # Retry the specific failed transfer
        if destination == 'vault':
            result = self.transfer_to_vault(package_id)
            if result['success']:
                transfer['vault_status'] = "complete"
            else:
                # Still failing - queue another retry
                self._queue_retry(package_id, 'vault')
        
        elif destination == 'next_node':
            result = self.transfer_to_next_node(package_id)
            if result['success']:
                transfer['next_node_status'] = "complete"
            else:
                # Still failing - queue another retry
                self._queue_retry(package_id, 'next_node')
        
        # Report retry attempt to SMART-Ledger
        self.ledger.record_action(
            action_type="handoff",
            action="retry_transfer",
            target=package_id,
            details=f"Retry {transfer['retry_count']}/{self.max_retry_attempts} for {destination}",
            user_id="system",
            smart_id=self.node_id,
            metadata={
                "destination": destination,
                "retry_count": transfer['retry_count'],
                "max_retries": self.max_retry_attempts
            }
        )
    
    def get_transfer_status(self, package_id: str) -> dict:
        """
        Query transfer status for monitoring and dashboard display
        """
        transfer = self.pending_transfers.get(package_id)
        
        if not transfer:
            return {"error": "Transfer not found"}
        
        return {
            "transfer_id": transfer['transfer_id'],
            "package_id": package_id,
            "status": transfer['status'],
            "vault_status": transfer['vault_status'],
            "next_node_status": transfer['next_node_status'],
            "retry_count": transfer['retry_count'],
            "routing": transfer.get('routing', {}),
            "received_timestamp": transfer['received_timestamp']
        }
    
    # Helper methods
    
    def _queue_retry(self, package_id: str, destination: str):
        """Queue failed transfer for retry"""
        self.retry_queue.append({
            "package_id": package_id,
            "destination": destination,
            "queued_timestamp": datetime.now(timezone.utc).isoformat()
        })
    
    def _escalate_transfer_failure(self, package_id: str, destination: str):
        """Escalate persistent transfer failure to Floor Hub"""
        transfer = self.pending_transfers.get(package_id)
        
        alert = {
            "alert_type": "transfer_failure",
            "severity": "high",
            "package_id": package_id,
            "destination": destination,
            "retry_count": transfer['retry_count'],
            "node_id": self.node_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Send alert via AlertBroadcast
        self._send_alert(alert)
        
        # Report escalation to SMART-Ledger
        self.ledger.record_action(
            action_type="handoff",
            action="escalate_failure",
            target=package_id,
            details=f"Transfer failure escalated after {transfer['retry_count']} retries",
            user_id="system",
            smart_id=self.node_id,
            metadata=alert
        )
    
    def _send_alert(self, alert: dict):
        """Send alert via AlertBroadcast system"""
        # Implementation would use actual broadcast mechanism
        pass
```

---

## �📋 Closing Statement

**HandoffNodeDispatcher: Simple Transfer. Dual Direction. Guardian Controlled.**  
Executes transfers when instructed by SMART-Guardian. Business records and workflow continuation handled independently.  
**Simple mechanism. Reliable transfer. Guardian authorized.**