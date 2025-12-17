# SMART-Ledger Framework

**"Truth in every action. Memory across the domain."**

---

## 🧠 Overview

The **SMART-Ledger** is the cryptographic memory system of the entire SMART ecosystem. Every module, node, and interface writes its actions to an immutable, hash-linked log called a *local module ledger*. These ledgers provide real-time traceability, decentralized visibility, and airtight audit support for the entire system.

This design follows a distributed ledger model, where **every module maintains its own independent ledger**, chained by hashes, and signed with their SMART-IDs. Each ledger operates independently with local storage and validation. This structure allows for easy validation, autonomous operation, and localized recovery.

---

## 🔄 Logging Strategy: Distributed but Centralized-Aware

### ✅ Every Module Writes Its Own Ledger

* Each module (e.g., Compliance, Handoff, Dashboard, Audit, etc.) maintains a self-contained ledger.
* **Modules DO NOT write directly to ledger files** - they call the SMART-Ledger API
* **SMART-Ledger module handles all writing** - file I/O, hash calculation, and chain validation
* Modules only report WHAT to log, the Ledger decides HOW to log it
* Ledger entries are:

  * Timestamped (by SMART-Ledger)
  * Signed with **Module SMART-ID** and **Domain SMART-ID**
  * Hash-linked to the previous entry (by SMART-Ledger)
  * Sealed after each write (by SMART-Ledger)
* No ledger can be altered without detection due to hash chaining.

### 📝 Module-to-Ledger Communication Pattern

**Modules use SMART-Ledger API:**

```python
# Module reports action to SMART-Ledger
from server.smart_ledger import get_ledger

# Get ledger instance for this module
ledger = get_ledger("handoff_central")

# Tell ledger WHAT to log (module doesn't do the writing)
ledger.record_action(
    action_type="handoff",
    action="stage_client_po",
    target="SC-2025-001-LP",
    details="SmartClientPO staged, awaiting part arrival",
    user_id="system",
    smart_id="HUB-FLOOR-001",
    metadata={"staging_id": "STAGE-12345", "part_id": "PART-ABC"}
)

# SMART-Ledger handles:
# - Hash calculation
# - Timestamp generation
# - File writing to JSONL
# - Chain validation
# - Index updates
```

**Separation of Concerns:**
* **Module's Job**: Report what happened (action, target, details, context)
* **Ledger's Job**: Write it immutably (hashing, chaining, file I/O, validation)
* This ensures consistent logging format and prevents modules from corrupting ledger integrity

### 🗂️ Types of Logged Events

* SmartContract deployment & enforcement
* Operator logins / authentication (SMART-ID, tag, fingerprint)
* Module operations and state changes
* Compliance checks and validations
* Pre-check completions
* Dashboard usage and widget movements
* AI flagging and observations
* Equipment changes or failures
* Local module actions and decisions

---

## 📦 Ledger Storage and Retention

### 🔹 Local Storage (On Node)

* Each node stores the local ledgers on its internal drive (SSD or SD card)
* **Retention policy**: configurable per node (e.g., retain 7/30/90 days)
* Read-only interface for operator review

### 🔸 Central Archive (SMART-Vault)

* **Automatic Transfer Policy** - After local retention period (configurable per node), ledgers are transferred to **SMART-Vault**
* **Long-Term Storage** - SMART-Vault becomes the permanent archive for all operational logs
* **Hash Chain Preservation** - Maintains full hash chain validation during and after transfer
* **Audit Central Access** - Archived ledgers remain accessible to Audit Central for historical analysis
* **Forensic Retrieval** - Complete operational history available for compliance and investigation
* **System Recovery** - Can act as a backup repository for system-wide recovery operations

---

## 🌐 Distributed Ledger Architecture

We **do not use a global centralized ledger**. Instead:

* Each module logs locally, creating independent modular chains
* Ledgers operate autonomously with local storage and validation
* Central SMART modules maintain their own separate ledgers
* Central modules **do not write to node ledgers** (except their own central ledgers)
* No network dependencies for ledger operations
* This preserves complete independence and avoids cross-contamination of records

Benefits:

* Better fault isolation
* Greater modular visibility
* Easier debugging and rollback
* Improved forensic trust during audits

### 🔄 Independent Ledger Operations

**Autonomous Ledger Management:**

* **Local Operation** - Each module manages its own ledger independently
* **No Network Dependency** - Ledgers function completely offline
* **Hash Validation** - Integrity maintained through local hash chaining
* **Independent Storage** - Each node stores and validates its own ledger data
* **Separate from Coordination** - Ledger operations are independent of broadcast/handoff systems

**Vault Transfer Process:**

1. Node reaches local retention limit (e.g., 30/60/90 days)
2. Automated transfer process initiates
3. Ledger data packaged with hash validation
4. Transfer to SMART-Vault for permanent storage
5. Audit Central maintains access to both local and archived ledgers
6. Hash chain integrity preserved throughout entire process

---

## 🔐 SMART-ID Signature Layers

Every ledger entry is signed with:

* `MOD-xxxxx` (Module SMART-ID)
* `DOM-xxxxx` (Domain Module ID)
* `STF-xxxxx` (If human-initiated)
* Fingerprint ID (if Smart Tag login was used)

This guarantees:

* Complete traceability
* Instant accountability
* Zero ambiguity about who did what, where, and when

---

## 📊 Ledger Visibility & Access

### 🔍 Audit Central - Universal Ledger Access

**Audit Central has read access to ALL ledgers across the entire SMART ecosystem:**

* **Complete Operational Log Access** - Can read every module's ledger for comprehensive audit trails
* **Cross-Module Analysis** - Correlate activities across different modules and nodes
* **Real-Time Monitoring** - Active visibility into ongoing operations across all systems
* **Historical Investigation** - Access archived ledgers from SMART-Vault for forensic analysis
* **Hash Chain Validation** - Verify integrity of all ledger entries across the system

### 👥 Role-Based Ledger Access

| Viewer Role       | View Access Type     | Notes                                                  |
| ------------------| ---------------------| -------------------------------------------------------|
| **Audit Central** | **Full System-Wide** | **Read access to ALL ledgers across entire ecosystem** |
| Operators         | Filtered             | See relevant task-level logs only                      |
| Compliance Team   | Full per station     | All station logs, redacted human data                  |
| Executives        | Summary Dashboards   | System health, process logs, violations                |
| Clients           | Limited              | Only their project logs, non-sensitive only            |
| Auditors          | Full (On Request)    | Can verify hash chains for official reporting          |

---

## 📈 Strategic Benefits

* No single point of failure in logging
* Audit-ready logs at every level of the enterprise
* Modular chain-of-trust by default
* Enables air-gapped and offline operations
* Simplifies compliance with NDT standards like AS9100, ISO, etc.

---

## 🔧 Technical Snapshot

* Hash Function: SHA-256 or equivalent
* Storage Format: JSONL or SQLite
* Operation Method: Independent local logging with hash validation
* Backup Location: SMART-Vault, external USB/NAS (optional)
* Air-Gap Support: Yes, completely autonomous operation
* Network Dependency: None - fully offline capable

---

## 🔒 Ledger Transfer & Authorization Control

### 🔄 Production Ledger Transfer Protocol

When moving ledgers from production nodes/hubs to SMART-Vault, **continuity and integrity** must be preserved:

**Bootstrap Transfer Process:**
1. **Validate Source Ledger** - Verify complete hash chain integrity before transfer
2. **Extract Continuation Data** - Copy last 3-5 entries from source ledger for bootstrap
3. **Create Transfer Package** - Package ledger with validation metadata and authorization signatures
4. **Initialize New Ledger** - Bootstrap new ledger with continuation entries from previous ledger
5. **Verify Chain Continuity** - Ensure new ledger properly continues from previous final hash
6. **Archive Source** - Mark source ledger as "transferred" with immutable timestamp

**Bootstrap Entry Structure:**
```json
{
  "entry_id": "bootstrap_001",
  "action_type": "system",
  "action": "ledger_transfer_bootstrap",
  "target": "new_ledger_initialization",
  "details": "Bootstrap from previous ledger: [source_ledger_id]",
  "previous_hash": "[final_hash_from_source_ledger]",
  "metadata": {
    "source_ledger": "[source_ledger_id]",
    "transfer_timestamp": "[ISO_datetime]",
    "authorization": "[auth_signature]",
    "bootstrap_entries": "[last_3_source_entries]"
  }
}
```

### 🛡️ Ledger Deletion Protection & Authorization

**Authorization Required Actions:**
- **Ledger Deletion** - Requires SMART-ID authorization + reason logging
- **Ledger Reset** - Requires dual authorization (Admin + Supervisor SMART-IDs)
- **Hash Chain Break** - Impossible without detection and authorization logging
- **Transfer Interruption** - Logged as security incident with full audit trail

**Protection Mechanisms:**

1. **File System Protection**
   ```bash
   # Linux immutable file attribute (requires root to remove)
   chattr +i /path/to/ledger_file.jsonl
   
   # Multiple backup copies with different permissions
   cp ledger.jsonl .ledger_backup_$(date +%s).jsonl
   chmod 444 .ledger_backup_*.jsonl  # Read-only
   ```

2. **Authorization Validation**
   ```python
   def authorize_ledger_deletion(smart_id: str, reason: str, supervisor_id: str = None):
       """Require proper authorization before any destructive ledger operation"""
       
       # Log the authorization attempt
       record_system_action(
           action="ledger_deletion_request",
           target=f"ledger_{self.ledger_name}",
           details=f"Deletion requested by {smart_id}: {reason}",
           user_id=smart_id,
           metadata={"supervisor_approval": supervisor_id}
       )
       
       # Validate SMART-ID permissions
       if not validate_smart_id_permissions(smart_id, "LEDGER_DELETE"):
           raise SecurityError("Insufficient permissions for ledger deletion")
       
       # Require supervisor approval for critical ledgers
       if self.ledger_name in ["production", "audit", "compliance"]:
           if not supervisor_id or not validate_smart_id_permissions(supervisor_id, "SUPERVISOR"):
               raise SecurityError("Supervisor approval required for critical ledger deletion")
   ```

3. **Deletion Audit Trail**
   ```python
   def authorized_ledger_deletion(self, auth_token: str, reason: str):
       """Perform authorized ledger deletion with full audit trail"""
       
       # Create deletion record BEFORE deletion
       deletion_record = {
           "deletion_timestamp": datetime.now(timezone.utc).isoformat(),
           "authorized_by": auth_token,
           "reason": reason,
           "ledger_stats": self.get_stats(),
           "final_entries": self.entries[-10:],  # Last 10 entries
           "hash_chain_validation": self.validate_chain()
       }
       
       # Write deletion record to separate audit log
       with open(f"{self.data_dir}/deletion_audit.jsonl", "a") as f:
           f.write(json.dumps(deletion_record) + "\n")
       
       # Only then proceed with deletion
       self._perform_deletion()
   ```

---

## Final Thought

This is **not a blockchain clone**. It's a practical, audit-grade memory system engineered for modern industrial operations where **"it wasn't logged correctly"** is never an acceptable excuse. Every test, every flag, every compliance check, every user action, every system event is now *forever remembered* — cryptographically, securely, and transparently.

**SMART-Ledger: "No excuses. No gaps. No modifications. Just truth."**
*"Truth in every action. Memory across the domain."*