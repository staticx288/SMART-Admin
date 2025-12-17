# 📦 SMART-InventoryNodeAgent Framework

**Digital Employee. Contract Enforcer. Readiness Guardian.**

---

## 🧠 Overview

The **SMART-InventoryNodeAgent** is a **module component** that functions as a **digital employee** running on every SMART Node. Like a human worker tasked with managing local inventory, this module knows what it is supposed to have (defined by one or more SmartContracts), verifies inventory conditions, and raises structured requests when restock is required. It operates as part of the node ecosystem, under strict contract governance, and logs all activity immutably.

---

## 👷 Operational Model

| Role                  | Behavior                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| **Contract Follower** | Enforces `SmartInventoryContract` and other attached logic (safety, compliance, maintenance)           |
| **Stock Monitor**     | Tracks all additions, uses, expirations, and contract-based thresholds                                 |
| **Live Coordinator**  | Maintains an open connection with the Central Hub for continuous inventory visibility and coordination |
| **Ledger Reporter**   | Writes all inventory activity to `SMART-Ledger` without exceptions                                     |

---

## ⚙️ Core Functions

### 📦 **Contract-Governed Inventory Enforcement**

- Enforces `SmartInventory` as its baseline job definition
- Validates each item on receipt, use, or disposal against contract rules
- Applies additional contract logic when relevant:
  - `SmartSafety` – hazard-specific handling, token restrictions
  - `SmartMaintenance` – tracks consumables linked to equipment servicing

### 🧠 **Autonomous Monitoring**

- Detects:
  - Quantity below contract minimum
  - Expired or non-conforming stock
  - Unauthorized attempts to withdraw or interact
- Prevents actions that violate contract rules
- Manual updates are possible if authorized staff adjust inventory directly

### 📡 **Hub Communication Model**

The SMART-InventoryNodeAgent is **the only module on the Node authorized to maintain a direct connection to the Central Hub**. This is a contract-controlled channel used exclusively for inventory coordination and enterprise-level visibility — not for control or override.

- **Threshold-Based Reporting**: If an active contract requires it, the agent sends structured updates to Central when minimum stock levels are breached or exceptions occur.
- **Optional End-of-Day Sync**: Contracts may define a daily reporting schedule to transmit local inventory snapshots for Central review and forecasting.
- **One-Way Flow**: Central may **receive data** but never commands this agent. All communication is outbound and contract-triggered.
- **Direct & Open Channel**: This connection is straightforward, used solely for real-time inventory visibility and restock coordination with the Hub. No special permissions or encryption layers are required.

### 🧾 **Immutable Ledger Logging**

- Every inventory action (in, out, invalid attempt, expiration, disposal) is written to SMART-Ledger
- Includes:
  - Timestamp
  - Contract ID & Hash
  - Operator SMART-ID (if applicable)
  - Action Type (e.g., `WITHDRAWAL_ATTEMPT_DENIED`, `INVENTORY_REPLENISHED`, `STOCK BELOW MINIMUM`)

---

## 🛡️ Governance & Enforcement

| Principle                    | Enforced Behavior                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Direct Central Link**      | This module maintains a persistent, contract-authorized connection to Central for live coordination.         |
| **Inventory Only**           | This is not a general-purpose control path — it is used strictly for material availability and coordination. |
| **Contract-Driven Logic**    | All replenishment expectations, reporting schedules, and thresholds are defined in SmartInventoryContracts.  |
| **No Token Access Required** | Inventory checks, updates, and replenishment workflows do not require SMART-ID or identity enforcement.      |
|                              |                                                                                                              |

---

## 🔗 Module Interactions

This module operates within the node ecosystem — it follows contract logic, logs outcomes, and coordinates with other node modules as needed.

| Interaction                | Description                                                          |
| -------------------------- | -------------------------------------------------------------------- |
| **SmartInventory**         | Primary rule source for quantity, timing, handling                   |
| **Optional Contracts**     | `SmartSafety`, `SmartCompliance`, `SmartMaintenance` (if referenced) |
| **SMART-ID**               | Controls who may perform inventory actions                           |
| **SMART-Ledger**           | Immutable log destination, not an integration point                  |

---

## 📦 Deployment

- **Module Component**: Runs on every operational Node requiring part/material tracking (Paint, LP, CP, Warehouse, etc.)
- **Integration**: Local SmartContract files, SMART-ID, SMART-Ledger
- **Interface**: Only through dashboard widgets (view-only) and operator request tools (if permitted by contract)

---

## 🚀 Strategic Advantages

| Feature                     | Benefit                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| **Fully Autonomous**        | Does not require live hub access or external triggers                 |
| **Contract-Centric**        | Everything is rules-first — no manual guesswork                       |
| **Immutably Logged**        | Every action verifiable during audit or investigation                 |
| **Signal-Based Escalation** | Hubs are only contacted when there's something to act on              |
| **No Bypass**               | If the rule says "no access" or "do not use," the module enforces it. |

---
## 📁 Architecture

### File: `SMART_inventory_node_agent.py`

* **Class**: `SmartInventoryNodeAgent`
* **Core Methods**:

  * `load_inventory_contract()` - Load SmartInventory contract defining rules
  * `validate_inventory_action()` - Check action against contract rules
  * `record_receipt()` - Log incoming inventory items
  * `process_withdrawal()` - Validate and execute material withdrawal
  * `check_quantity_thresholds()` - Monitor stock levels against minimums
  * `check_expiration_dates()` - Detect expired or expiring materials
  * `send_hub_coordination()` - Report threshold breaches to Central Hub
  * `generate_inventory_report()` - Daily snapshot for Hub sync

### Contract-Enforced Inventory Workflow Example

```python
# Example: Inventory agent manages penetrant materials at LP testing station

1. Node agent loads SmartInventory contract (penetrant materials)
2. Contract defines:
   - minimum_quantity: 5 bottles penetrant, 3 bottles developer
   - expiration_enforcement: true
   - withdrawal_requires_smart_id: true
   - hub_coordination_threshold: 2 (notify when below 2 bottles)
3. Operator USR-12345 attempts to withdraw penetrant bottle
4. Agent validates: operator certified (NDT Level 2), inventory above minimum
5. Withdrawal approved, quantity updated: 6 → 5 bottles
6. Action logged to SMART-Ledger with operator ID
7. Agent checks thresholds: still above minimum (5 >= 5)
8. End of shift: agent detects expiration date approaching (7 days)
9. Agent sends coordination message to Central Hub: "Expiring stock detected"
10. Next morning: new shipment arrives, receipt recorded, quantity: 5 → 10
11. All inventory actions immutably logged with contract reference
```

### Inventory Item States

* **in_stock** - Available inventory above minimum threshold
* **low_stock** - Quantity at or below contract minimum
* **critical** - Quantity below coordination threshold, Hub notified
* **expired** - Past expiration date, contract prevents use
* **expiring_soon** - Within warning period (typically 7-30 days)
* **quarantined** - Failed validation, awaiting disposal/return
* **authorized_withdrawal** - Item checked out by authorized operator
* **unauthorized_attempt** - Withdrawal blocked by contract rules

### Example Code Structure

```python
from server.smart_ledger import get_ledger
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
import yaml
from pathlib import Path

class SmartInventoryNodeAgent:
    def __init__(self, node_id: str, station_type: str):
        self.node_id = node_id
        self.station_type = station_type
        self.loaded_contracts = {}
        self.inventory = {}
        self.hub_connection = None
        
        # Get ledger instance - reports inventory actions, doesn't write directly
        self.ledger = get_ledger("inventory_agent")
        
        # Contract storage path
        self.contract_path = Path("/opt/smart/inventory-contracts")
        
        # Hub coordination endpoint
        self.hub_endpoint = "http://central-hub:8080/inventory-coordination"
        
    def load_inventory_contract(self, contract_id: str) -> dict:
        """
        Load SmartInventory contract defining inventory rules
        Returns loaded contract with enforcement parameters
        """
        contract_file = self.contract_path / f"{contract_id}.yaml"
        
        if not contract_file.exists():
            return {"error": "Contract not found"}
        
        with open(contract_file, 'r') as f:
            contract = yaml.safe_load(f)
        
        # Store contract for enforcement
        self.loaded_contracts[contract_id] = contract
        
        # Initialize inventory tracking from contract
        for item in contract.get('inventory_items', []):
            item_id = item['item_id']
            self.inventory[item_id] = {
                "item_id": item_id,
                "description": item['description'],
                "current_quantity": item.get('initial_quantity', 0),
                "minimum_quantity": item['minimum_quantity'],
                "coordination_threshold": item.get('coordination_threshold', 0),
                "expiration_enforcement": item.get('expiration_enforcement', True),
                "withdrawal_requires_smart_id": item.get('withdrawal_requires_smart_id', False),
                "lot_tracking": [],
                "status": "in_stock"
            }
        
        # Report contract loading to SMART-Ledger
        self.ledger.record_action(
            action_type="inventory",
            action="load_contract",
            target=contract_id,
            details=f"Inventory contract loaded with {len(contract.get('inventory_items', []))} items",
            user_id="system",
            smart_id=self.node_id,
            metadata={
                "contract_id": contract_id,
                "item_count": len(contract.get('inventory_items', []))
            }
        )
        
        return contract
    
    def validate_inventory_action(self, action: dict) -> dict:
        """
        Check inventory action against contract rules
        Returns validation result with approval/denial
        """
        action_type = action['action_type']
        item_id = action['item_id']
        operator_id = action.get('operator_id')
        
        item = self.inventory.get(item_id)
        
        if not item:
            return {
                "approved": False,
                "reason": "Item not found in inventory",
                "item_id": item_id
            }
        
        # Get contract rules for this item
        contract_id = action.get('contract_id')
        contract = self.loaded_contracts.get(contract_id, {})
        
        validation_checks = {
            "item_exists": True,
            "quantity_available": False,
            "operator_authorized": False,
            "not_expired": False,
            "contract_allows": False
        }
        
        # Check quantity availability
        if action_type == "withdrawal":
            requested_quantity = action.get('quantity', 1)
            validation_checks['quantity_available'] = item['current_quantity'] >= requested_quantity
        
        # Check operator authorization
        if item['withdrawal_requires_smart_id']:
            if operator_id and self._verify_operator_authorization(operator_id, item_id):
                validation_checks['operator_authorized'] = True
        else:
            validation_checks['operator_authorized'] = True
        
        # Check expiration enforcement
        if item['expiration_enforcement']:
            lot_number = action.get('lot_number')
            if lot_number:
                lot_info = self._get_lot_info(item_id, lot_number)
                if lot_info and not self._is_expired(lot_info['expiration_date']):
                    validation_checks['not_expired'] = True
            else:
                # No specific lot requested - check if any non-expired stock available
                validation_checks['not_expired'] = self._has_valid_stock(item_id)
        else:
            validation_checks['not_expired'] = True
        
        # Check contract-specific rules
        if contract:
            contract_rules = contract.get('withdrawal_rules', {})
            validation_checks['contract_allows'] = self._check_contract_rules(
                action, contract_rules
            )
        else:
            validation_checks['contract_allows'] = True
        
        # Overall approval decision
        approved = all(validation_checks.values())
        
        result = {
            "approved": approved,
            "item_id": item_id,
            "action_type": action_type,
            "validation_checks": validation_checks,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        if not approved:
            result['denial_reasons'] = [
                key for key, value in validation_checks.items() if not value
            ]
        
        return result
    
    def record_receipt(self, receipt: dict) -> dict:
        """
        Log incoming inventory items and update quantities
        Returns receipt confirmation with updated inventory
        """
        item_id = receipt['item_id']
        quantity = receipt['quantity']
        lot_number = receipt.get('lot_number')
        expiration_date = receipt.get('expiration_date')
        
        item = self.inventory.get(item_id)
        
        if not item:
            return {"error": "Item not tracked in inventory"}
        
        # Update quantity
        previous_quantity = item['current_quantity']
        item['current_quantity'] += quantity
        
        # Track lot information if provided
        if lot_number:
            lot_info = {
                "lot_number": lot_number,
                "quantity": quantity,
                "expiration_date": expiration_date,
                "received_date": datetime.now(timezone.utc).isoformat(),
                "status": "active"
            }
            item['lot_tracking'].append(lot_info)
        
        # Update item status
        item['status'] = self._determine_item_status(item)
        
        result = {
            "success": True,
            "item_id": item_id,
            "previous_quantity": previous_quantity,
            "added_quantity": quantity,
            "new_quantity": item['current_quantity'],
            "lot_number": lot_number,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Report receipt to SMART-Ledger
        self.ledger.record_action(
            action_type="inventory",
            action="record_receipt",
            target=item_id,
            details=f"Received {quantity} units of {item['description']}",
            user_id="system",
            smart_id=self.node_id,
            metadata=result
        )
        
        # Check if this receipt resolved low stock condition
        if previous_quantity < item['minimum_quantity'] and item['current_quantity'] >= item['minimum_quantity']:
            self.send_hub_coordination({
                "alert_type": "threshold_resolved",
                "item_id": item_id,
                "previous_quantity": previous_quantity,
                "new_quantity": item['current_quantity']
            })
        
        return result
    
    def process_withdrawal(self, withdrawal: dict) -> dict:
        """
        Validate and execute material withdrawal from inventory
        Returns withdrawal result with updated quantities
        """
        # Validate action against contract rules
        validation = self.validate_inventory_action({
            "action_type": "withdrawal",
            **withdrawal
        })
        
        if not validation['approved']:
            # Withdrawal denied - log denial
            self.ledger.record_action(
                action_type="inventory",
                action="withdrawal_denied",
                target=withdrawal['item_id'],
                details=f"Withdrawal denied: {', '.join(validation['denial_reasons'])}",
                user_id=withdrawal.get('operator_id', "unknown"),
                smart_id=self.node_id,
                metadata=validation
            )
            
            return {
                "success": False,
                "approved": False,
                "validation": validation
            }
        
        # Withdrawal approved - execute
        item_id = withdrawal['item_id']
        quantity = withdrawal.get('quantity', 1)
        lot_number = withdrawal.get('lot_number')
        operator_id = withdrawal.get('operator_id')
        
        item = self.inventory[item_id]
        previous_quantity = item['current_quantity']
        item['current_quantity'] -= quantity
        
        # Update lot tracking if specific lot withdrawn
        if lot_number:
            self._update_lot_quantity(item_id, lot_number, -quantity)
        
        # Update item status
        item['status'] = self._determine_item_status(item)
        
        result = {
            "success": True,
            "approved": True,
            "item_id": item_id,
            "previous_quantity": previous_quantity,
            "withdrawn_quantity": quantity,
            "new_quantity": item['current_quantity'],
            "lot_number": lot_number,
            "operator_id": operator_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Report withdrawal to SMART-Ledger
        self.ledger.record_action(
            action_type="inventory",
            action="process_withdrawal",
            target=item_id,
            details=f"Withdrawal: {quantity} units by {operator_id}",
            user_id=operator_id,
            smart_id=self.node_id,
            metadata=result
        )
        
        # Check thresholds after withdrawal
        self.check_quantity_thresholds(item_id)
        
        return result
    
    def check_quantity_thresholds(self, item_id: str = None):
        """
        Monitor stock levels against contract minimums
        Sends Hub coordination when thresholds breached
        """
        items_to_check = [item_id] if item_id else self.inventory.keys()
        
        for iid in items_to_check:
            item = self.inventory.get(iid)
            
            if not item:
                continue
            
            current = item['current_quantity']
            minimum = item['minimum_quantity']
            coordination_threshold = item['coordination_threshold']
            
            # Check critical threshold (Hub coordination required)
            if current <= coordination_threshold:
                item['status'] = "critical"
                self.send_hub_coordination({
                    "alert_type": "critical_threshold",
                    "item_id": iid,
                    "description": item['description'],
                    "current_quantity": current,
                    "coordination_threshold": coordination_threshold,
                    "minimum_quantity": minimum,
                    "severity": "high"
                })
                
                # Report critical status to SMART-Ledger
                self.ledger.record_action(
                    action_type="inventory",
                    action="critical_threshold",
                    target=iid,
                    details=f"CRITICAL: {item['description']} at {current} units (threshold: {coordination_threshold})",
                    user_id="system",
                    smart_id=self.node_id,
                    metadata={
                        "current_quantity": current,
                        "coordination_threshold": coordination_threshold
                    }
                )
            
            # Check low stock (at minimum)
            elif current <= minimum:
                item['status'] = "low_stock"
                
                # Report low stock to SMART-Ledger
                self.ledger.record_action(
                    action_type="inventory",
                    action="low_stock",
                    target=iid,
                    details=f"LOW STOCK: {item['description']} at minimum ({current} units)",
                    user_id="system",
                    smart_id=self.node_id,
                    metadata={
                        "current_quantity": current,
                        "minimum_quantity": minimum
                    }
                )
    
    def check_expiration_dates(self):
        """
        Detect expired or expiring materials
        Quarantines expired items, notifies Hub of expiring items
        """
        today = datetime.now(timezone.utc)
        warning_period = timedelta(days=7)
        
        for item_id, item in self.inventory.items():
            if not item['expiration_enforcement']:
                continue
            
            for lot in item['lot_tracking']:
                if lot['status'] != 'active':
                    continue
                
                exp_date = datetime.fromisoformat(lot['expiration_date'])
                days_until_expiration = (exp_date - today).days
                
                # Check if expired
                if days_until_expiration < 0:
                    lot['status'] = "expired"
                    
                    # Report expiration to SMART-Ledger
                    self.ledger.record_action(
                        action_type="inventory",
                        action="material_expired",
                        target=item_id,
                        details=f"EXPIRED: Lot {lot['lot_number']} of {item['description']}",
                        user_id="system",
                        smart_id=self.node_id,
                        metadata={
                            "lot_number": lot['lot_number'],
                            "expiration_date": lot['expiration_date'],
                            "days_overdue": abs(days_until_expiration)
                        }
                    )
                    
                    # Notify Hub of expired material
                    self.send_hub_coordination({
                        "alert_type": "material_expired",
                        "item_id": item_id,
                        "lot_number": lot['lot_number'],
                        "expiration_date": lot['expiration_date']
                    })
                
                # Check if expiring soon
                elif days_until_expiration <= 7:
                    # Report expiring soon to SMART-Ledger
                    self.ledger.record_action(
                        action_type="inventory",
                        action="expiring_soon",
                        target=item_id,
                        details=f"EXPIRING: Lot {lot['lot_number']} expires in {days_until_expiration} days",
                        user_id="system",
                        smart_id=self.node_id,
                        metadata={
                            "lot_number": lot['lot_number'],
                            "expiration_date": lot['expiration_date'],
                            "days_remaining": days_until_expiration
                        }
                    )
                    
                    # Notify Hub of expiring material
                    self.send_hub_coordination({
                        "alert_type": "expiring_soon",
                        "item_id": item_id,
                        "lot_number": lot['lot_number'],
                        "days_remaining": days_until_expiration
                    })
    
    def send_hub_coordination(self, message: dict):
        """
        Report threshold breaches and alerts to Central Hub
        Direct connection for inventory coordination only
        """
        coordination_message = {
            "source_node": self.node_id,
            "station_type": self.station_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **message
        }
        
        try:
            # Send to Hub coordination endpoint
            # Implementation would use actual HTTP/WebSocket connection
            response = self._send_to_hub(coordination_message)
            
            # Report Hub coordination to SMART-Ledger
            self.ledger.record_action(
                action_type="inventory",
                action="hub_coordination",
                target=message.get('item_id', 'general'),
                details=f"Hub coordination: {message['alert_type']}",
                user_id="system",
                smart_id=self.node_id,
                metadata=coordination_message
            )
            
        except Exception as e:
            # Report coordination failure to SMART-Ledger
            self.ledger.record_action(
                action_type="inventory",
                action="hub_coordination_failed",
                target=message.get('item_id', 'general'),
                details=f"Hub coordination failed: {str(e)}",
                user_id="system",
                smart_id=self.node_id,
                metadata={"error": str(e)}
            )
    
    def generate_inventory_report(self) -> dict:
        """
        Generate daily inventory snapshot for Hub sync
        Contract may define reporting schedule
        """
        report = {
            "node_id": self.node_id,
            "station_type": self.station_type,
            "report_timestamp": datetime.now(timezone.utc).isoformat(),
            "items": []
        }
        
        for item_id, item in self.inventory.items():
            item_summary = {
                "item_id": item_id,
                "description": item['description'],
                "current_quantity": item['current_quantity'],
                "minimum_quantity": item['minimum_quantity'],
                "status": item['status'],
                "lot_count": len(item['lot_tracking']),
                "active_lots": [
                    lot['lot_number'] for lot in item['lot_tracking']
                    if lot['status'] == 'active'
                ]
            }
            report['items'].append(item_summary)
        
        # Report daily snapshot to SMART-Ledger
        self.ledger.record_action(
            action_type="inventory",
            action="daily_report",
            target=self.node_id,
            details=f"Daily inventory report: {len(report['items'])} items",
            user_id="system",
            smart_id=self.node_id,
            metadata={
                "item_count": len(report['items']),
                "low_stock_count": sum(1 for item in self.inventory.values() if item['status'] == 'low_stock'),
                "critical_count": sum(1 for item in self.inventory.values() if item['status'] == 'critical')
            }
        )
        
        # Send to Hub if contract requires
        self.send_hub_coordination({
            "alert_type": "daily_report",
            "report": report
        })
        
        return report
    
    def get_inventory_status(self, item_id: str = None) -> dict:
        """
        Get current inventory status for dashboard display
        """
        if item_id:
            item = self.inventory.get(item_id)
            if not item:
                return {"error": "Item not found"}
            return item
        else:
            return {
                "node_id": self.node_id,
                "inventory": self.inventory,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    # Helper methods
    
    def _verify_operator_authorization(self, operator_id: str, item_id: str) -> bool:
        """Check if operator authorized for this item"""
        # Implementation would verify against SMART-ID system
        return True
    
    def _get_lot_info(self, item_id: str, lot_number: str) -> Optional[dict]:
        """Retrieve lot information"""
        item = self.inventory.get(item_id)
        if not item:
            return None
        
        for lot in item['lot_tracking']:
            if lot['lot_number'] == lot_number:
                return lot
        return None
    
    def _is_expired(self, expiration_date: str) -> bool:
        """Check if expiration date has passed"""
        exp_date = datetime.fromisoformat(expiration_date)
        return datetime.now(timezone.utc) > exp_date
    
    def _has_valid_stock(self, item_id: str) -> bool:
        """Check if any non-expired stock available"""
        item = self.inventory.get(item_id)
        if not item:
            return False
        
        for lot in item['lot_tracking']:
            if lot['status'] == 'active' and not self._is_expired(lot['expiration_date']):
                return True
        return False
    
    def _check_contract_rules(self, action: dict, rules: dict) -> bool:
        """Verify action against contract-specific rules"""
        # Implementation would check various contract rules
        return True
    
    def _update_lot_quantity(self, item_id: str, lot_number: str, quantity_change: int):
        """Update quantity for specific lot"""
        lot = self._get_lot_info(item_id, lot_number)
        if lot:
            lot['quantity'] += quantity_change
            if lot['quantity'] <= 0:
                lot['status'] = 'depleted'
    
    def _determine_item_status(self, item: dict) -> str:
        """Determine current status based on quantity and thresholds"""
        current = item['current_quantity']
        minimum = item['minimum_quantity']
        coordination = item['coordination_threshold']
        
        if current <= coordination:
            return "critical"
        elif current <= minimum:
            return "low_stock"
        else:
            return "in_stock"
    
    def _send_to_hub(self, message: dict) -> dict:
        """Send message to Hub coordination endpoint"""
        # Implementation would use actual HTTP/WebSocket
        return {"success": True}
```

---
## 🧾 Closing Statement

The **SMART-InventoryNodeAgent** is the **machine-level equivalent of a disciplined inventory technician**: it knows the rules, follows them without exception, and notifies its manager (Hub) only when action is required. It never improvises, never ignores a problem, and never lets a contract be violated silently.

**It doesn’t order parts. It doesn’t ask for permission. It follows the rulebook — and signals when it’s time for the manager to step in.**