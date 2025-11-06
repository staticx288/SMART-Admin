# 📘 SMART-SmartContract Guide

**How SmartSP, SmartCompliance, SmartStandards, and SmartMaintenance Are Created and Used**

---

## ✅ Step 1: **Create the SmartProcessesContracts**

SMART supports two methods for creating SmartProcessContracts (SP (Special Processes), Compliance, Standards, Maintenance, ).

### 🚽 Method 1: **Upload Existing Documents (Auto-Visual Parse)**

**Supported formats**: `.pdf`, `.docx`, `.md`, `.txt`, `.png/.jpg (OCR)`

1. Navigate to the **SmartProcessesContract Creator Panel**
2. Upload your document
3. SMART parses the content and displays it as a **visual editable table**:
   - **Column 1**: Content block
   - **Column 2**: Description / Metadata
4. User **verifies and edits content** as needed
5. User provides a **custom YAML name** (e.g., `SP-LP-ST-001`) for clarity and dropdown reference
6. Select applicable **enforcement conditions**:
   - Examples: `must-complete-before-test`, `require-acknowledgement`, `validate-limits-live`, `check-temp-humidity-before-test`
   - Users may add **multiple conditions per contract**
7. Click **"Create"** to convert to YAML
8. YAML is stored and becomes linkable from SmartContracts

> 🧠 Example: Uploading `LP_Surface_Treatment_SOP.pdf` and naming it `SP-LP-ST-001.yaml` adds it to the library with a human-friendly reference

---

### 📄 Method 2: **Use Blank Templates (Manual Entry)**

1. Open the **Blank Contract Template**
2. Fill out the 2-column format:
   - **Content** (Step, Rule, Limit, etc.)
   - **Description** (What it does, why it matters)
3. Select **enforcement conditions** as needed
4. Submit and click **"Create"**
5. System converts to YAML and stores it in the Process Library

> 📊 Use this for brand new SPs or internal-only logic

---

## 📂 Step 2: **Upload SmartProcessContracts to Node Libraries and SMART-Policy Repository**

Once SmartProcessContracts are created, they are uploaded to both the:

- **Production Floor Testing Nodes** 
- **SMART-Policy Repository** (Vault for centralized reference and governance)

### ⚙️ Deployment Flow

1. Admin selects contracts from the Process Library
2. Assign to relevant **Node-Names** or specific **Node-SMART-IDs**
3. Centralhubs pushes the contracts to the Testing Nodes
4. Files are stored in the NAS path and node library path:
   ```
   /Processes/
     /SP/
     /Compliance/
     /Standards/
     /Maintenance/
   ```

> ⚠️ Nodes only receive contracts for their type (e.g. CP nodes don't get LP SPs)

---

## 📃 Step 3: **Create/Upload & Configure the SmartClientPO**

When a client PO is received (upload or manual entry):

1. Open the **SmartClientPO Builder**
2. Input/import the client’s requested tests same method as setup 1
3. For each test, link and assign enforcement conditions:
   - 🔧 `SmartSP`
   - 📜 `SmartStandard`
   - 🛡️ `SmartCompliance`
   - 🪪 `Tech Certification` (SMART-ID stored)
   - ⚙️ `SmartMaintenance` (optional)
   - 📌 **Set enforcement conditions for each linked contract**
     - Examples: `must-complete-before-test`, `require-acknowledgement`, `validate-limits-live`

### 🔖 Example YAML

```yaml
SmartPO:
  id: PO-2025-093
  part_number: ABC-342
  tests:
    - name: CP Penetrant Test
      sp: SP-CP-A
      standard: STD-CP-A
      standard conditions: 
        - validate-limits-live
      compliance: CP-Checklist-Red
      compliance conditions:
        - must-complete-before-test
    - name: LP Visual Inspection
      sp: SP-LP-C
      compliance: LP-Green
      compliance conditions:
        - none
      standard: STD-LP-B
      standard conditions:
        - require-acknowledgement
```

---

## 🚀 Step 4: **Push configured SmartClientPO to the Production Floor**

Once the SmartClientPO is finalized by the Business Hub:

1. It is **pushed to the Production Floor SMART-Hub**
2. The SmartClientPO waits in staging until the part arrives

> ℹ️ Test stations **do not receive the ClientSmartPO yet** — this ensures unnecessary data isn't loaded too early

---

## 🏢 Step 5: **Push the SmartClientPO to Testing Nodes Once Part is Received**

Once the physical part is received and verified by **SMART-Vision** and **human operator**:

1. Floor SMART-Hub routes the SmartClientPO to the assigned test station
2. At the test station:
   - Part is verified a second time by SMART-Vision
   - Tests are verified by SMART-Gatekeeper to make sure they are for this testing node and tech certifications.
   - ClientSmartPO and SmartSP loads to the dashboard
   - Compliance module enforces pre-checks & certs
   - Standards are validated live
   - Maintenance readiness is checked (if linked)
   - **Conditions are enforced in real-time** by backend modules

> ✅ This all happens automatically. No manual setup needed at the station.

---

## 🫠 Summary Flow

```
SmartProcessContracts (SP / Compliance / Standards / Maintenance) → Created via upload or template
                                ↓
             Uploaded to Node Libraries + SMART-Policy Repository
                                ↓
                    Linked to ClientSmartPO during config
                                ↓
            SmartClientPO pushed to Floor Hub for staging
                                ↓
SmartClientPO delivered to test station ✓ only after part verified on site
                                ↓
     Node executes test with linked logic + real-time enforcement
```

---

## ✅ System Benefits

- Modular, reusable SmartContracts
- Conditions tied directly to each test step
- Clear separation of Business, Production, and Testing flows
- Only valid contracts deployed to each node
- SmartClientPOs reference (not embed) SP/Standard/Compliance
- Runtime validation happens automatically
- Fully traceable, audit-ready, offline-capable

