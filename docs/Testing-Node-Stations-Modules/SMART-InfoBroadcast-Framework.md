# SMART-InfoBroadcast Framework

**Signal the Moment. Lock the Message. Prove the Flow.**

---

## 🧭 Overview

**SMART-InfoBroadcast** is the **public-facing information distribution system** of the SMART-EcoSystem, providing clients and external stakeholders with real-time visibility into operational status and workflow progress. Unlike internal alert systems, InfoBroadcast delivers **client-visible updates** that are **ledger-anchored**, **timestamped**, and tied to verifiable `SMART-ID` records.

This is your **transparent operational window** — giving clients confidence through verified, immutable status updates they can trust and audit.

---

## 🔐 Core Guarantees

| Guarantee               | Description                                                                      |
|-------------------------|----------------------------------------------------------------------------------|
| **Immutable Logging**   | Every broadcast is **hashed and written to SMART-Ledger**                        |
| **SMART-ID Attribution**| Messages are signed with their `ModuleID`, `NodeID`, and optionally `OperatorID` |
| **Audit-Ready**         | Entries are readable by SMART-Audit and validated during formal inspections      |
| **Timestamp Certainty** | UTC-synced timestamp and local monotonic clock                                   |
| **SmartClientPO-Aware** | Messages can be linked to active SmartContract IDs (e.g., `PO-3829`)             |

---

## 🧩 Typical InfoBroadcast Messages

### Test Lifecycle Message
```json
{
  "timestamp": "2025-09-03T10:12:23Z",
  "station": "LP-Station-A2",
  "SMART-ID": "DomainX::LP::Station::A2",
  "SmartPO": "PO-3849",
  "topic": "job.lifecycle",
  "message": "LP Station started test on Part Q832. Estimated 15 minutes.",
  "OperatorID": "SMART-ID::Operator::8823",
  "signed": true,
  "hash": "f95e...d13c",
  "ledgerBlock": "9A-324F-2291"
}
```

### Handoff Transfer Message
```json
{
  "timestamp": "2025-09-03T10:27:45Z",
  "station": "LP-Station-A2",
  "SMART-ID": "DomainX::LP::Station::A2",
  "SmartPO": "PO-3849",
  "topic": "handoff.transfer",
  "message": "Test completed. Data transferred to Business Hub and MT-Station-B1. Part ready for pickup.",
  "transfer_destinations": ["Business-Hub", "MT-Station-B1"],
  "next_contract": "PO-3849-MT",
  "signed": true,
  "hash": "a72f...e84b",
  "ledgerBlock": "9A-324F-2292"
}
```

### Next Station Notification
```json
{
  "timestamp": "2025-09-03T10:27:46Z",
  "station": "MT-Station-B1",
  "SMART-ID": "DomainX::MT::Station::B1",
  "SmartPO": "PO-3849-MT",
  "topic": "station.notification",
  "message": "Part Q832 incoming from LP-Station-A2. SmartContract PO-3849-MT ready for execution.",
  "source_station": "LP-Station-A2",
  "part_id": "Q832",
  "signed": true,
  "hash": "d91a...c45f",
  "ledgerBlock": "9A-324F-2293"
}
```

---

## � Broadcast Types

### **Test Lifecycle Broadcasts**
- Test start/completion notifications
- Milestone and progress updates  

### **Handoff Transfer Broadcasts**
- Data transfer completion notifications (Business Hub + Next Station)
- Transfer success/failure status with destinations
- Next SmartContract routing information
- Part ready for pickup confirmations

### **Next Station Notifications**
- Incoming part/contract alerts for destination stations
- SmartContract chaining workflow updates
- Cross-station coordination messages
- Queue status and readiness confirmations

---

## �🔄 Broadcast Lifecycle

| Step      | Description                                                       |
|-----------|-------------------------------------------------------------------|
| 1️⃣ Create | Module generates a human-readable message tied to a known event   |
| 2️⃣ Hash   | Message is hashed (SHA-256 or SMART-Hash), SMART-ID signed        |
| 3️⃣ Ledger | Sent to `SMART-Ledger` via internal commit mechanism              |
| 4️⃣ Sync   | Optionally synced to BusinessOps for dashboard visibility         |
| 5️⃣ Audit  | Stored forever, accessible to `SMART-Audit` and `SMART-Compliance`|

---

## 🧠 Key Design Rules

- 🔸 **No Unsigned Messages:** All messages must be digitally signed by the module or node.
- 🔸 **No Direct Deletion:** Messages are write-only into SMART-Ledger.
- 🔸 **Time Drift Protected:** Use a `monotonic_clock + UTC` fallback to prevent fake clock games.
- 🔸 **SmartPO Binding:** If active, SmartPO ID must be included in message.
- 🔸 **Operator Attribution Required:** If the message results from human input, `OperatorID` must be recorded.

---

## 📦 System Components

### 📡 `SMART-InfoBroadcast` Module

```python
class SMART-InfoBroadcast:
    def __init__(self, station_id, ledger_client):
        self.station_id = station_id
        self.ledger = ledger_client

    def broadcast(self, message, topic, smart_po=None, operator_id=None, **kwargs):
        payload = {
            "timestamp": self.get_utc_time(),
            "station": self.station_id,
            "SMART-ID": self.get_SMART-_id(),
            "SmartPO": smart_po,
            "OperatorID": operator_id,
            "topic": topic,
            "message": message,
            **kwargs  # Additional fields for handoff/transfer data
        }
        signed = self.sign(payload)
        hash_val = self.hash(signed)
        ledger_block = self.ledger.write(signed, hash_val)
        return {"hash": hash_val, "ledgerBlock": ledger_block}

    def broadcast_handoff_transfer(self, destinations, next_contract, part_id, smart_po):
        return self.broadcast(
            message=f"Test completed. Data transferred to {', '.join(destinations)}. Part ready for pickup.",
            topic="handoff.transfer",
            smart_po=smart_po,
            transfer_destinations=destinations,
            next_contract=next_contract,
            part_id=part_id
        )

    def broadcast_station_notification(self, source_station, part_id, smart_po):
        return self.broadcast(
            message=f"Part {part_id} incoming from {source_station}. SmartContract {smart_po} ready for execution.",
            topic="station.notification",
            smart_po=smart_po,
            source_station=source_station,
            part_id=part_id
        )
```

### 📒 `SMART-Ledger`

Handles:
- Hash generation
- Block inclusion
- Entry timestamps
- Signature validation

---

## 🧠 Dashboard Layer

- ✅ Every message shown is ledger-verifiable
- 🕵️‍♂️ Can be filtered by `OperatorID`, `StationID`, `SmartPO`, or `topic`
- 🟨 Dashboards *do not write broadcasts* — only view them

---

## 🔍 Strategic Compliance & Audit Value

| Feature                     | Audit/Legal Benefit                                  |
|-----------------------------|------------------------------------------------------|
| Full traceability           | Every operational event tied to a ledger block       |
| Immutable records           | Can't be edited or removed                           |
| Operator signatures         | Tracks *who* triggered what and when                 |
| Test lifecycle visibility   | Know when, how, and by whom each step was done       |
| Real-time anomaly detection | SMART-AI can flag missing or out-of-sequence messages|

---

## 🔚 Conclusion

**SMART-InfoBroadcast** is your compliance whisper — a **fully logged, fully verifiable status feed** that tells you what your business is doing right now, with **proof** that it actually happened.

**If someone says "That test didn’t happen," you say, "Let’s check the ledger."**
