# SMART-Guardian Framework

The **SMART-Guardian** module is responsible for ensuring all test data produced at a station is **complete, verified, and authorized** before it is transmitted to the next destination in the SMART ecosystem. It serves as a **final gatekeeper for outbound data only**—it does **not** handle or verify incoming data (that role belongs to **SMART-Gatekeeper**).

---

## 🧭 Primary Function

SMART-Guardian does **not perform enforcement** or direct validation. Instead, it listens for completed test packages and only releases them when all verification modules (QA, Compliance, Standards, etc.) have signed off on the results.

Once validation is confirmed:

* **Saves complete test results locally** as a failsafe backup
* The package is passed to the **HandoffNodeDispatcher** module for delivery to the next testing station or central module

---

## 🧩 Architecture Overview

### 🔐 Role in Data Chain

* **Outbound-only verification**
* Ensures all ClientSmartPO tests are completed
* Verifies all required module approvals are present
* Validates signatures from:

  * SMART-QA
  * SMART-Compliance
  * SMART-Standards
  * SMART-Maintenance (if required by SmartPO)
  * SMART-Safety (if required by SmartPO)
  * Others (as needed per ClientSmartPO config)

### 🚫 Not Responsible For

* Receiving or interpreting incoming data (that's **SMART-Gatekeeper**)
* Modifying data or enforcing rules
* Syncing non-test-related data (handled by modules themselves)

### 🧱 Immutable Verification

* All approvals are logged in **SMART-Ledger**
* **Complete test results stored locally** before sync authorization
* Guardian cannot override failed or missing validations
* Local backup enables recovery if sync fails or network is down

---

## 🔁 Sync Coordination

* Once approved, **test results saved locally first**
* Test data is handed off to **HandoffNodeDispatcher** for dual transfer
* HandoffNodeDispatcher handles routing 
* Guardian acts as final yes/no gate before handoff
* **Local backup ensures data preservation** if handoff transmission fails

---

## 🌐 Offline Behavior

* Can function offline, storing verified results
* Periodically pushes results to SMART-Vault for archival
* Alerts local admins if data is stuck or awaiting validation too long

---

## 🔐 Security & Traceability

* Guardian logs every action it takes, including:

  * Timestamp of validation
  * Signatures it detected
  * Destination node/hub ID
* Fully auditable and traceable

---

## 🔮 Future Additions

* **Timeout Escalation:** If validations are delayed beyond a threshold, Guardian can notify admins
* **SmartPO Hooks:** Custom rules based on part type, test priority, or chain-of-custody flags
* **Multi-party Signatures:** Require quorum-style sign-offs for certain critical operations

---

## 📁 Architecture

### File: `SMART_guardian.py`

* **Class**: `SmartGuardian`
* **Core Methods**:

  * `monitor_test_completion()` - Listen for completed test events
  * `verify_required_approvals()` - Check all module signatures present
  * `verify_signature_validity()` - Validate cryptographic signatures
  * `save_test_results_locally()` - Store complete test package as backup
  * `authorize_handoff()` - Release package to HandoffNodeDispatcher
  * `check_approval_timeout()` - Escalate delayed validations
  * `get_package_status()` - Query status of test package verification
  * `generate_timeout_alert()` - Notify admins of stuck packages

### Test Package Verification Workflow Example

```python
# Example: Guardian verifies completed LP test before handoff

1. Test station completes LP testing for part SC-2025-001-LP
2. Guardian receives test completion event from InfoBroadcast
3. Guardian reads approval signatures directly from test package:
   - SMART-QA signature (test data validation)
   - SMART-Compliance signature (procedure adherence)
   - SMART-Standards signature (ASTM E1417 compliance)
   - SMART-Safety signature (PPE and environmental compliance)
4. Guardian verifies each signature is cryptographically valid
5. All approvals confirmed - Guardian saves complete test package locally
6. Guardian logs authorization to SMART-Ledger
7. Guardian passes package to HandoffNodeDispatcher for transmission
8. HandoffNodeDispatcher routes to next station and/or central vault
9. Guardian monitors handoff completion status
10. If timeout occurs, Guardian escalates alert to Floor Hub
```

### Test Package States

* **awaiting_completion** - Test in progress, not ready for verification
* **pending_approval** - Test complete, awaiting module signatures
* **partial_approval** - Some but not all required approvals received
* **fully_approved** - All required signatures verified
* **locally_saved** - Complete package backed up locally
* **authorized_handoff** - Released to HandoffNodeDispatcher
* **handoff_complete** - Successfully transmitted to destination(s)
* **timeout_escalated** - Approval delay exceeded threshold, alert sent

### Example Code Structure

```python
from server.smart_ledger import get_ledger
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
import json
import hashlib
from pathlib import Path

class SmartGuardian:
    def __init__(self, node_id: str, station_type: str):
        self.node_id = node_id
        self.station_type = station_type
        self.monitored_packages = {}
        self.approval_timeout_threshold = 1800  # 30 minutes in seconds
        
        # Get ledger instance - reports verification actions, doesn't write directly
        self.ledger = get_ledger("guardian")
        
        # Local backup storage for test results
        self.local_backup_path = Path("/opt/smart/test-results-backup")
        self.local_backup_path.mkdir(parents=True, exist_ok=True)
        
        # Handoff dispatcher reference (for authorized releases)
        self.handoff_dispatcher = None
    
    def monitor_test_completion(self):
        """
        Listen for completed test events from InfoBroadcast
        Continuous monitoring loop for test completion signals
        """
        # This would be a background thread/process listening to broadcasts
        # For example purposes, showing the handling logic
        
        while True:
            # Listen for test completion broadcast
            event = self._listen_for_broadcast()
            
            if event and event['event_type'] == 'test_complete':
                self._handle_test_completion(event)
    
    def _handle_test_completion(self, event: dict):
        """
        Process test completion event and begin verification workflow
        """
        clientpo_id = event['clientpo_id']
        test_id = event['test_id']
        package_id = f"{clientpo_id}-{test_id}"
        
        # Initialize package tracking
        package = {
            "package_id": package_id,
            "clientpo_id": clientpo_id,
            "test_id": test_id,
            "node_id": self.node_id,
            "status": "pending_approval",
            "completion_timestamp": event['timestamp'],
            "required_approvals": event.get('required_approvals', []),
            "received_approvals": [],
            "test_data": event.get('test_data', {}),
            "signatures": event.get('signatures', {}),  # Approval signatures attached to package
            "monitoring_started": datetime.now(timezone.utc).isoformat()
        }
        
        self.monitored_packages[package_id] = package
        
        # Report monitoring start to SMART-Ledger
        self.ledger.record_action(
            action_type="guardian",
            action="monitor_package",
            target=package_id,
            details=f"Guardian monitoring test package for approval verification",
            user_id="system",
            smart_id=self.node_id,
            metadata={
                "clientpo_id": clientpo_id,
                "required_approvals": package['required_approvals']
            }
        )
        
        # Begin verification workflow
        self._begin_verification_workflow(package_id)
    
    def _begin_verification_workflow(self, package_id: str):
        """
        Start approval verification process for test package
        """
        package = self.monitored_packages.get(package_id)
        
        if not package:
            return
        
        # Check for required approvals
        approval_status = self.verify_required_approvals(package_id)
        
        if approval_status['all_approved']:
            # All approvals received - proceed to authorization
            self._process_approved_package(package_id)
        else:
            # Still waiting - check for timeout
            self.check_approval_timeout(package_id)
    
    def verify_required_approvals(self, package_id: str) -> dict:
        """
        Check all required module signatures are present on test package
        Returns approval status with details
        """
        package = self.monitored_packages.get(package_id)
        
        if not package:
            return {"error": "Package not found"}
        
        required = package['required_approvals']
        signatures = package.get('signatures', {})
        received = []
        missing = []
        invalid = []
        
        # Check each required approval signature directly from package
        for approval_type in required:
            # Get signature from package data
            signature_entry = signatures.get(approval_type)
            
            if signature_entry:
                # Verify signature validity
                is_valid = self.verify_signature_validity(signature_entry)
                
                if is_valid:
                    received.append({
                        "approval_type": approval_type,
                        "signature": signature_entry,
                        "verified": True
                    })
                else:
                    invalid.append(approval_type)
            else:
                missing.append(approval_type)
        
        # Update package tracking
        package['received_approvals'] = received
        package['missing_approvals'] = missing
        package['invalid_approvals'] = invalid
        
        all_approved = len(missing) == 0 and len(invalid) == 0
        
        if all_approved:
            package['status'] = "fully_approved"
        elif len(received) > 0:
            package['status'] = "partial_approval"
        
        status = {
            "package_id": package_id,
            "all_approved": all_approved,
            "total_required": len(required),
            "received_count": len(received),
            "missing": missing,
            "invalid": invalid,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Report approval verification to SMART-Ledger
        self.ledger.record_action(
            action_type="guardian",
            action="verify_approvals",
            target=package_id,
            details=f"Approval check: {len(received)}/{len(required)} verified",
            user_id="system",
            smart_id=self.node_id,
            metadata=status
        )
        
        return status
    
    def verify_signature_validity(self, signature_entry: dict) -> bool:
        """
        Validate cryptographic signature from approval module
        Returns True if signature is valid and current
        """
        # Extract signature components
        signature = signature_entry.get('signature')
        signer_id = signature_entry.get('signer_id')
        timestamp = signature_entry.get('timestamp')
        data_hash = signature_entry.get('data_hash')
        
        # Verify signature is properly formed
        if not all([signature, signer_id, timestamp, data_hash]):
            return False
        
        # Verify signature is not expired (within last hour)
        signature_time = datetime.fromisoformat(timestamp)
        age = datetime.now(timezone.utc) - signature_time
        if age > timedelta(hours=1):
            return False
        
        # Verify cryptographic signature (simplified - actual implementation
        # would use proper cryptographic verification)
        expected_hash = self._calculate_signature_hash(
            signature_entry.get('test_data'),
            signer_id,
            timestamp
        )
        
        is_valid = data_hash == expected_hash
        
        return is_valid
    
    def _process_approved_package(self, package_id: str):
        """
        Handle fully approved test package - save locally and authorize handoff
        """
        package = self.monitored_packages.get(package_id)
        
        if not package or package['status'] != "fully_approved":
            return
        
        # Step 1: Save complete test results locally
        save_result = self.save_test_results_locally(package_id)
        
        if not save_result['success']:
            # Cannot proceed without local backup
            self._handle_save_failure(package_id, save_result)
            return
        
        # Step 2: Authorize handoff to dispatcher
        handoff_result = self.authorize_handoff(package_id)
        
        if handoff_result['success']:
            package['status'] = "authorized_handoff"
            package['handoff_timestamp'] = datetime.now(timezone.utc).isoformat()
        else:
            # Handoff authorization failed
            self._handle_handoff_failure(package_id, handoff_result)
    
    def save_test_results_locally(self, package_id: str) -> dict:
        """
        Store complete test package as local backup before handoff
        Returns save result with file path
        """
        package = self.monitored_packages.get(package_id)
        
        if not package:
            return {"success": False, "error": "Package not found"}
        
        try:
            # Build complete test result package
            result_package = {
                "package_id": package_id,
                "clientpo_id": package['clientpo_id'],
                "test_id": package['test_id'],
                "node_id": self.node_id,
                "completion_timestamp": package['completion_timestamp'],
                "test_data": package['test_data'],
                "approvals": package['received_approvals'],
                "saved_timestamp": datetime.now(timezone.utc).isoformat(),
                "package_hash": self._calculate_package_hash(package)
            }
            
            # Save to local file system
            file_path = self.local_backup_path / f"{package_id}.json"
            with open(file_path, 'w') as f:
                json.dump(result_package, f, indent=2)
            
            # Update package status
            package['status'] = "locally_saved"
            package['local_backup_path'] = str(file_path)
            
            result = {
                "success": True,
                "package_id": package_id,
                "file_path": str(file_path),
                "file_size": file_path.stat().st_size,
                "package_hash": result_package['package_hash']
            }
            
            # Report local save to SMART-Ledger
            self.ledger.record_action(
                action_type="guardian",
                action="save_local_backup",
                target=package_id,
                details=f"Test results saved locally: {file_path.name}",
                user_id="system",
                smart_id=self.node_id,
                metadata=result
            )
            
            return result
            
        except Exception as e:
            result = {
                "success": False,
                "error": str(e),
                "package_id": package_id
            }
            
            # Report failure to SMART-Ledger
            self.ledger.record_action(
                action_type="guardian",
                action="save_failed",
                target=package_id,
                details=f"Local backup failed: {str(e)}",
                user_id="system",
                smart_id=self.node_id,
                metadata=result
            )
            
            return result
    
    def authorize_handoff(self, package_id: str) -> dict:
        """
        Release approved package to HandoffNodeDispatcher for transmission
        Returns authorization result
        """
        package = self.monitored_packages.get(package_id)
        
        if not package:
            return {"success": False, "error": "Package not found"}
        
        if package['status'] != "locally_saved":
            return {"success": False, "error": "Package not locally saved"}
        
        try:
            # Build handoff authorization
            authorization = {
                "package_id": package_id,
                "clientpo_id": package['clientpo_id'],
                "test_id": package['test_id'],
                "source_node": self.node_id,
                "test_data": package['test_data'],
                "approvals": package['received_approvals'],
                "local_backup_path": package['local_backup_path'],
                "authorized_timestamp": datetime.now(timezone.utc).isoformat(),
                "guardian_signature": self._generate_guardian_signature(package)
            }
            
            # Pass to HandoffNodeDispatcher
            if self.handoff_dispatcher:
                dispatch_result = self.handoff_dispatcher.receive_authorized_package(authorization)
            else:
                # Fallback: queue for dispatcher pickup
                dispatch_result = self._queue_for_dispatcher(authorization)
            
            result = {
                "success": True,
                "package_id": package_id,
                "authorization": authorization,
                "dispatch_result": dispatch_result
            }
            
            # Report handoff authorization to SMART-Ledger
            self.ledger.record_action(
                action_type="guardian",
                action="authorize_handoff",
                target=package_id,
                details=f"Test package authorized for handoff to dispatcher",
                user_id="system",
                smart_id=self.node_id,
                metadata=result
            )
            
            return result
            
        except Exception as e:
            result = {
                "success": False,
                "error": str(e),
                "package_id": package_id
            }
            
            # Report authorization failure to SMART-Ledger
            self.ledger.record_action(
                action_type="guardian",
                action="handoff_auth_failed",
                target=package_id,
                details=f"Handoff authorization failed: {str(e)}",
                user_id="system",
                smart_id=self.node_id,
                metadata=result
            )
            
            return result
    
    def check_approval_timeout(self, package_id: str):
        """
        Check if approval process has exceeded timeout threshold
        Escalates alert if delayed too long
        """
        package = self.monitored_packages.get(package_id)
        
        if not package:
            return
        
        # Calculate time waiting for approvals
        monitoring_start = datetime.fromisoformat(package['monitoring_started'])
        elapsed = datetime.now(timezone.utc) - monitoring_start
        elapsed_seconds = elapsed.total_seconds()
        
        if elapsed_seconds > self.approval_timeout_threshold:
            # Timeout exceeded - generate alert
            self.generate_timeout_alert(package_id, elapsed_seconds)
    
    def generate_timeout_alert(self, package_id: str, elapsed_seconds: float):
        """
        Notify admins of stuck package requiring attention
        Escalates via AlertBroadcast system
        """
        package = self.monitored_packages.get(package_id)
        
        if not package:
            return
        
        alert = {
            "alert_type": "approval_timeout",
            "severity": "high",
            "package_id": package_id,
            "clientpo_id": package['clientpo_id'],
            "node_id": self.node_id,
            "elapsed_seconds": elapsed_seconds,
            "threshold_seconds": self.approval_timeout_threshold,
            "missing_approvals": package.get('missing_approvals', []),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "requires_action": True
        }
        
        # Send alert via AlertBroadcast
        self._send_alert_broadcast(alert)
        
        # Mark package as escalated
        package['status'] = "timeout_escalated"
        package['escalation_timestamp'] = alert['timestamp']
        
        # Report timeout escalation to SMART-Ledger
        self.ledger.record_action(
            action_type="guardian",
            action="timeout_alert",
            target=package_id,
            details=f"Approval timeout exceeded: {elapsed_seconds:.0f}s (threshold: {self.approval_timeout_threshold}s)",
            user_id="system",
            smart_id=self.node_id,
            metadata=alert
        )
    
    def get_package_status(self, package_id: str) -> dict:
        """
        Query status of test package verification for dashboard display
        Returns real-time package status
        """
        package = self.monitored_packages.get(package_id)
        
        if not package:
            return {"error": "Package not found"}
        
        # Calculate time in current state
        monitoring_start = datetime.fromisoformat(package['monitoring_started'])
        elapsed = datetime.now(timezone.utc) - monitoring_start
        
        status = {
            "package_id": package_id,
            "clientpo_id": package['clientpo_id'],
            "status": package['status'],
            "elapsed_seconds": elapsed.total_seconds(),
            "required_approvals": package['required_approvals'],
            "received_approvals": [a['approval_type'] for a in package.get('received_approvals', [])],
            "missing_approvals": package.get('missing_approvals', []),
            "local_backup_path": package.get('local_backup_path'),
            "handoff_timestamp": package.get('handoff_timestamp'),
            "timeout_risk": elapsed.total_seconds() > (self.approval_timeout_threshold * 0.8)
        }
        
        return status
    
    def get_all_monitored_packages(self) -> List[dict]:
        """
        Get status of all currently monitored packages
        For dashboard and monitoring interfaces
        """
        return [
            self.get_package_status(package_id)
            for package_id in self.monitored_packages.keys()
        ]
    
    # Helper methods
    
    def _listen_for_broadcast(self) -> Optional[dict]:
        """Listen for InfoBroadcast events"""
        # Implementation would use actual broadcast mechanism
        return None
    
    def _calculate_signature_hash(self, data: dict, signer_id: str, timestamp: str) -> str:
        """Calculate expected hash for signature verification"""
        hash_input = f"{json.dumps(data, sort_keys=True)}{signer_id}{timestamp}"
        return hashlib.sha256(hash_input.encode()).hexdigest()
    
    def _calculate_package_hash(self, package: dict) -> str:
        """Calculate hash of complete test package"""
        hash_input = json.dumps(package['test_data'], sort_keys=True)
        return hashlib.sha256(hash_input.encode()).hexdigest()
    
    def _generate_guardian_signature(self, package: dict) -> str:
        """Generate Guardian's signature for authorization"""
        signature_data = f"{package['package_id']}{self.node_id}{datetime.now(timezone.utc).isoformat()}"
        return hashlib.sha256(signature_data.encode()).hexdigest()
    
    def _queue_for_dispatcher(self, authorization: dict) -> dict:
        """Queue authorization for dispatcher pickup"""
        # Implementation would write to shared queue
        return {"queued": True}
    
    def _send_alert_broadcast(self, alert: dict):
        """Send alert via AlertBroadcast system"""
        # Implementation would use actual broadcast mechanism
        pass
    
    def _handle_save_failure(self, package_id: str, error: dict):
        """Handle local save failure"""
        # Implementation would retry or escalate
        pass
    
    def _handle_handoff_failure(self, package_id: str, error: dict):
        """Handle handoff authorization failure"""
        # Implementation would retry or escalate
        pass
```

---

## Summary

**SMART-Guardian** is a single-responsibility module ensuring **no unverified test data ever leaves a node.** It listens, checks, and passes only when everything is valid.

It is not a sync module.
It is not a validator.
It is the **final guardian** of test data integrity.