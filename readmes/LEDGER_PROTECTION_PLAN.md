# SMART-Admin Ledger Protection Plan
**Version:** 1.0  
**Date:** December 2, 2025  
**Status:** PLANNING PHASE  
**Target:** Production Launch

---

## 🎯 OBJECTIVE

Implement **immutable ledger protection** to prevent deletion, tampering, or corruption of audit trail data in production. The ledger must be append-only with no delete capability once production mode is enabled.

---

## 🚨 CURRENT STATE (PRE-PRODUCTION)

### Development Mode (Now)
- ✅ Ledger files are editable/deletable
- ✅ Manual cleanup allowed for testing
- ✅ Data directory can be reset
- ✅ No protection mechanisms active

### What Users Can Currently Do:
```bash
# Delete all ledgers (ALLOWED IN DEV)
rm -rf data/ledger/*.jsonl
rm -rf data/ledger/*_index.json

# Reset entire data directory
rm -rf data/

# Modify ledger entries
nano data/ledger/nodes_ledger.jsonl
```

**Problem**: Same capabilities exist in production → COMPLIANCE VIOLATION

**Acceptable System-Initiated Deletion**: Automated ledger transfer from nodes to Vault (with full audit trail)

---

## 🔒 REQUIRED PROTECTIONS FOR PRODUCTION

### 1. Production Mode Flag
**Implementation**: Environment variable + configuration file

```bash
# .env.production
NODE_ENV=production
SMART_PRODUCTION_MODE=true
LEDGER_IMMUTABLE=true
LEDGER_DELETE_PROTECTION=enabled
```

**Backend Check**:
```typescript
// server/settings.ts
export const isProductionMode = () => {
  return process.env.NODE_ENV === 'production' && 
         process.env.SMART_PRODUCTION_MODE === 'true';
};

export const isLedgerProtected = () => {
  return process.env.LEDGER_IMMUTABLE === 'true';
};
```

---

### 2. File System Permissions
**Implementation**: Linux file permissions + immutable flag

```bash
# Set ledger directory permissions (append-only)
chmod 755 data/ledger/                    # Directory readable/executable
chmod 444 data/ledger/*.jsonl             # Files read-only
chmod 444 data/ledger/*_index.json        # Indexes read-only

# Make files immutable (Linux extended attributes)
sudo chattr +a data/ledger/*.jsonl        # Append-only flag
sudo chattr +i data/ledger/*_index.json   # Immutable flag (updates via Python script only)

# Verify protection
lsattr data/ledger/
# -----a------- data/ledger/nodes_ledger.jsonl (append-only)
# ----i-------- data/ledger/nodes_index.json (immutable)
```

**Effect**:
- ✅ Cannot delete ledger files (even with sudo)
- ✅ Cannot modify existing entries (append-only)
- ✅ Cannot truncate files
- ❌ CAN append new entries (required for operation)

**Removal** (requires explicit admin action):
```bash
# Only if absolutely necessary (audit trail required)
sudo chattr -a data/ledger/nodes_ledger.jsonl  # Remove append-only
sudo chattr -i data/ledger/nodes_index.json    # Remove immutable
```

---

### 3. Backend API Protection
**Implementation**: Prevent USER-initiated delete, allow SYSTEM-initiated transfer

```typescript
// server/ledger-routes.ts

// NEW: Production mode guard - Blocks USER deletions only
const checkProductionLedgerProtection = (req: Request, res: Response, next: NextFunction) => {
  if (isProductionMode() && isLedgerProtected()) {
    // Block user-initiated deletions
    if (req.headers['x-system-operation'] !== 'vault-transfer') {
      return res.status(403).json({
        error: 'Ledger deletion disabled in production mode',
        code: 'LEDGER_PROTECTED',
        message: 'Audit trail cannot be deleted by users. Only system-initiated vault transfers allowed.'
      });
    }
  }
  next();
};

// System-only ledger transfer endpoint
router.post('/ledger/:tab/transfer-to-vault', checkProductionLedgerProtection, async (req, res) => {
  if (!isSystemAuthenticated(req)) {
    logProtectionEvent({
      action: 'unauthorized_vault_transfer_attempt',
      user_id: req.session?.userId || 'anonymous',
      ip: req.ip,
      success: false,
      reason: 'Not a system-initiated operation'
    });
    
    return res.status(403).json({ 
      error: 'Vault transfer must be system-initiated',
      code: 'SYSTEM_OPERATION_REQUIRED'
    });
  }
  
  // Log the transfer operation
  logProtectionEvent({
    action: 'ledger_vault_transfer',
    user_id: 'SYSTEM',
    ip: req.ip,
    success: true,
    reason: `Automated transfer of ${req.params.tab} ledger to Vault`
  });
  
  // Perform transfer (implemented in Python script)
  const result = await transferLedgerToVault(req.params.tab);
  res.json({ success: true, ...result });
});

// USER delete endpoints - BLOCKED in production
router.delete('/ledger/:tab', checkProductionLedgerProtection, async (req, res) => {
  // This endpoint should NEVER be called by users in production
  if (isProductionMode()) {
    logProtectionEvent({
      action: 'attempted_user_ledger_deletion',
      user_id: req.session?.userId || 'anonymous',
      ip: req.ip,
      success: false,
      reason: 'User attempted to delete ledger in production mode'
    });
    
    return res.status(403).json({
      error: 'Forbidden',
      code: 'USER_LEDGER_DELETE_BLOCKED',
      message: 'Users cannot delete ledgers in production. Contact system administrator.'
    });
  }
  
  // Development mode only
  res.status(501).json({ error: 'Not implemented' });
});
```

---

### 4. Python Ledger Script Protection
**Implementation**: Production mode detection with system-initiated transfer support

```python
# server/smart_ledger.py

import os
import sys
import json
import shutil
from datetime import datetime, timezone

def is_production_mode():
    """Check if running in production mode"""
    return os.environ.get('NODE_ENV') == 'production' and \
           os.environ.get('SMART_PRODUCTION_MODE') == 'true'

def is_ledger_protected():
    """Check if ledger immutability is enabled"""
    return os.environ.get('LEDGER_IMMUTABLE') == 'true'

def is_system_operation():
    """Check if current operation is system-initiated (not user-initiated)"""
    return os.environ.get('SMART_SYSTEM_OPERATION') == 'true'

class LedgerManager:
    def __init__(self, base_path: str = "data/ledger"):
        self.base_path = base_path
        self.production_mode = is_production_mode()
        self.protected = is_ledger_protected()
        
        if self.production_mode and self.protected:
            print("🔒 PRODUCTION MODE: Ledger protection ACTIVE", file=sys.stderr)
    
    def delete_ledger(self, tab: str, system_initiated: bool = False):
        """Delete ledger - BLOCKED FOR USERS, ALLOWED FOR SYSTEM TRANSFERS"""
        if self.production_mode and self.protected:
            # Block user-initiated deletions
            if not system_initiated:
                raise PermissionError(
                    f"PRODUCTION PROTECTION: Users cannot delete {tab} ledger. "
                    f"Ledger is immutable in production mode. "
                    f"Only system-initiated vault transfers can remove ledgers."
                )
            
            # System-initiated deletion requires audit trail
            if not is_system_operation():
                raise PermissionError(
                    f"SYSTEM OPERATION REQUIRED: Must set SMART_SYSTEM_OPERATION=true "
                    f"for automated ledger transfers."
                )
        
        # Development mode OR system-initiated transfer
        ledger_file = os.path.join(self.base_path, f"{tab}_ledger.jsonl")
        index_file = os.path.join(self.base_path, f"{tab}_index.json")
        
        if os.path.exists(ledger_file):
            os.remove(ledger_file)
        if os.path.exists(index_file):
            os.remove(index_file)
    
    def transfer_to_vault(self, tab: str, vault_path: str) -> dict:
        """Transfer ledger to Vault with full audit trail - SYSTEM OPERATION ONLY"""
        if not is_system_operation():
            raise PermissionError("Vault transfer must be system-initiated")
        
        ledger_file = os.path.join(self.base_path, f"{tab}_ledger.jsonl")
        index_file = os.path.join(self.base_path, f"{tab}_index.json")
        
        if not os.path.exists(ledger_file):
            raise FileNotFoundError(f"Ledger {tab} not found")
        
        # Create transfer audit entry
        transfer_record = {
            "transfer_timestamp": datetime.now(timezone.utc).isoformat(),
            "source_node": os.environ.get('NODE_ID', 'unknown'),
            "ledger_tab": tab,
            "ledger_stats": self.get_stats(tab),
            "destination": vault_path,
            "operation": "vault_transfer",
            "system_initiated": True
        }
        
        # Copy files to Vault with preservation
        vault_ledger = os.path.join(vault_path, f"{tab}_ledger.jsonl")
        vault_index = os.path.join(vault_path, f"{tab}_index.json")
        
        os.makedirs(vault_path, exist_ok=True)
        shutil.copy2(ledger_file, vault_ledger)
        shutil.copy2(index_file, vault_index)
        
        # Write transfer audit log
        audit_log = os.path.join(vault_path, "transfer_audit.jsonl")
        with open(audit_log, "a") as f:
            f.write(json.dumps(transfer_record) + "\n")
        
        # Only after successful transfer, delete source (with system flag)
        self.delete_ledger(tab, system_initiated=True)
        
        return transfer_record
    
    def truncate_ledger(self, tab: str):
        """Truncate ledger - ALWAYS BLOCKED (even for system)"""
        raise NotImplementedError(
            "Ledger truncation not supported. "
            "Use vault transfer to archive and remove old ledgers."
        )
```

---

### 5. Frontend UI Protection
**Implementation**: Hide/disable delete buttons in production

```typescript
// client/src/lib/environment.ts
export const isProductionMode = () => {
  return import.meta.env.PROD && 
         import.meta.env.VITE_PRODUCTION_MODE === 'true';
};

export const isLedgerProtected = () => {
  return import.meta.env.VITE_LEDGER_IMMUTABLE === 'true';
};

// client/src/components/infrastructure/smart-ledger-viewer.tsx
import { isProductionMode, isLedgerProtected } from '@/lib/environment';

export default function SmartLedgerViewer() {
  const productionMode = isProductionMode();
  const ledgerProtected = isLedgerProtected();
  
  // Remove delete/clear buttons entirely in production
  const showDangerousActions = !productionMode || !ledgerProtected;
  
  return (
    <div>
      {/* Ledger entries display */}
      
      {showDangerousActions && (
        <Button variant="destructive" onClick={handleClearLedger}>
          ⚠️ Clear Ledger (Dev Only)
        </Button>
      )}
      
      {productionMode && ledgerProtected && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Production Mode</AlertTitle>
          <AlertDescription>
            Ledger is immutable. Entries cannot be deleted or modified.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

---

### 6. Database Backup Protection
**Implementation**: Immutable backup strategy

```bash
# Daily ledger snapshots (append-only)
#!/bin/bash
# /opt/smart-admin/scripts/ledger_backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/smart-admin/backups/ledger"
DATA_DIR="/opt/smart-admin/data/ledger"

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Copy all ledger files (preserves immutable flags)
cp -a "$DATA_DIR"/*.jsonl "$BACKUP_DIR/$DATE/"
cp -a "$DATA_DIR"/*_index.json "$BACKUP_DIR/$DATE/"

# Make backup immutable
sudo chattr +i -R "$BACKUP_DIR/$DATE"

# Verify backup
echo "✅ Ledger backup created: $BACKUP_DIR/$DATE"
lsattr "$BACKUP_DIR/$DATE/"

# Keep last 90 days of backups only
find "$BACKUP_DIR" -type d -mtime +90 -exec sudo chattr -i -R {} \; -exec rm -rf {} \;
```

**Cron Schedule**:
```cron
# Run daily at 2 AM
0 2 * * * /opt/smart-admin/scripts/ledger_backup.sh >> /var/log/smart-ledger-backup.log 2>&1
```

---

### 7. Audit Trail for Protection Changes
**Implementation**: Log any attempts to modify protection

```typescript
// server/ledger-protection-audit.ts

import { appendFileSync } from 'fs';
import { join } from 'path';

const PROTECTION_LOG = join(process.cwd(), 'data', 'ledger_protection_audit.log');

export const logProtectionEvent = (event: {
  action: string;
  user_id: string;
  ip: string;
  success: boolean;
  reason?: string;
}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    ...event
  };
  
  appendFileSync(PROTECTION_LOG, JSON.stringify(entry) + '\n');
  
  // Alert on suspicious activity
  if (event.action.includes('delete') || event.action.includes('modify')) {
    console.error('🚨 SECURITY ALERT:', entry);
    // TODO: Send email/Slack notification to admin
  }
};

// Usage in ledger routes
router.delete('/ledger/:tab', (req, res) => {
  logProtectionEvent({
    action: 'attempted_ledger_deletion',
    user_id: req.session?.userId || 'anonymous',
    ip: req.ip,
    success: false,
    reason: 'Production mode active - operation blocked'
  });
  
  res.status(403).json({ error: 'Ledger deletion disabled' });
});
```

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Configuration (Pre-Production)
**Timeline**: Before launch  
**Tasks**:
- [ ] Add environment variable support (.env.production)
- [ ] Create `isProductionMode()` helper functions
- [ ] Add ledger protection flags to settings
- [ ] Test environment variable detection

### Phase 2: Backend Protection (Pre-Production)
**Timeline**: Before launch  
**Tasks**:
- [ ] Add production mode guards to ledger routes
- [ ] Update Python ledger script with protection checks
- [ ] Add system operation authentication mechanism
- [ ] Create vault transfer endpoint (system-only)
- [ ] Block user delete endpoints in production
- [ ] Add protection event logging
- [ ] Test user deletions blocked, system transfers allowed

### Phase 3: Frontend Adaptation (Pre-Production)
**Timeline**: Before launch  
**Tasks**:
- [ ] Add production mode detection to frontend
- [ ] Hide delete buttons when protected
- [ ] Add production mode indicators to ledger viewer
- [ ] Update UI to show "immutable" status
- [ ] Test UI reflects protection state

### Phase 4: File System Hardening (Deployment Day)
**Timeline**: During production deployment  
**Tasks**:
- [ ] Set file permissions (chmod 444)
- [ ] Apply immutable flags (chattr +a, +i)
- [ ] Verify protection with lsattr
- [ ] Test append operations still work
- [ ] Document removal process for emergencies

### Phase 5: Vault Transfer & Backup System (Post-Deployment)
**Timeline**: Week 1 of production  
**Tasks**:
- [ ] Create automated vault transfer script with storage threshold checks
- [ ] Configure retention policy: 180 days or 2GB per ledger
- [ ] Set up cron job for monthly vault transfer checks (Pi 5 nodes)
- [ ] Create daily backup script for Vault archive (separate from transfers)
- [ ] Set up cron job for daily backups (Vault only)
- [ ] Test vault transfer procedure end-to-end
- [ ] Test backup restoration procedure
- [ ] Document vault transfer and backup policies (64GB node capacity)
- [ ] Monitor node storage usage for first 3 months to validate retention policy
- [ ] Verify both transfer and backup immutability

### Phase 6: Monitoring (Ongoing)
**Timeline**: Continuous  
**Tasks**:
- [ ] Monitor protection event logs
- [ ] Set up alerts for deletion attempts
- [ ] Review backup integrity weekly
- [ ] Audit file permissions monthly
- [ ] Update documentation as needed

---

## 🧪 TESTING CHECKLIST

### Development Mode Tests
- [ ] Verify ledger operations work normally
- [ ] Confirm delete operations are allowed
- [ ] Test file modifications succeed
- [ ] Validate no protection warnings appear

### Production Mode Tests (Staging)
- [ ] Verify `SMART_PRODUCTION_MODE=true` is detected
- [ ] Confirm USER delete endpoints return 403
- [ ] Test SYSTEM vault transfers succeed
- [ ] Verify `SMART_SYSTEM_OPERATION=true` enables transfers
- [ ] Test append operations still succeed
- [ ] Verify immutable flags prevent manual deletion
- [ ] Confirm vault transfer deletes source after success
- [ ] Validate transfer audit trail created
- [ ] Confirm UI hides delete buttons
- [ ] Validate protection logs capture user attempts

### Emergency Procedures Test
- [ ] Document steps to temporarily disable protection
- [ ] Test backup restoration procedure
- [ ] Verify admin can remove immutable flags
- [ ] Confirm re-enabling protection works
- [ ] Validate audit trail captures emergency actions

---

## 📋 PRODUCTION DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Set environment variables in production server
- [ ] Build application with production config
- [ ] Test protection in staging environment
- [ ] Review all ledger-related code paths
- [ ] Document emergency procedures

### Deployment
- [ ] Deploy application to production server
- [ ] Verify `NODE_ENV=production`
- [ ] Verify `SMART_PRODUCTION_MODE=true`
- [ ] Apply file system protections (chattr)
- [ ] Verify ledger operations work
- [ ] Test protection blocks delete attempts
- [ ] Set up backup cron job
- [ ] Configure monitoring/alerts

### Post-Deployment
- [ ] Verify first ledger entries created successfully
- [ ] Confirm protection logs capturing events
- [ ] Test UI reflects production mode
- [ ] Run backup manually and verify
- [ ] Document any issues encountered

---

## 🔄 AUTOMATED VAULT TRANSFER PROCEDURE

**When**: Node reaches storage threshold (configurable, default: when ledger exceeds 1GB or 180 days), scheduled maintenance, node decommissioning  
**Who**: SYSTEM (automated background process)  
**Storage Context**: Raspberry Pi 5 nodes have 64GB SD cards - sufficient for several months of local ledger retention

**Recommended Retention Policy**:
- **Local Node Storage**: Keep last 180 days (6 months) or 2GB of ledger data
- **Automatic Transfer Trigger**: When either threshold is exceeded
- **Vault Archive**: Permanent storage of all transferred ledgers
- **Estimated Capacity**: 64GB SD card can hold 6-12 months of operational data + ledgers before transfer needed

```python
# Automated vault transfer script
# /opt/smart-admin/scripts/vault_transfer.py

import os
import sys
import json
from pathlib import Path

# Set system operation flag for Python script
os.environ['SMART_SYSTEM_OPERATION'] = 'true'

from smart_ledger import LedgerManager

def check_transfer_needed(ledger_path: str, max_age_days: int = 180, max_size_mb: int = 2048) -> bool:
    """Check if ledger needs to be transferred to Vault"""
    import time
    
    if not os.path.exists(ledger_path):
        return False
    
    # Check file size
    size_mb = os.path.getsize(ledger_path) / (1024 * 1024)
    if size_mb > max_size_mb:
        return True
    
    # Check age of oldest entries
    with open(ledger_path, 'r') as f:
        first_line = f.readline()
        if first_line:
            entry = json.loads(first_line)
            timestamp = entry.get('timestamp', '')
            # Calculate age... if > max_age_days, return True
    
    return False

def automated_vault_transfer(tab: str, vault_path: str):
    """System-initiated ledger transfer to Vault"""
    
    ledger = LedgerManager()
    ledger_file = f"data/ledger/{tab}_ledger.jsonl"
    
    # Check if transfer is actually needed
    if not check_transfer_needed(ledger_file):
        print(f"ℹ️  SYSTEM: {tab} ledger does not need transfer yet")
        return None
    
    # Log transfer initiation
    print(f"🔄 SYSTEM: Initiating vault transfer for {tab} ledger")
    print(f"   Reason: Storage threshold exceeded")
    print(f"   Destination: {vault_path}")
    
    # Perform transfer with full audit trail
    transfer_result = ledger.transfer_to_vault(tab, vault_path)
    
    # Log completion
    print(f"✅ SYSTEM: Vault transfer completed")
    print(f"   Transferred: {transfer_result['ledger_stats']['total_entries']} entries")
    print(f"   Source deleted: Yes (audit trail preserved)")
    print(f"   Node storage freed: {transfer_result.get('bytes_freed', 0) / (1024*1024):.2f} MB")
    
    return transfer_result

# Cron job executes this
if __name__ == "__main__":
    vault_path = os.environ.get('VAULT_PATH', '/mnt/vault/ledger_archive')
    
    # Check and transfer all ledger types
    for tab in ['nodes', 'equipment', 'modules', 'domains']:
        automated_vault_transfer(tab, vault_path)
```

**Cron Schedule** (runs monthly on nodes):
```cron
# Check vault transfer needs monthly (first Sunday at 3 AM)
# With 64GB storage, transfers only happen when thresholds exceeded
0 3 1 * * SMART_SYSTEM_OPERATION=true /usr/bin/python3 /opt/smart-admin/scripts/vault_transfer.py >> /var/log/vault-transfer.log 2>&1
```

**Storage Planning for 64GB Pi 5 Nodes**:
- Operating System: ~8GB
- SMART Agent + Dependencies: ~2GB
- Module Frameworks: ~1GB
- Working Data: ~5GB
- **Available for Ledgers: ~48GB**
- Ledger Growth Rate: ~100-500MB/month (varies by activity)
- **Local Retention Before Transfer: 6-12 months**

**Audit Trail**:
- Transfer logged in `vault_path/transfer_audit.jsonl`
- Source node, timestamp, entry count recorded
- Original ledger deleted ONLY after successful Vault storage
- Hash chain continuity preserved
- System operation flag prevents user interference

---

## 🔐 EMERGENCY LEDGER ACCESS PROCEDURE

**When**: Critical data corruption, regulatory audit request, court order  
**Who**: System Administrator with audit trail approval  
**How**:

```bash
# 1. Document the reason and approval
echo "EMERGENCY ACCESS: $(date) - Reason: [DOCUMENT REASON]" >> /var/log/smart-ledger-emergency.log

# 2. Create full system backup FIRST
sudo rsync -av /opt/smart-admin/data/ /opt/smart-admin/emergency-backup-$(date +%Y%m%d)/

# 3. Remove immutable protection (LOGGED)
sudo chattr -a data/ledger/*.jsonl
sudo chattr -i data/ledger/*_index.json

# 4. Perform required operation with audit trail
# [PERFORM OPERATION]

# 5. Re-enable protection IMMEDIATELY
sudo chattr +a data/ledger/*.jsonl
sudo chattr +i data/ledger/*_index.json

# 6. Log completion
echo "PROTECTION RESTORED: $(date)" >> /var/log/smart-ledger-emergency.log

# 7. Notify stakeholders
# [SEND NOTIFICATION EMAIL]
```

**Required Documentation**:
- Written justification for access
- Approval from compliance officer
- List of operations performed
- Before/after data snapshots
- Restoration verification

---

## 📊 SUCCESS CRITERIA

### Technical Success
✅ Production mode properly detected  
✅ USER delete operations blocked with 403  
✅ SYSTEM vault transfers work correctly  
✅ File system protections prevent manual deletion  
✅ Append operations continue working  
✅ UI reflects immutable status  
✅ Vault transfers automated with audit trail  
✅ Backups created automatically  

### Compliance Success
✅ Audit trail cannot be deleted  
✅ All access attempts logged  
✅ Emergency procedures documented  
✅ Backup retention enforced  
✅ Protection changes traceable  

### Operational Success
✅ No impact on normal operations  
✅ Clear error messages for blocked operations  
✅ Admin can respond to emergencies  
✅ Team trained on procedures  

---

## 📚 REFERENCES

- **Immutable Audit Logs**: SOC 2 Type II Compliance
- **Linux Extended Attributes**: `man chattr`
- **File Permissions**: POSIX security model
- **Regulatory Requirements**: GDPR Article 5(1)(f), HIPAA 164.312(b)
- **Industry Standards**: NIST SP 800-92 (Log Management)

---

## 🎯 NEXT STEPS

1. **Review Plan**: Team review and approval
2. **Staging Test**: Implement and test in staging
3. **Documentation**: Create admin procedures
4. **Training**: Brief team on production mode
5. **Deployment**: Enable protection on launch day
6. **Monitor**: Watch for issues in first week

---

**Document Status**: READY FOR REVIEW  
**Owner**: DevOps Team  
**Approvers**: [TBD]  
**Implementation Date**: [TBD - Production Launch]
