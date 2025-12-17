# 🚚 SMART-LogisticsNode Framework

**QR-Driven Part Handling. Shipping & Receiving Station. Vision Integration.**

SMART-LogisticsNode operates at the **single Shipping & Receiving station** to handle part intake and outtake operations. It works directly with SMART-Vision for part verification and is driven by **SmartContract QR codes** for package identification and routing.

---

## 🌐 Core Functions

### **QR-Driven Part Intake**
- Scans SmartContract QR codes on incoming packages 
- Retrieves SmartContract data and part specifications from QR code information
- Coordinates with SMART-Vision for visual part verification against expected images
- Routes verified parts to appropriate testing stations based on SmartContract requirements

### **Part Verification & Routing**
- Works with SMART-Vision system for incoming part validation
- Compares physical parts with SmartContract reference images
- Processes part verification results (confirmed/rejected/quarantined)
- Routes confirmed parts to designated testing stations or quarantines rejected parts

### **Outbound Part Processing**
- Handles completed parts returning from testing stations
- Scans QR codes to confirm part identity and completion status
- Coordinates final packaging and shipping preparation
- Updates part status for delivery and client notification

### **Package Management Operations**
- Manages incoming package reception and unpacking
- Handles outgoing package preparation and shipping coordination  
- Processes delivery confirmations and tracking information
- Maintains package inventory and routing status

### **Immutable Logistics Logging**
- Logs every QR scan, part intake/outtake, and routing decision to `SMART-Ledger`
- Creates tamper-proof audit trail of all shipping & receiving operations
- Documents part verification results with full context
- Maintains complete package handling history

---

## �️ Security & Governance

- **QR-driven operations** - all actions triggered by SmartClientPO QR codes
- **Vision integration** - works directly with SMART-Vision for part verification
- **Immutable logging** - all logistics actions logged to blockchain
- **Single station focus** - operates only at Shipping & Receiving location
- **No central coordination** - autonomous operation based on QR code data

### Integration Points
- **SMART-Vision**: Direct integration for part verification and image matching
- **SmartContract System**: QR codes drive all part identification and routing
- **SMART-Ledger**: Logs all shipping & receiving operations and decisions
- **Testing Stations**: Routes verified parts to designated testing locations

---

## 📊 Shipping & Receiving Metrics

### **Part Handling Metrics**
- QR code scan success rates and part identification accuracy
- Part verification results (confirmed/rejected/quarantined ratios)
- Routing efficiency and delivery time tracking
- Package processing volume and throughput analysis

### **Operations Reporting**
- Real-time shipping & receiving status dashboard
- Package intake and outtake volume tracking
- Verification failure analysis and resolution monitoring
- Delivery coordination and completion tracking

---

## 🔌 Deployment

**Target Environment**: Single Shipping & Receiving Station
**Runtime**: Continuous part intake/outtake processing
**Integration**: SMART-Vision system, SmartContract QR codes, SMART-Ledger

---

## 📈 Station Benefits

- **QR-driven automation** - seamless part identification and routing
- **Vision-verified accuracy** - confirmed part matching before processing
- **Complete traceability** - full audit trail of all part handling
- **Single point coordination** - centralized shipping & receiving operations
- **Autonomous processing** - operates independently based on QR code data

---

## 🔄 Part Handling Workflow

1. **Package Arrival** - Incoming packages arrive at Shipping & Receiving station
2. **QR Code Scan** - Scan SmartContract QR code to retrieve part information
3. **Vision Verification** - SMART-Vision validates part against expected images
4. **Part Routing** - Route verified parts to designated testing stations
5. **Completion Processing** - Handle returned parts for outbound shipping
6. **Immutable Logging** - Document all operations in SMART-Ledger

---

## 🎯 Operational Advantages

- **Single station efficiency** - centralized shipping & receiving operations
- **QR-driven accuracy** - automatic part identification and routing
- **Vision-verified quality** - confirmed part matching before processing  
- **Complete tracking** - full part journey from intake to outtake
- **Autonomous operation** - independent processing without central coordination

---

## � Architecture

### File: `SMART_logistics_node.py`

* **Class**: `SmartLogisticsNode`
* **Core Methods**:

  * `scan_qr_code()` - Scan SmartContract QR code on package
  * `retrieve_contract_from_qr()` - Extract SmartClientPO data from QR
  * `request_vision_verification()` - Coordinate with SMART-Vision for part validation
  * `process_verification_result()` - Handle vision verification results
  * `route_to_testing_station()` - Send verified parts to designated stations
  * `process_outbound_part()` - Handle completed parts for shipping
  * `update_package_status()` - Track package processing state
  * `generate_shipping_label()` - Create shipping documentation

### QR-Driven Part Intake Workflow Example

```python
# Example: Incoming package with aerospace part for LP testing

1. Package arrives at Shipping & Receiving station
2. Operator scans SmartContract QR code on package
3. LogisticsNode retrieves SmartClientPO data from QR code:
   - Part number: SC-2025-001-LP
   - Test requirements: Liquid Penetrant (LP), Chemical Processing (CP)
   - Reference images for part verification
   - Routing: First to NODE-LP-001, then to NODE-CP-001
4. LogisticsNode requests SMART-Vision verification
5. SMART-Vision compares physical part with reference images
6. Vision returns: "CONFIRMED - Part matches reference"
7. LogisticsNode logs verification success to SMART-Ledger
8. LogisticsNode routes part to NODE-LP-001 (first testing station)
9. HandoffCentral receives part ready notification
10. Complete intake operation logged with QR code data and vision results
```

### Part Processing States

* **received** - Package arrived, awaiting QR scan
* **qr_scanned** - QR code processed, SmartContract retrieved
* **vision_requested** - Part verification request sent to SMART-Vision
* **verified** - Vision confirmed part matches reference images
* **rejected** - Vision verification failed, part mismatch detected
* **quarantined** - Part placed in holding for inspection/resolution
* **routed** - Part sent to designated testing station
* **in_testing** - Part at testing station, awaiting completion
* **outbound_ready** - Completed part ready for shipping
* **shipped** - Package dispatched to client

### Example Code Structure

```python
from server.smart_ledger import get_ledger
from datetime import datetime, timezone
from typing import Dict, Optional, List
import json
import requests
import qrcode
from pathlib import Path

class SmartLogisticsNode:
    def __init__(self, station_id: str):
        self.station_id = station_id
        self.active_packages = {}
        self.routing_queue = []
        
        # Get ledger instance - reports logistics operations, doesn't write directly
        self.ledger = get_ledger("logistics_node")
        
        # Vision system endpoint
        self.vision_endpoint = "http://smart-vision:8080/verify-part"
        
        # Floor Hub endpoint for routing
        self.floor_hub_endpoint = "http://floor-hub:8080/route-to-station"
        
        # Package storage paths
        self.package_storage = Path("/opt/smart/packages")
        self.package_storage.mkdir(parents=True, exist_ok=True)
    
    def scan_qr_code(self, qr_data: str) -> dict:
        """
        Scan SmartContract QR code on incoming package
        Returns QR scan result with basic validation
        """
        try:
            # QR code contains SmartClientPO reference or contract data
            scan_result = {
                "scan_successful": True,
                "qr_data": qr_data,
                "scan_timestamp": datetime.now(timezone.utc).isoformat(),
                "station_id": self.station_id
            }
            
            # Report QR scan to SMART-Ledger
            self.ledger.record_action(
                action_type="logistics",
                action="scan_qr_code",
                target=qr_data,
                details=f"QR code scanned at Shipping & Receiving",
                user_id="system",
                smart_id=self.station_id,
                metadata=scan_result
            )
            
            # Retrieve SmartContract from QR code
            contract = self.retrieve_contract_from_qr(qr_data)
            
            if contract:
                scan_result['contract_retrieved'] = True
                scan_result['clientpo_id'] = contract['smart_contract_id']
            else:
                scan_result['contract_retrieved'] = False
                scan_result['error'] = "Failed to retrieve SmartContract"
            
            return scan_result
            
        except Exception as e:
            error_result = {
                "scan_successful": False,
                "error": str(e),
                "qr_data": qr_data,
                "scan_timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            # Report scan failure to SMART-Ledger
            self.ledger.record_action(
                action_type="logistics",
                action="scan_failed",
                target=qr_data,
                details=f"QR scan failed: {str(e)}",
                user_id="system",
                smart_id=self.station_id,
                metadata=error_result
            )
            
            return error_result
    
    def retrieve_contract_from_qr(self, qr_data: str) -> Optional[dict]:
        """
        Extract SmartClientPO data from QR code
        Returns contract with part specifications and routing
        """
        try:
            # QR data could be:
            # 1. Direct JSON payload (embedded contract)
            # 2. Contract ID reference (lookup required)
            # 3. URL to contract location
            
            if qr_data.startswith('{'):
                # Direct JSON payload
                contract = json.loads(qr_data)
            elif qr_data.startswith('http'):
                # URL reference - fetch contract
                response = requests.get(qr_data, timeout=10)
                contract = response.json()
            else:
                # Contract ID - load from local storage
                contract_path = self.package_storage / f"{qr_data}.json"
                if contract_path.exists():
                    with open(contract_path, 'r') as f:
                        contract = json.load(f)
                else:
                    return None
            
            # Initialize package tracking
            package_id = f"PKG-{contract['smart_contract_id']}-{int(datetime.now().timestamp())}"
            
            package = {
                "package_id": package_id,
                "clientpo_id": contract['smart_contract_id'],
                "contract": contract,
                "status": "qr_scanned",
                "qr_data": qr_data,
                "scan_timestamp": datetime.now(timezone.utc).isoformat(),
                "part_info": {
                    "part_number": contract.get('part_number'),
                    "part_description": contract.get('part_description'),
                    "test_requirements": contract.get('test_requirements', []),
                    "routing_sequence": contract.get('routing_sequence', [])
                },
                "verification_status": "pending"
            }
            
            self.active_packages[package_id] = package
            
            # Report contract retrieval to SMART-Ledger
            self.ledger.record_action(
                action_type="logistics",
                action="retrieve_contract",
                target=package_id,
                details=f"SmartContract retrieved: {contract['smart_contract_id']}",
                user_id="system",
                smart_id=self.station_id,
                metadata={
                    "clientpo_id": contract['smart_contract_id'],
                    "part_number": package['part_info']['part_number'],
                    "test_count": len(package['part_info']['test_requirements'])
                }
            )
            
            return contract
            
        except Exception as e:
            # Report retrieval failure to SMART-Ledger
            self.ledger.record_action(
                action_type="logistics",
                action="retrieval_failed",
                target=qr_data,
                details=f"Contract retrieval failed: {str(e)}",
                user_id="system",
                smart_id=self.station_id,
                metadata={"error": str(e)}
            )
            
            return None
    
    def request_vision_verification(self, package_id: str) -> dict:
        """
        Coordinate with SMART-Vision for part validation
        Returns verification request result
        """
        package = self.active_packages.get(package_id)
        
        if not package:
            return {"error": "Package not found"}
        
        contract = package['contract']
        
        # Build vision verification request
        verification_request = {
            "request_id": f"VISION-{package_id}",
            "package_id": package_id,
            "clientpo_id": package['clientpo_id'],
            "part_number": package['part_info']['part_number'],
            "reference_images": contract.get('reference_images', []),
            "verification_criteria": contract.get('verification_criteria', {}),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            # Send verification request to SMART-Vision
            response = requests.post(
                self.vision_endpoint,
                json=verification_request,
                timeout=30
            )
            
            if response.status_code == 200:
                vision_result = response.json()
                
                # Update package status
                package['status'] = "vision_requested"
                package['vision_request_id'] = verification_request['request_id']
                
                result = {
                    "success": True,
                    "request_id": verification_request['request_id'],
                    "vision_response": vision_result
                }
            else:
                result = {
                    "success": False,
                    "error": f"Vision system error: HTTP {response.status_code}"
                }
            
        except Exception as e:
            result = {
                "success": False,
                "error": f"Vision request failed: {str(e)}"
            }
        
        # Report vision request to SMART-Ledger
        self.ledger.record_action(
            action_type="logistics",
            action="request_vision",
            target=package_id,
            details=f"Vision verification requested for {package['part_info']['part_number']}",
            user_id="system",
            smart_id=self.station_id,
            metadata=result
        )
        
        return result
    
    def process_verification_result(self, package_id: str, vision_result: dict) -> dict:
        """
        Handle vision verification results (confirmed/rejected/quarantined)
        Returns processing result with routing decision
        """
        package = self.active_packages.get(package_id)
        
        if not package:
            return {"error": "Package not found"}
        
        verification_status = vision_result.get('verification_status')
        confidence = vision_result.get('confidence', 0)
        
        # Process based on verification result
        if verification_status == "CONFIRMED" and confidence >= 0.95:
            # Part verified - ready for routing
            package['status'] = "verified"
            package['verification_result'] = vision_result
            
            result = {
                "approved": True,
                "verification_status": verification_status,
                "confidence": confidence,
                "routing_approved": True
            }
            
            # Report verification success to SMART-Ledger
            self.ledger.record_action(
                action_type="logistics",
                action="verification_confirmed",
                target=package_id,
                details=f"Part verified: {package['part_info']['part_number']} (confidence: {confidence:.2%})",
                user_id="system",
                smart_id=self.station_id,
                metadata=result
            )
            
            # Automatically route to first testing station
            routing_result = self.route_to_testing_station(package_id)
            result['routing_result'] = routing_result
            
        elif verification_status == "REJECTED":
            # Part rejected - quarantine
            package['status'] = "rejected"
            package['verification_result'] = vision_result
            
            result = {
                "approved": False,
                "verification_status": verification_status,
                "confidence": confidence,
                "routing_approved": False,
                "reason": vision_result.get('rejection_reason')
            }
            
            # Report rejection to SMART-Ledger
            self.ledger.record_action(
                action_type="logistics",
                action="verification_rejected",
                target=package_id,
                details=f"Part REJECTED: {vision_result.get('rejection_reason')}",
                user_id="system",
                smart_id=self.station_id,
                metadata=result
            )
            
        else:
            # Uncertain result - quarantine for manual inspection
            package['status'] = "quarantined"
            package['verification_result'] = vision_result
            
            result = {
                "approved": False,
                "verification_status": "UNCERTAIN",
                "confidence": confidence,
                "routing_approved": False,
                "reason": "Low confidence - manual inspection required"
            }
            
            # Report quarantine to SMART-Ledger
            self.ledger.record_action(
                action_type="logistics",
                action="verification_uncertain",
                target=package_id,
                details=f"Part QUARANTINED: Low confidence ({confidence:.2%})",
                user_id="system",
                smart_id=self.station_id,
                metadata=result
            )
        
        return result
    
    def route_to_testing_station(self, package_id: str) -> dict:
        """
        Send verified parts to designated testing station
        Returns routing result with destination
        """
        package = self.active_packages.get(package_id)
        
        if not package:
            return {"error": "Package not found"}
        
        if package['status'] != "verified":
            return {"error": "Package not verified for routing"}
        
        # Get routing sequence from contract
        routing_sequence = package['part_info']['routing_sequence']
        
        if not routing_sequence:
            return {"error": "No routing sequence defined"}
        
        # Get first station in sequence
        first_station = routing_sequence[0]
        
        # Build routing payload
        routing_payload = {
            "package_id": package_id,
            "clientpo_id": package['clientpo_id'],
            "part_number": package['part_info']['part_number'],
            "target_station": first_station['station_id'],
            "test_type": first_station['test_type'],
            "contract": package['contract'],
            "verification_result": package['verification_result'],
            "routing_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            # Route through Floor Hub to target station
            response = requests.post(
                self.floor_hub_endpoint,
                json=routing_payload,
                timeout=30
            )
            
            if response.status_code == 200:
                # Routing successful
                package['status'] = "routed"
                package['routed_to'] = first_station['station_id']
                package['routing_timestamp'] = routing_payload['routing_timestamp']
                
                result = {
                    "success": True,
                    "destination": first_station['station_id'],
                    "test_type": first_station['test_type'],
                    "response": response.json()
                }
            else:
                result = {
                    "success": False,
                    "error": f"Routing failed: HTTP {response.status_code}"
                }
            
        except Exception as e:
            result = {
                "success": False,
                "error": f"Routing error: {str(e)}"
            }
        
        # Report routing to SMART-Ledger
        self.ledger.record_action(
            action_type="logistics",
            action="route_to_station",
            target=package_id,
            details=f"Part routed to {first_station['station_id']} for {first_station['test_type']} testing",
            user_id="system",
            smart_id=self.station_id,
            metadata=result
        )
        
        return result
    
    def process_outbound_part(self, package_id: str, test_results: dict) -> dict:
        """
        Handle completed parts returning from testing for shipping
        Returns outbound processing result
        """
        package = self.active_packages.get(package_id)
        
        if not package:
            return {"error": "Package not found"}
        
        # Update package with test completion
        package['status'] = "outbound_ready"
        package['test_results'] = test_results
        package['completion_timestamp'] = datetime.now(timezone.utc).isoformat()
        
        # Generate shipping documentation
        shipping_info = self.generate_shipping_label(package_id)
        package['shipping_info'] = shipping_info
        
        result = {
            "success": True,
            "package_id": package_id,
            "clientpo_id": package['clientpo_id'],
            "all_tests_complete": test_results.get('all_tests_complete', False),
            "shipping_label": shipping_info.get('label_number'),
            "ready_for_dispatch": True
        }
        
        # Report outbound processing to SMART-Ledger
        self.ledger.record_action(
            action_type="logistics",
            action="process_outbound",
            target=package_id,
            details=f"Part ready for shipping: {package['part_info']['part_number']}",
            user_id="system",
            smart_id=self.station_id,
            metadata=result
        )
        
        return result
    
    def update_package_status(self, package_id: str, new_status: str, details: dict = None) -> bool:
        """
        Track package processing state through workflow
        Returns update success status
        """
        package = self.active_packages.get(package_id)
        
        if not package:
            return False
        
        old_status = package['status']
        package['status'] = new_status
        package['status_updated'] = datetime.now(timezone.utc).isoformat()
        
        if details:
            package['status_details'] = details
        
        # Report status update to SMART-Ledger
        self.ledger.record_action(
            action_type="logistics",
            action="update_status",
            target=package_id,
            details=f"Package status: {old_status} → {new_status}",
            user_id="system",
            smart_id=self.station_id,
            metadata={
                "old_status": old_status,
                "new_status": new_status,
                "details": details
            }
        )
        
        return True
    
    def generate_shipping_label(self, package_id: str) -> dict:
        """
        Create shipping documentation for outbound packages
        Returns shipping label information
        """
        package = self.active_packages.get(package_id)
        
        if not package:
            return {"error": "Package not found"}
        
        contract = package['contract']
        
        # Generate shipping label
        label_number = f"SHIP-{package_id}-{int(datetime.now().timestamp())}"
        
        shipping_label = {
            "label_number": label_number,
            "package_id": package_id,
            "clientpo_id": package['clientpo_id'],
            "part_number": package['part_info']['part_number'],
            "destination": contract.get('shipping_address', {}),
            "carrier": contract.get('preferred_carrier', 'UPS'),
            "service_level": contract.get('service_level', 'Ground'),
            "tracking_number": None,  # Assigned by carrier
            "generated_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Generate QR code for shipping label
        qr_data = json.dumps({
            "label_number": label_number,
            "package_id": package_id,
            "clientpo_id": package['clientpo_id']
        })
        
        qr = qrcode.make(qr_data)
        qr_path = self.package_storage / f"{label_number}-qr.png"
        qr.save(qr_path)
        
        shipping_label['qr_code_path'] = str(qr_path)
        
        # Report shipping label generation to SMART-Ledger
        self.ledger.record_action(
            action_type="logistics",
            action="generate_shipping_label",
            target=package_id,
            details=f"Shipping label generated: {label_number}",
            user_id="system",
            smart_id=self.station_id,
            metadata=shipping_label
        )
        
        return shipping_label
    
    def get_package_status(self, package_id: str) -> dict:
        """
        Query package status for tracking and monitoring
        """
        package = self.active_packages.get(package_id)
        
        if not package:
            return {"error": "Package not found"}
        
        return {
            "package_id": package_id,
            "clientpo_id": package['clientpo_id'],
            "status": package['status'],
            "part_number": package['part_info']['part_number'],
            "verification_status": package.get('verification_status'),
            "routed_to": package.get('routed_to'),
            "scan_timestamp": package['scan_timestamp'],
            "routing_timestamp": package.get('routing_timestamp'),
            "completion_timestamp": package.get('completion_timestamp')
        }
    
    def get_active_packages(self) -> List[dict]:
        """
        Get all active packages for dashboard display
        """
        return [
            self.get_package_status(package_id)
            for package_id in self.active_packages.keys()
        ]
```

---

## �📋 Closing Statement

**LogisticsNode: QR-Driven Part Handler. Vision Integrated. Single Station.**  
SmartContract QR codes drive all operations. Vision verification ensures accuracy. Complete traceability.  
**QR scan. Vision verify. Route and ship.**