#!/usr/bin/env python3
"""
SMART-Ledger System - The Custodian
"Truth in every action. Memory across the domain."

This is the centralized Custodian that receives action reports from all modules/tabs
and maintains immutable, hash-chained ledger entries. Follows single-purpose design:
- ONLY records what modules tell it
- Does NOT decide what to record
- Provides hash-chain validation
- Enables audit access

Design Philosophy:
- Modules DO work and REPORT to Custodian
- Custodian ONLY records what it's told
- Hash chains ensure immutability
- SMART-ID signatures provide accountability
"""

import json
import hashlib
import time
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Union
from pathlib import Path


class SmartLedgerEntry:
    """Single ledger entry with hash chaining and SMART-ID signature"""
    
    def __init__(self, action_type: str, action: str, target: str, details: str, 
                 user_id: str, smart_id: str, metadata: Optional[Dict[str, Any]] = None):
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.action_type = action_type  # module, node, equipment, domain, user, system
        self.action = action  # create, update, delete, deploy, validate, etc.
        self.target = target  # what was acted upon
        self.details = details  # human readable description
        self.user_id = user_id  # current user (will be STF-xxxxx later)
        self.smart_id = smart_id  # relevant SMART-ID (MOD-xxxxx, NOD-xxxxx, etc.)
        self.metadata = metadata or {}
        self.previous_hash = None
        self.entry_hash = None
        self.entry_id = None
    
    def calculate_hash(self, previous_hash: str = "0") -> str:
        """Calculate SHA-256 hash for this entry"""
        self.previous_hash = previous_hash
        
        # Create deterministic string for hashing
        hash_data = f"{self.timestamp}:{self.action_type}:{self.action}:{self.target}:{self.details}:{self.user_id}:{self.smart_id}:{previous_hash}:{json.dumps(self.metadata, sort_keys=True)}"
        
        self.entry_hash = hashlib.sha256(hash_data.encode()).hexdigest()
        self.entry_id = f"led_{int(time.time() * 1000)}_{self.entry_hash[:8]}"
        
        return self.entry_hash
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert entry to dictionary for storage"""
        return {
            "entry_id": self.entry_id,
            "timestamp": self.timestamp,
            "action_type": self.action_type,
            "action": self.action,
            "target": self.target,
            "details": self.details,
            "user_id": self.user_id,
            "smart_id": self.smart_id,
            "metadata": self.metadata,
            "previous_hash": self.previous_hash,
            "entry_hash": self.entry_hash
        }


class SmartLedger:
    """
    The Custodian - Per-module ledger system for distributed logging
    
    Each tab/module gets its own dedicated ledger file following the distributed approach.
    Supports: modules, nodes, domains, equipment, users, system ledgers.
    
    Enhanced with production-grade transfer and authorization controls.
    """
    
    def __init__(self, ledger_name: str = "main", data_dir: str = "data/ledger"):
        self.ledger_name = ledger_name
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        self.ledger_file = self.data_dir / f"{ledger_name}_ledger.jsonl"
        self.index_file = self.data_dir / f"{ledger_name}_index.json"
        self.auth_file = self.data_dir / f"{ledger_name}_auth.json"
        self.deletion_audit_file = self.data_dir / "deletion_audit.jsonl"
        
        # Load existing ledger
        self.entries: List[Dict[str, Any]] = []
        self.last_hash = "0"
        
        # Initialize ledger
        self._load_ledger()
        
        print(f"📋 SMART-Ledger '{self.ledger_name}' initialized: {len(self.entries)} entries loaded")
    
    def _load_ledger(self):
        """Load existing ledger entries from disk"""
        if self.ledger_file.exists():
            try:
                with open(self.ledger_file, 'r') as f:
                    for line in f:
                        if line.strip():
                            entry = json.loads(line)
                            self.entries.append(entry)
                
                # Set last hash from most recent entry
                if self.entries:
                    self.last_hash = self.entries[-1]["entry_hash"]
                
                print(f"📚 Loaded {len(self.entries)} ledger entries")
                
            except Exception as e:
                print(f"⚠️ Error loading ledger: {e}")
                # Create backup of corrupted file
                if self.ledger_file.exists():
                    backup_file = self.data_dir / f"smart_ledger_backup_{int(time.time())}.jsonl"
                    self.ledger_file.rename(backup_file)
                    print(f"💾 Corrupted ledger backed up to: {backup_file}")
                
                self.entries = []
                self.last_hash = "0"
    
    def record_action(self, action_type: str, action: str, target: str, 
                     details: str, user_id: str, smart_id: str = "", 
                     metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Record an action reported by a module/tab
        
        Args:
            action_type: Type of action (module, node, equipment, domain, user, system)
            action: What was done (create, update, delete, deploy, etc.)
            target: What was acted upon
            details: Human-readable description
            user_id: User who performed the action
            smart_id: Relevant SMART-ID if applicable
            metadata: Additional structured data
            
        Returns:
            entry_id: Unique identifier for the ledger entry
        """
        
        # Create new entry
        entry = SmartLedgerEntry(
            action_type=action_type,
            action=action,
            target=target,
            details=details,
            user_id=user_id,
            smart_id=smart_id,
            metadata=metadata
        )
        
        # Calculate hash (chains to previous entry)
        entry.calculate_hash(self.last_hash)
        
        # Convert to dict for storage
        entry_dict = entry.to_dict()
        
        # Append to in-memory ledger
        self.entries.append(entry_dict)
        
        # Write to disk immediately (append-only)
        try:
            with open(self.ledger_file, 'a') as f:
                f.write(json.dumps(entry_dict) + '\n')
            
            # Update last hash
            self.last_hash = entry.entry_hash
            
            # Update index for fast lookups
            self._update_index()
            
            print(f"📝 Ledger: {action_type}.{action} on '{target}' by {user_id} -> {entry.entry_id}")
            
            return entry.entry_id
            
        except Exception as e:
            # Remove from memory if disk write failed
            self.entries.pop()
            print(f"❌ Failed to record ledger entry: {e}")
            raise
    
    def _update_index(self):
        """Update search index for faster queries"""
        try:
            index = {
                "total_entries": len(self.entries),
                "last_hash": self.last_hash,
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "entry_types": {},
                "users": {},
                "smart_ids": {}
            }
            
            # Build index
            for entry in self.entries:
                # Count by type
                action_type = entry["action_type"]
                if action_type not in index["entry_types"]:
                    index["entry_types"][action_type] = 0
                index["entry_types"][action_type] += 1
                
                # Count by user
                user_id = entry["user_id"]
                if user_id not in index["users"]:
                    index["users"][user_id] = 0
                index["users"][user_id] += 1
                
                # Count by SMART-ID
                smart_id = entry.get("smart_id", "")
                if smart_id and smart_id not in index["smart_ids"]:
                    index["smart_ids"][smart_id] = 0
                if smart_id:
                    index["smart_ids"][smart_id] += 1
            
            with open(self.index_file, 'w') as f:
                json.dump(index, f, indent=2)
                
        except Exception as e:
            print(f"⚠️ Failed to update ledger index: {e}")
    
    def get_entries(self, limit: int = 100, offset: int = 0, 
                   action_type: Optional[str] = None, user_id: Optional[str] = None,
                   start_time: Optional[str] = None, end_time: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieve ledger entries with filtering and pagination
        
        Args:
            limit: Maximum number of entries to return
            offset: Number of entries to skip
            action_type: Filter by action type
            user_id: Filter by user
            start_time: Filter entries after this time (ISO format)
            end_time: Filter entries before this time (ISO format)
            
        Returns:
            List of matching ledger entries
        """
        filtered_entries = self.entries.copy()
        
        # Apply filters
        if action_type:
            filtered_entries = [e for e in filtered_entries if e["action_type"] == action_type]
        
        if user_id:
            filtered_entries = [e for e in filtered_entries if e["user_id"] == user_id]
        
        if start_time:
            filtered_entries = [e for e in filtered_entries if e["timestamp"] >= start_time]
        
        if end_time:
            filtered_entries = [e for e in filtered_entries if e["timestamp"] <= end_time]
        
        # Sort by timestamp (newest first) and apply pagination
        filtered_entries.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return filtered_entries[offset:offset + limit]
    
    def validate_chain(self) -> Dict[str, Any]:
        """
        Validate the integrity of the hash chain
        
        Returns:
            Dictionary with validation results
        """
        if not self.entries:
            return {
                "valid": True,
                "total_entries": 0,
                "message": "Empty ledger is valid"
            }
        
        invalid_entries = []
        expected_hash = "0"
        
        for i, entry in enumerate(self.entries):
            # Recreate the entry to calculate expected hash
            temp_entry = SmartLedgerEntry(
                action_type=entry["action_type"],
                action=entry["action"],
                target=entry["target"],
                details=entry["details"],
                user_id=entry["user_id"],
                smart_id=entry["smart_id"],
                metadata=entry["metadata"]
            )
            temp_entry.timestamp = entry["timestamp"]
            
            calculated_hash = temp_entry.calculate_hash(expected_hash)
            
            if calculated_hash != entry["entry_hash"]:
                invalid_entries.append({
                    "index": i,
                    "entry_id": entry["entry_id"],
                    "expected_hash": calculated_hash,
                    "actual_hash": entry["entry_hash"]
                })
            
            if entry["previous_hash"] != expected_hash:
                invalid_entries.append({
                    "index": i,
                    "entry_id": entry["entry_id"],
                    "chain_break": True,
                    "expected_previous": expected_hash,
                    "actual_previous": entry["previous_hash"]
                })
            
            expected_hash = entry["entry_hash"]
        
        return {
            "valid": len(invalid_entries) == 0,
            "total_entries": len(self.entries),
            "invalid_entries": invalid_entries,
            "message": "Chain is valid" if len(invalid_entries) == 0 else f"Found {len(invalid_entries)} integrity violations"
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get ledger statistics"""
        if not self.entries:
            return {
                "total_entries": 0,
                "first_entry": None,
                "last_entry": None,
                "action_types": {},
                "users": {},
                "smart_ids": {}
            }
        
        # Load index if available
        stats = {
            "total_entries": len(self.entries),
            "first_entry": self.entries[0]["timestamp"] if self.entries else None,
            "last_entry": self.entries[-1]["timestamp"] if self.entries else None,
            "last_hash": self.last_hash,
        }
        
        try:
            if self.index_file.exists():
                with open(self.index_file, 'r') as f:
                    index = json.load(f)
                    stats.update({
                        "action_types": index.get("entry_types", {}),
                        "users": index.get("users", {}),
                        "smart_ids": index.get("smart_ids", {})
                    })
        except Exception as e:
            print(f"⚠️ Could not load index: {e}")
            # Calculate on the fly
            stats.update({
                "action_types": {},
                "users": {},
                "smart_ids": {}
            })
        
        return stats

    def authorize_ledger_deletion(self, smart_id: str, reason: str, supervisor_id: Optional[str] = None) -> bool:
        """Require proper authorization before any destructive ledger operation"""
        
        # Log the authorization attempt
        auth_attempt = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "smart_id": smart_id,
            "reason": reason,
            "supervisor_id": supervisor_id,
            "ledger_name": self.ledger_name,
            "action": "deletion_authorization_request"
        }
        
        # Record authorization attempt in separate audit file
        try:
            with open(self.auth_file, 'a') as f:
                f.write(json.dumps(auth_attempt) + '\n')
        except Exception as e:
            print(f"⚠️ Could not log authorization attempt: {e}")
        
        # Validate SMART-ID format (basic validation for development)
        if not smart_id or not smart_id.startswith(('STF-', 'ADM-', 'DEV-')):
            print(f"❌ Invalid SMART-ID format: {smart_id}")
            return False
        
        # Require supervisor approval for critical ledgers
        critical_ledgers = ["production", "audit", "compliance", "vault", "nodes"]
        if self.ledger_name in critical_ledgers:
            if not supervisor_id or not supervisor_id.startswith(('SUP-', 'ADM-')):
                print(f"❌ Supervisor approval required for critical ledger: {self.ledger_name}")
                return False
        
        print(f"✅ Ledger deletion authorized by {smart_id}" + (f" with supervisor {supervisor_id}" if supervisor_id else ""))
        return True

    def authorized_ledger_deletion(self, smart_id: str, reason: str, supervisor_id: Optional[str] = None):
        """Perform authorized ledger deletion with full audit trail"""
        
        # Verify authorization
        if not self.authorize_ledger_deletion(smart_id, reason, supervisor_id):
            raise PermissionError("Unauthorized ledger deletion attempt")
        
        # Create deletion record BEFORE deletion
        deletion_record = {
            "deletion_timestamp": datetime.now(timezone.utc).isoformat(),
            "authorized_by": smart_id,
            "supervisor_by": supervisor_id,
            "reason": reason,
            "ledger_name": self.ledger_name,
            "ledger_stats": self.get_stats(),
            "final_entries": self.entries[-10:] if len(self.entries) >= 10 else self.entries,
            "hash_chain_validation": self.validate_chain()
        }
        
        # Write deletion record to audit log
        try:
            with open(self.deletion_audit_file, "a") as f:
                f.write(json.dumps(deletion_record) + "\n")
            print(f"📝 Deletion audit record created")
        except Exception as e:
            print(f"⚠️ Could not create deletion audit record: {e}")
            raise Exception("Cannot delete ledger without audit trail")
        
        # Create final backup before deletion
        final_backup = self.data_dir / f"FINAL_BACKUP_{self.ledger_name}_{int(time.time())}.jsonl"
        try:
            import shutil
            shutil.copy2(self.ledger_file, final_backup)
            os.chmod(final_backup, 0o444)  # Read-only
            print(f"💾 Final backup created: {final_backup}")
        except Exception as e:
            print(f"⚠️ Could not create final backup: {e}")
        
        # Remove file protection
        try:
            if os.name == 'posix':
                os.system(f"chattr -i {self.ledger_file} 2>/dev/null")
        except Exception:
            pass
        
        # Perform deletion
        try:
            if self.ledger_file.exists():
                self.ledger_file.unlink()
            if self.index_file.exists():
                self.index_file.unlink()
            
            # Clear in-memory data
            self.entries = []
            self.last_hash = "0"
            
            print(f"🗑️ Ledger '{self.ledger_name}' deleted by {smart_id}: {reason}")
            
        except Exception as e:
            print(f"❌ Ledger deletion failed: {e}")
            raise

    def create_transfer_package(self) -> Dict[str, Any]:
        """Create transfer package for moving ledger to Vault Hub"""
        
        if not self.entries:
            return {
                "error": "No entries to transfer",
                "ledger_name": self.ledger_name
            }
        
        # Get final entries for bootstrap
        final_entries = self.entries[-5:] if len(self.entries) >= 5 else self.entries
        
        transfer_package = {
            "transfer_timestamp": datetime.now(timezone.utc).isoformat(),
            "source_ledger": self.ledger_name,
            "total_entries": len(self.entries),
            "final_hash": self.last_hash,
            "bootstrap_entries": final_entries,
            "hash_validation": self.validate_chain(),
            "transfer_metadata": {
                "first_entry": self.entries[0]["timestamp"] if self.entries else None,
                "last_entry": self.entries[-1]["timestamp"] if self.entries else None,
                "ledger_stats": self.get_stats()
            }
        }
        
        return transfer_package


# Global ledger instances (one per tab/module)
_ledger_instances = {}

def get_ledger(ledger_name: str = "main") -> SmartLedger:
    """Get a specific ledger instance (singleton pattern per ledger)"""
    global _ledger_instances
    if ledger_name not in _ledger_instances:
        _ledger_instances[ledger_name] = SmartLedger(ledger_name)
    return _ledger_instances[ledger_name]

def authorize_and_delete_ledger(ledger_name: str, smart_id: str, reason: str, supervisor_id: Optional[str] = None):
    """Safely delete a ledger with proper authorization and audit trail"""
    ledger = get_ledger(ledger_name)
    ledger.authorized_ledger_deletion(smart_id, reason, supervisor_id)
    
    # Remove from global instances
    global _ledger_instances
    if ledger_name in _ledger_instances:
        del _ledger_instances[ledger_name]

def create_ledger_transfer_package(ledger_name: str) -> Dict[str, Any]:
    """Create transfer package for moving ledger to production Vault Hub"""
    ledger = get_ledger(ledger_name)
    return ledger.create_transfer_package()

def validate_all_ledger_integrity() -> Dict[str, Any]:
    """Validate integrity of all active ledgers"""
    results = {}
    global _ledger_instances
    
    for name, ledger in _ledger_instances.items():
        results[name] = ledger.validate_chain()
    
    return results


# Convenience functions for tab-specific ledgers
def record_module_action(action: str, module_name: str, details: str, user_id: str, smart_id: str = "", metadata: Optional[Dict[str, Any]] = None):
    """Record a module-related action in the modules ledger"""
    return get_ledger("modules").record_action("module", action, module_name, details, user_id, smart_id, metadata)

def record_node_action(action: str, node_name: str, details: str, user_id: str, smart_id: str = "", metadata: Optional[Dict[str, Any]] = None):
    """Record a node-related action in the nodes ledger"""
    return get_ledger("nodes").record_action("node", action, node_name, details, user_id, smart_id, metadata)

def record_equipment_action(action: str, equipment_name: str, details: str, user_id: str, smart_id: str = "", metadata: Optional[Dict[str, Any]] = None):
    """Record an equipment-related action in the equipment ledger"""
    return get_ledger("equipment").record_action("equipment", action, equipment_name, details, user_id, smart_id, metadata)

def record_domain_action(action: str, domain_name: str, details: str, user_id: str, smart_id: str = "", metadata: Optional[Dict[str, Any]] = None):
    """Record a domain-related action in the domains ledger"""
    return get_ledger("domains").record_action("domain", action, domain_name, details, user_id, smart_id, metadata)

def record_user_action(action: str, target_user: str, details: str, user_id: str, metadata: Optional[Dict[str, Any]] = None):
    """Record a user management action in the users ledger"""
    return get_ledger("users").record_action("user", action, target_user, details, user_id, "", metadata)

def record_system_action(action: str, component: str, details: str, user_id: str = "system", metadata: Optional[Dict[str, Any]] = None):
    """Record a system-level action in the system ledger"""
    return get_ledger("system").record_action("system", action, component, details, user_id, "", metadata)

def get_all_recent_activities(limit: int = 50) -> List[Dict[str, Any]]:
    """Get recent activities from all tab ledgers for Overview display"""
    all_activities = []
    
    # Get activities from each tab ledger
    tab_ledgers = ["modules", "nodes", "domains", "equipment", "users", "system"]
    
    for tab_name in tab_ledgers:
        try:
            ledger = get_ledger(tab_name)
            activities = ledger.get_entries(limit=20)  # Get recent from each
            
            # Add tab context to each activity
            for activity in activities:
                activity["tab_source"] = tab_name
                all_activities.append(activity)
        except Exception as e:
            print(f"Error getting activities from {tab_name} ledger: {e}")
    
    # Sort all activities by timestamp (newest first)
    all_activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return all_activities[:limit]


if __name__ == "__main__":
    # Test the ledger system
    print("🧪 Testing SMART-Ledger system...")
    
    ledger = SmartLedger()
    
    # Test some entries
    ledger.record_action("system", "start", "SMART-Admin", "System startup", "admin", metadata={"version": "2.0"})
    ledger.record_action("module", "scan", "SMART-Compliance", "Module discovery scan", "admin", "MOD-12345")
    ledger.record_action("node", "register", "raspberry-pi-001", "New node registered", "admin", "NOD-67890")
    
    # Validate chain
    validation = ledger.validate_chain()
    print(f"Chain validation: {validation}")
    
    # Get stats
    stats = ledger.get_stats()
    print(f"Ledger stats: {stats}")
    
    print("✅ SMART-Ledger test complete")