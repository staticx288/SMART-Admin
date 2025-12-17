# 📁 SMART-PolicyNodeStorage Framework

**Local Contract Storage. Node-Specific Policies. Simple File Structure.**

---

## 🧭 Overview## 📋 Node Storage Summary

**PolicyNodeStorage provides simple, reliable contract storage at the node level.**

Contracts are received, stored, and accessed locally. No creation, no modification, no version management - just clean, organized storage for contract execution.

**SMART-PolicyNodeStorage: Local Storage. Current Contracts. Simple Access.***SMART-PolicyNodeStorage** provides simple local storage for SmartContracts deployed to individual nodes. Each node maintains only the contracts relevant to its testing operations in a clean folder structure.

**Node storage is reception-only** - nodes receive contracts from Central but do not create or modify them locally.

---

## 🧩 Core Functions

### 1. � Local Contract Storage

Each node maintains a simple folder structure for deployed contracts:

```
/Processes/
  /SP/
    LP-Green.yaml
    CP-RedDye.yaml
  /Compliance/
    Testing-Checklist.yaml
    Safety-Protocol.yaml
  /Standards/
    ASTM-E165.yaml
    ISO9712.yaml
  /Maintenance/
    Daily-Calibration.yaml
    Equipment-Check.yaml
```

**Node storage characteristics:**

* Stores **current version only** - no version history at node level
* **Read-only storage** - nodes cannot modify contracts locally
* Simple file-based access for SmartContract execution modules
* Contracts deployed by contract creation modules (ComplianceCentral, MaintenanceCentral, etc.)

---

### 2. 📥 Contract Reception & Organization

**Contract storage organization:**

* Contracts deployed by creation modules (ComplianceCentral, MaintenanceCentral, StandardsCentral, etc.)
* Organizes contracts into appropriate folders (/SP/, /Compliance/, /Standards/, /Maintenance/)
* Replaces existing contracts when updates are deployed
* **Node-specific filtering** - only stores contracts relevant to node's testing capabilities

**Contract organization:**

* SP contracts for node-specific special processes
* Compliance contracts for testing procedure enforcement
* Standards contracts for validation requirements
* Maintenance contracts for equipment and calibration procedures

---

### 3. 📄 Local Contract Execution Support

**Simple file-based access for execution modules:**

* SmartContract execution modules read contracts directly from local folders
* **No version management at node level** - always current version
* Contracts contain **pure logic only** for execution
* Local storage supports offline contract execution

**Execution integration:**

* ComplianceNodeEnforcer reads from `/Processes/Compliance/`
* MaintenanceNode reads from `/Processes/Maintenance/`
* StandardsNodeEnforcer reads from `/Processes/Standards/`
* Special Process modules read from `/Processes/SP/`

---

### 4. 📂 Local Contract Access

**Simple file-based contract access for node modules:**

* **ComplianceNodeEnforcer**: Reads SmartCompliance contracts from `/Processes/Compliance/`
* **MaintenanceNode**: Reads SmartMaintenance contracts from `/Processes/Maintenance/`
* **StandardsNodeEnforcer**: Reads SmartStandards contracts from `/Processes/Standards/`
* **Special Process Modules**: Read SmartSP contracts from `/Processes/SP/`

**All contract execution is logged to SMART-Ledger** - storage is just file access.

---

## 🔒 Storage & Access

### Node Storage Characteristics:

* **Read-only storage** - nodes cannot create or modify contracts
* **Automatic updates** - new contract versions replace existing files
* **Local access only** - contracts stored for offline execution
* **Node-specific filtering** - only receives relevant contracts

### File Management:

* Contracts deployed by contract creation modules
* Files organized by contract type in folder structure
* Simple file system access for execution modules
* No local version control - always current version

---

## 🛠️ Node Integration

| Module                    | Local Storage Access                                        |
| ------------------------- | ------------------------------------------------------------|
| `ComplianceNodeEnforcer`  | Reads SmartCompliance contracts from `/Compliance/`         |
| `MaintenanceNode`         | Reads SmartMaintenance contracts from `/Maintenance/`       |
| `StandardsNodeEnforcer`   | Reads SmartStandards contracts from `/Standards/`           |
| `Special Process Modules` | Read SmartSP contracts from `/SP/`                          |
| `SMART-Ledger`            | Logs all contract executions (not storage)                  |
| `Contract Creators`       | Deploy contracts to node storage (ComplianceCentral, etc.)  |

---

## 🚀 Node Storage Benefits

* **Simple file-based access** for all contract execution modules
* **Offline-capable** contract execution with local storage
* **Automatic updates** ensure nodes always have current contracts
* **Clean folder organization** makes contract access predictable
* **Node-specific filtering** reduces storage overhead and complexity

---
## 📁 Architecture

### File: `SMART_policy_node_storage.py`

* **Class**: `SmartPolicyNodeStorage`
* **Core Methods**:

  * `receive_contract()` - Accept contract deployment from hub
  * `store_contract()` - Save contract to appropriate folder
  * `get_contract()` - Retrieve contract for execution module
  * `list_contracts()` - List available contracts by type
  * `update_contract()` - Replace existing contract with new version
  * `verify_contract_integrity()` - Validate contract file integrity
  * `get_storage_status()` - Query storage state for monitoring

### Contract Storage Workflow Example

```python
# Example: Receive and store SmartCompliance contract from ComplianceCentral

1. ComplianceCentral deploys new compliance contract to NODE-LP-001
2. PolicyNodeStorage receives contract deployment message
3. Storage extracts contract type: "SmartCompliance"
4. Storage determines folder: "/Processes/Compliance/"
5. Storage saves contract: "Testing-Checklist.yaml"
6. Storage verifies file integrity with hash check
7. Storage logs contract deployment to SMART-Ledger
8. ComplianceNodeEnforcer reads contract from local storage
9. Contract executed autonomously for testing operations
10. All contract executions logged separately by enforcement modules
```

### Contract File Organization

```
/opt/smart/contracts/
  /SP/
    LP-Green.yaml              (Liquid Penetrant special process)
    CP-RedDye.yaml             (Chemical Processing special process)
  /Compliance/
    Testing-Checklist.yaml     (Pre-test compliance requirements)
    Safety-Protocol.yaml       (Safety compliance rules)
  /Standards/
    ASTM-E165.yaml            (LP testing standard)
    ISO9712.yaml              (Personnel certification standard)
  /Maintenance/
    Daily-Calibration.yaml    (Equipment calibration schedule)
    Equipment-Check.yaml      (Maintenance verification)
```

### Example Code Structure

```python
from server.smart_ledger import get_ledger
from datetime import datetime, timezone
from typing import Dict, List, Optional
import yaml
import hashlib
from pathlib import Path
import shutil

class SmartPolicyNodeStorage:
    def __init__(self, node_id: str, station_type: str):
        self.node_id = node_id
        self.station_type = station_type
        
        # Get ledger instance - reports storage operations, doesn't write directly
        self.ledger = get_ledger("policy_storage")
        
        # Base storage path
        self.storage_base = Path("/opt/smart/contracts")
        
        # Contract type folders
        self.folders = {
            "SmartSP": self.storage_base / "SP",
            "SmartCompliance": self.storage_base / "Compliance",
            "SmartStandards": self.storage_base / "Standards",
            "SmartMaintenance": self.storage_base / "Maintenance",
            "SmartSafety": self.storage_base / "Safety",
            "SmartInventory": self.storage_base / "Inventory"
        }
        
        # Initialize folder structure
        self._initialize_storage()
    
    def _initialize_storage(self):
        """
        Create folder structure for contract storage
        """
        for contract_type, folder_path in self.folders.items():
            folder_path.mkdir(parents=True, exist_ok=True)
        
        # Report storage initialization to SMART-Ledger
        self.ledger.record_action(
            action_type="storage",
            action="initialize",
            target=self.node_id,
            details=f"Policy storage initialized with {len(self.folders)} contract folders",
            user_id="system",
            smart_id=self.node_id,
            metadata={
                "storage_base": str(self.storage_base),
                "folders": list(self.folders.keys())
            }
        )
    
    def receive_contract(self, deployment_message: dict) -> dict:
        """
        Accept contract deployment from hub (ComplianceCentral, MaintenanceCentral, etc.)
        Returns receipt confirmation with storage location
        """
        contract_id = deployment_message['contract_id']
        contract_type = deployment_message['contract_type']
        contract_data = deployment_message['contract']
        contract_hash = deployment_message.get('contract_hash')
        
        # Verify contract type is supported
        if contract_type not in self.folders:
            return {
                "success": False,
                "error": f"Unsupported contract type: {contract_type}"
            }
        
        # Verify contract hash if provided
        calculated_hash = self._calculate_hash(contract_data)
        if contract_hash and calculated_hash != contract_hash:
            return {
                "success": False,
                "error": "Contract hash mismatch - integrity check failed"
            }
        
        # Store contract
        storage_result = self.store_contract(contract_id, contract_type, contract_data)
        
        if storage_result['success']:
            result = {
                "success": True,
                "contract_id": contract_id,
                "contract_type": contract_type,
                "storage_path": storage_result['storage_path'],
                "received_timestamp": datetime.now(timezone.utc).isoformat()
            }
        else:
            result = storage_result
        
        # Report contract reception to SMART-Ledger
        self.ledger.record_action(
            action_type="storage",
            action="receive_contract",
            target=contract_id,
            details=f"Contract received: {contract_type} - {contract_id}",
            user_id="system",
            smart_id=self.node_id,
            metadata=result
        )
        
        return result
    
    def store_contract(self, contract_id: str, contract_type: str, contract_data: dict) -> dict:
        """
        Save contract to appropriate folder
        Returns storage result with file path
        """
        # Determine storage folder
        folder = self.folders.get(contract_type)
        
        if not folder:
            return {
                "success": False,
                "error": f"Unknown contract type: {contract_type}"
            }
        
        # Generate filename from contract ID
        filename = f"{contract_id}.yaml"
        file_path = folder / filename
        
        try:
            # Check if contract already exists (update case)
            is_update = file_path.exists()
            
            # Write contract to file
            with open(file_path, 'w') as f:
                yaml.dump(contract_data, f, default_flow_style=False)
            
            # Verify file integrity
            verification = self.verify_contract_integrity(str(file_path), contract_data)
            
            if not verification['valid']:
                # Integrity check failed - remove file
                file_path.unlink()
                return {
                    "success": False,
                    "error": "Contract integrity verification failed after storage"
                }
            
            result = {
                "success": True,
                "contract_id": contract_id,
                "contract_type": contract_type,
                "storage_path": str(file_path),
                "is_update": is_update,
                "file_size": file_path.stat().st_size,
                "stored_timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            # Report storage to SMART-Ledger
            action = "update_contract" if is_update else "store_contract"
            self.ledger.record_action(
                action_type="storage",
                action=action,
                target=contract_id,
                details=f"Contract stored: {filename} ({result['file_size']} bytes)",
                user_id="system",
                smart_id=self.node_id,
                metadata=result
            )
            
            return result
            
        except Exception as e:
            error_result = {
                "success": False,
                "error": str(e),
                "contract_id": contract_id,
                "contract_type": contract_type
            }
            
            # Report storage failure to SMART-Ledger
            self.ledger.record_action(
                action_type="storage",
                action="storage_failed",
                target=contract_id,
                details=f"Contract storage failed: {str(e)}",
                user_id="system",
                smart_id=self.node_id,
                metadata=error_result
            )
            
            return error_result
    
    def get_contract(self, contract_id: str, contract_type: str = None) -> Optional[dict]:
        """
        Retrieve contract for execution module
        Returns contract data or None if not found
        """
        # If contract type specified, look in specific folder
        if contract_type:
            folder = self.folders.get(contract_type)
            if folder:
                file_path = folder / f"{contract_id}.yaml"
                if file_path.exists():
                    return self._load_contract_file(file_path)
        
        # Contract type not specified - search all folders
        for contract_type, folder in self.folders.items():
            file_path = folder / f"{contract_id}.yaml"
            if file_path.exists():
                return self._load_contract_file(file_path)
        
        return None
    
    def _load_contract_file(self, file_path: Path) -> Optional[dict]:
        """
        Load contract from file and return data
        """
        try:
            with open(file_path, 'r') as f:
                contract = yaml.safe_load(f)
            
            # Add storage metadata
            contract['_storage_metadata'] = {
                "file_path": str(file_path),
                "file_size": file_path.stat().st_size,
                "last_modified": datetime.fromtimestamp(
                    file_path.stat().st_mtime,
                    tz=timezone.utc
                ).isoformat()
            }
            
            return contract
            
        except Exception as e:
            # Report load failure to SMART-Ledger
            self.ledger.record_action(
                action_type="storage",
                action="load_failed",
                target=str(file_path),
                details=f"Contract load failed: {str(e)}",
                user_id="system",
                smart_id=self.node_id,
                metadata={"error": str(e)}
            )
            
            return None
    
    def list_contracts(self, contract_type: str = None) -> List[dict]:
        """
        List available contracts by type
        Returns list of contract summaries
        """
        contracts = []
        
        # Determine which folders to scan
        if contract_type:
            folders_to_scan = {contract_type: self.folders.get(contract_type)}
        else:
            folders_to_scan = self.folders
        
        # Scan each folder
        for ctype, folder in folders_to_scan.items():
            if not folder or not folder.exists():
                continue
            
            for file_path in folder.glob("*.yaml"):
                try:
                    stat = file_path.stat()
                    
                    contracts.append({
                        "contract_id": file_path.stem,
                        "contract_type": ctype,
                        "file_path": str(file_path),
                        "file_size": stat.st_size,
                        "last_modified": datetime.fromtimestamp(
                            stat.st_mtime,
                            tz=timezone.utc
                        ).isoformat()
                    })
                except Exception:
                    continue
        
        return contracts
    
    def update_contract(self, contract_id: str, contract_type: str, contract_data: dict) -> dict:
        """
        Replace existing contract with new version
        Returns update result
        """
        folder = self.folders.get(contract_type)
        
        if not folder:
            return {
                "success": False,
                "error": f"Unknown contract type: {contract_type}"
            }
        
        file_path = folder / f"{contract_id}.yaml"
        
        if not file_path.exists():
            return {
                "success": False,
                "error": f"Contract not found: {contract_id}"
            }
        
        # Backup existing contract
        backup_path = folder / f"{contract_id}.backup"
        try:
            shutil.copy2(file_path, backup_path)
        except Exception:
            pass
        
        # Store new version (will overwrite existing)
        result = self.store_contract(contract_id, contract_type, contract_data)
        
        # Remove backup if successful
        if result['success'] and backup_path.exists():
            backup_path.unlink()
        
        return result
    
    def verify_contract_integrity(self, file_path: str, expected_data: dict = None) -> dict:
        """
        Validate contract file integrity
        Returns verification result
        """
        path = Path(file_path)
        
        if not path.exists():
            return {
                "valid": False,
                "error": "Contract file not found"
            }
        
        try:
            # Load file
            with open(path, 'r') as f:
                file_content = f.read()
            
            # Parse YAML
            contract_data = yaml.safe_load(file_content)
            
            # If expected data provided, compare
            if expected_data:
                file_hash = self._calculate_hash(contract_data)
                expected_hash = self._calculate_hash(expected_data)
                
                if file_hash != expected_hash:
                    return {
                        "valid": False,
                        "error": "Contract data mismatch",
                        "file_hash": file_hash,
                        "expected_hash": expected_hash
                    }
            
            return {
                "valid": True,
                "file_path": str(path),
                "file_size": path.stat().st_size,
                "contract_id": contract_data.get('smart_contract_id'),
                "contract_type": contract_data.get('contract_type')
            }
            
        except Exception as e:
            return {
                "valid": False,
                "error": f"Integrity check failed: {str(e)}"
            }
    
    def get_storage_status(self) -> dict:
        """
        Query storage state for monitoring and dashboard
        Returns storage status summary
        """
        status = {
            "node_id": self.node_id,
            "station_type": self.station_type,
            "storage_base": str(self.storage_base),
            "folders": {},
            "total_contracts": 0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Scan each folder
        for contract_type, folder in self.folders.items():
            if folder.exists():
                contracts = list(folder.glob("*.yaml"))
                status['folders'][contract_type] = {
                    "path": str(folder),
                    "contract_count": len(contracts),
                    "contracts": [c.stem for c in contracts]
                }
                status['total_contracts'] += len(contracts)
            else:
                status['folders'][contract_type] = {
                    "path": str(folder),
                    "contract_count": 0,
                    "contracts": []
                }
        
        return status
    
    # Helper methods
    
    def _calculate_hash(self, data: dict) -> str:
        """Calculate hash of contract data for integrity verification"""
        data_str = yaml.dump(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()
```

---
## 🧾 Final Notes

The SMART-Policy Repository is no longer just a static policy list—it’s an **active execution governor**.

Every rule can be proven. Every action is tied to a policy. And every node—local or enterprise—plays by the same enforceable book.

**SMART-Policy Repository: Structured Enforcement. Proven Logic. Immutable Accountability.**

