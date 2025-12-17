# 🏢 SMART-HandoffCoordinator Framework

**Pre-Test SmartClientPO Release. Arrival-Gated Dispatch. Physical Confirmation.**

SMART-HandoffCoordinator operates on the Floor Hub to **manage pre-test SmartClientPO release** based on confirmed physical part arrival. This is the gateway that holds SmartClientPOs until parts are physically present - ensuring no test execution begins without confirmed materials.

---

## 🌐 Core Functions

### **SmartClientPO Staging**
- Receives and holds SmartClientPOs from the Business Hub
- Maintains staging queue of pending SmartClientPOs awaiting part arrival
- Cross-references incoming part IDs with pending SmartClientPOs
- Prevents premature SmartClientPO release without physical confirmation

### **Arrival-Gated Release**
- Waits for physical part arrival signal via SMART-InfoBroadcast
- Triggers dispatch of SmartClientPO to correct node **only when part is physically confirmed**
- Does **not** evaluate node capability, schedule jobs, or perform orchestration
- Simply forwards the SmartClientPO to the node defined in the contract

### **Physical Confirmation Management**
- Monitors SMART-InfoBroadcast for part arrival notifications
- Validates part ID matches against staged SmartClientPO
- Enforces strict arrival-based hold/release policy

### **Audit & Verification**
- Logs release event, broadcast trigger, and destination SmartClientPO ID to SMART-Ledger
- Does not store part data or test logic — just enforces arrival-based hold/release
- Maintains complete audit trail of SmartClientPO staging and release events
- Documents physical confirmation triggers and timing

---

## 🛡️ Governance & Security

- **Arrival-gated policy** - release is impossible without verified part arrival broadcast
- **Physical confirmation requirement** - no SmartClientPO dispatch without material presence
- **Immutable logging** - all release events recorded in SMART-Ledger
- **Autonomous operation** - operates independently with local broadcast monitoring
- **No orchestration authority** - simply forwards SmartClientPOs, does not schedule or evaluate

### Integration Points
- **SMART-InfoBroadcast**: Receives physical arrival confirmation broadcasts
- **SMART-Ledger**: Records all staging and release events
- **Business Hub**: Source of SmartClientPOs for staging
- **Target Nodes**: Destinations for released SmartClientPOs (as defined in contracts)

---

## 📁 Architecture

### File: `SMART_handoff_central.py`

* **Class**: `SmartHandoffCentral`
* **Core Methods**:

  * `stage_client_po()` - Queue incoming SmartClientPO from Business Hub
  * `monitor_arrival_broadcasts()` - Listen to SMART-InfoBroadcast for part arrivals
  * `validate_part_arrival()` - Cross-reference part ID with staged SmartClientPO
  * `release_client_po()` - Dispatch SmartClientPO to target node after confirmation
  * `log_staging_event()` - Record staging/release to SMART-Ledger
  * `get_staging_queue_status()` - Return current queue state for dashboard

### SmartClientPO Release Workflow Example

```python
# Example: Part arrival triggers SmartClientPO release

1. Business Hub sends SmartClientPO SC-2025-001-LP to Floor Hub
2. HandoffCentral stages SmartClientPO (status: awaiting_arrival)
3. Monitors SMART-InfoBroadcast for matching part ID
4. Broadcast received: "Part PART-ABC-12345 arrived at receiving dock"
5. Validates: Part ID matches SmartClientPO requirement
6. Updates status to "ready_for_release"
7. Dispatches SmartClientPO to target node: NOD-TestStation-LP-01
8. Logs release event to SMART-Ledger with confirmation timestamp
9. Node receives SmartClientPO and begins pre-test validation
```

### SmartClientPO Queue States

* **awaiting_arrival** - SmartClientPO received, staged, waiting for physical part confirmation
* **arrival_confirmed** - Physical part arrival broadcast received and validated
* **ready_for_release** - All confirmations complete, SmartClientPO ready for node dispatch
* **released** - SmartClientPO dispatched to target node, logged to ledger
* **hold** - Manual hold placed on SmartClientPO (part damaged, client request, etc.)

### Example Code Structure

```python
from server.smart_ledger import get_ledger
from datetime import datetime, timezone
import time

class SmartHandoffCentral:
    def __init__(self, floor_hub_id: str):
        self.floor_hub_id = floor_hub_id
        self.staging_queue = {}
        self.broadcast_listener = InfoBroadcastListener()
        
        # Get ledger instance - SMART-Ledger handles all writing
        # This module only REPORTS actions, doesn't write directly
        self.ledger = get_ledger("handoff_central")
    
    def stage_client_po(self, client_po: dict) -> str:
        """
        Stage incoming SmartClientPO from Business Hub
        Returns staging ID for tracking
        """
        staging_id = f"STAGE-{int(time.time())}"
        
        # Extract required part information
        part_id = client_po.get("part_number")
        target_node = client_po.get("tests")[0].get("assigned_node", "")
        
        # Queue SmartClientPO with awaiting_arrival status
        self.staging_queue[staging_id] = {
            "client_po": client_po,
            "part_id": part_id,
            "target_node": target_node,
            "status": "awaiting_arrival",
            "staged_timestamp": datetime.now(timezone.utc).isoformat(),
            "arrival_timestamp": None,
            "release_timestamp": None
        }
        
        # Report staging event to SMART-Ledger (module doesn't do the writing)
        # Ledger handles: hash calculation, timestamp, file I/O, chain validation
        self.ledger.record_action(
            action_type="handoff",
            action="stage_client_po",
            target=client_po.get("smart_contract_id"),
            details=f"SmartClientPO staged, awaiting part {part_id}",
            user_id="system",
            smart_id=self.floor_hub_id,
            metadata={"staging_id": staging_id, "part_id": part_id}
        )
        
        return staging_id
    
    def monitor_arrival_broadcasts(self):
        """
        Continuously monitor SMART-InfoBroadcast for part arrival notifications
        Run as background thread
        """
        while True:
            broadcast = self.broadcast_listener.get_next_broadcast()
            
            if broadcast.get("event_type") == "part_arrival":
                part_id = broadcast.get("part_id")
                self.validate_part_arrival(part_id, broadcast)
            
            time.sleep(0.5)  # Check broadcasts every 500ms
    
    def validate_part_arrival(self, part_id: str, broadcast: dict):
        """
        Cross-reference arrived part with staged SmartClientPOs
        Trigger release if match found
        """
        for staging_id, staged_po in self.staging_queue.items():
            if staged_po["part_id"] == part_id and staged_po["status"] == "awaiting_arrival":
                
                # Update status to arrival confirmed
                staged_po["status"] = "arrival_confirmed"
                staged_po["arrival_timestamp"] = datetime.now(timezone.utc).isoformat()
                staged_po["arrival_broadcast"] = broadcast
                
                # Report arrival confirmation to SMART-Ledger
                # Module tells ledger WHAT to log, ledger handles the writing
                self.ledger.record_action(
                    action_type="handoff",
                    action="confirm_arrival",
                    target=staged_po["client_po"]["smart_contract_id"],
                    details=f"Physical part {part_id} arrival confirmed",
                    user_id="system",
                    smart_id=self.floor_hub_id,
                    metadata={"staging_id": staging_id, "broadcast_id": broadcast.get("id")}
                )
                
                # Trigger release
                self.release_client_po(staging_id)
                break
    
    def release_client_po(self, staging_id: str) -> bool:
        """
        Release SmartClientPO to target node after arrival confirmation
        Returns True if successful, False if validation fails
        """
        staged_po = self.staging_queue.get(staging_id)
        
        if not staged_po or staged_po["status"] != "arrival_confirmed":
            return False
        
        # Update status to ready for release
        staged_po["status"] = "ready_for_release"
        
        # Dispatch to target node via SMART-Handoff
        target_node = staged_po["target_node"]
        client_po = staged_po["client_po"]
        
        try:
            # Send SmartClientPO to node (implementation depends on transport layer)
            self._dispatch_to_node(target_node, client_po)
            
            # Update status to released
            staged_po["status"] = "released"
            staged_po["release_timestamp"] = datetime.now(timezone.utc).isoformat()
            Report release event to SMART-Ledger
            # Module provides the details, ledger handles hash/write
            self.ledger.record_action(
                action_type="handoff",
                action="release_client_po",
                target=client_po["smart_contract_id"],
                details=f"SmartClientPO released to {target_node}",
                user_id="system",
                smart_id=self.floor_hub_id,
                metadata={
                    "staging_id": staging_id,
                    "target_node": target_node,
                    "part_id": staged_po["part_id"]
                }
            )
            
            return True
            
        except Exception as e:
            # Report failure to SMART-Ledger (not direct file writing)as e:
            # Log failure
            self.ledger.record_action(
                action_type="handoff",
                action="release_failed",
                target=client_po["smart_contract_id"],
                details=f"Failed to release SmartClientPO: {str(e)}",
                user_id="system",
                smart_id=self.floor_hub_id,
                metadata={"staging_id": staging_id, "error": str(e)}
            )
            return False
    
    def get_staging_queue_status(self) -> dict:
        """
        Return current staging queue state for dashboard display
        """
        return {
            "total_staged": len(self.staging_queue),
            "awaiting_arrival": sum(1 for p in self.staging_queue.values() if p["status"] == "awaiting_arrival"),
            "arrival_confirmed": sum(1 for p in self.staging_queue.values() if p["status"] == "arrival_confirmed"),
            "ready_for_release": sum(1 for p in self.staging_queue.values() if p["status"] == "ready_for_release"),
            "released": sum(1 for p in self.staging_queue.values() if p["status"] == "released"),
            "on_hold": sum(1 for p in self.staging_queue.values() if p["status"] == "hold"),
            "queue": list(self.staging_queue.values())
        }
```

---

## 📊 Staging Analytics

### **SmartClientPO Queue Metrics**
- SmartClientPO staging queue length and timing
- Part arrival confirmation rates and response times
- SmartClientPO release timing and node routing
- Physical confirmation accuracy and validation effectiveness

### **Arrival Tracking**
- Part arrival notification patterns and timing analysis
- Broadcast signal reliability and autonomous operation performance
- Cross-reference accuracy between part IDs and pending SmartClientPOs
- Queue management efficiency and staging optimization

### **Release Documentation**
- Complete audit trails of SmartClientPO staging and release events
- Physical confirmation triggers and timing records
- Release destination tracking and node routing verification
- Autonomous operation performance and local broadcast monitoring

---

## 🔌 Deployment

**Target Environment**: Floor Hub (Physical part arrival coordination point)
**Runtime**: Continuous SmartClientPO staging and arrival-gated release management
**Integration**: SMART-InfoBroadcast, SMART-Ledger

---

## 📈 Operational Benefits

- **Arrival-gated precision** - prevents premature test execution without confirmed materials
- **Physical confirmation enforcement** - no SmartClientPO release without part presence
- **Immutable staging audit** - complete documentation of hold/release decisions
- **Simple forwarding** - no complex orchestration, just confirmed dispatch

---

## 🔄 Pre-Test SmartClientPO Management Workflow

1. **SmartClientPO Staging** - Receive SmartClientPOs from Business Hub for queue management
2. **Arrival Monitoring** - Continuous monitoring of SMART-InfoBroadcast for part confirmations
3. **Cross-Reference Validation** - Match incoming part IDs with staged SmartClientPO requirements
4. **Arrival-Gated Release** - Dispatch SmartClientPO to target node only after physical confirmation
5. **Immutable Logging** - Document all staging and release events in SMART-Ledger
6. **Node Transfer** - Send SmartClientPO to designated node as specified in contract

---

## 🎯 Strategic Advantages

- **Pre-test gate control** - ensures materials are present before test execution begins
- **Physical confirmation requirement** - prevents costly dry runs and scheduling errors
- **Distributed resilience** - no single point of failure in SmartCleintPO management
- **Strict separation enforcement** - maintains clear pre-test, test, post-test boundaries
- **Immutable audit trail** - complete documentation for operational and financial audits

---

## 📋 Closing Statement

**HandoffCoordinator: Pre-Test Only. Physical Confirmation Required. Simple Forwarding.**  
SmartClientPOs move only when parts are confirmed present. No orchestration, no assumptions.  
**Before a test begins — nothing moves without physical proof.**