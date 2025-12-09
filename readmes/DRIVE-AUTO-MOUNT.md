# Drive Auto-Mount Configuration

## Fixed: December 6, 2025

### Problem
External drives were not auto-mounting on boot and required password entry each time.

### Solution
Added all three external drives to `/etc/fstab` for automatic mounting at boot time.

## Configured Drives

1. **Web Projects** (sdb1)
   - UUID: `00168cc6-741c-4c58-8a60-d51393d04656`
   - Mount: `/media/broy/Web Projects`
   - **⚠️ CRITICAL**: SMART-Admin is located on this drive!

2. **Misc Project** (sda1)
   - UUID: `6f20ac44-a378-46a9-a096-2cc0cd9cd1f3`
   - Mount: `/media/broy/Misc Project`

3. **Chaos Projects** (sdc1)
   - UUID: `970eb57b-156a-4395-acfa-4064b2e694a7`
   - Mount: `/media/broy/Chaos Projects`

## fstab Configuration

```fstab
# External drives - Auto-mount on boot (added 2025-12-06)
# Web Projects drive (SMART-Admin location)
UUID=00168cc6-741c-4c58-8a60-d51393d04656 /media/broy/Web\040Projects ext4 defaults,nofail 0 2

# Misc Project drive
UUID=6f20ac44-a378-46a9-a096-2cc0cd9cd1f3 /media/broy/Misc\040Project ext4 defaults,nofail 0 2

# Chaos Projects drive
UUID=970eb57b-156a-4395-acfa-4064b2e694a7 /media/broy/Chaos\040Projects ext4 defaults,nofail 0 2
```

## Options Explained

- **defaults**: Standard mount options (rw, suid, dev, exec, auto, nouser, async)
- **nofail**: Boot continues even if drive isn't present (important for external drives)
- **0**: No dump backup
- **2**: Filesystem check order (2 = after root filesystem)

## Verification

After reboot, verify drives are mounted:
```bash
df -h | grep "/media/broy"
```

Should show:
```
/dev/sdb1    458G  9.0G  426G   3% /media/broy/Web Projects
/dev/sda1    458G   18G  417G   5% /media/broy/Misc Project
/dev/sdc1    458G  2.2G  432G   1% /media/broy/Chaos Projects
```

## Backup

Original fstab backed up to: `/etc/fstab.backup.YYYYMMDD`

To restore if needed:
```bash
sudo cp /etc/fstab.backup.YYYYMMDD /etc/fstab
sudo systemctl daemon-reload
```

## Impact on SMART-Admin Auto-Start

Since SMART-Admin is located on the **Web Projects** drive, the boot sequence is now:

1. **System boots**
2. **fstab mounts external drives** (including Web Projects)
3. **PM2 systemd service starts** (`pm2-broy.service`)
4. **PM2 resurrects processes** from `/media/broy/Web Projects/SMART-Admin/`
5. **SMART-Admin server and agent start automatically** ✅

This was likely the root cause of your auto-start issues - PM2 was trying to start before the drive was mounted!

## Troubleshooting

**If drives don't mount on boot:**
```bash
# Check system logs
sudo journalctl -b | grep -i "media/broy"

# Verify fstab syntax
sudo findmnt --verify

# Manually mount
sudo mount -a
```

**If SMART-Admin doesn't start after reboot:**
```bash
# The drive MUST mount first, then check PM2
df -h | grep "Web Projects"
pm2 list
```
