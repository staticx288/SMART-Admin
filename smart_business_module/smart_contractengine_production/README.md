# SMART-ContractEngine-Production

Standalone Python module for converting production floor SOPs to SmartContracts.

## Purpose
Converts testing and manufacturing SOPs into modular SmartContracts for Floor Hub deployment.

## Supported Domains
- **LP** - Liquid Penetrant Testing
- **MPI** - Magnetic Particle Inspection
- **UT** - Ultrasonic Testing
- **RT** - Radiographic Testing
- **VT** - Visual Testing
- **WELD** - Welding Operations
- **MACHINE** - Machining Operations
- **HEAT** - Heat Treatment
- **CP** - Chemical Processing
- **PAINT** - Paint/Coating
- **POLISH** - Polishing
- **ASSEMBLE** - Assembly
- **INSPECT** - General Inspection

## Generated Contracts
- SmartCompliance - Pre-test checklists
- SmartSP - Procedure steps
- SmartMaintenance - Equipment checks
- SmartSafety - Safety protocols
- SmartQA - Quality validation
- SmartStandards - Standards references
- SmartInventory - Materials tracking

## Usage

```python
from SMART_ContractEngine_Production import ProductionConverter

converter = ProductionConverter()

# Parse SOP document
result = converter.parse_sop(
    file_content=file_bytes,
    filename='LP-Procedure.docx',
    domain='LP'
)

# Generate contracts
contracts = converter.generate_contracts(
    sections=result['sections'],
    domain='LP',
    user_names={'compliance': 'Daily-Check', 'sp': 'Method-A'}
)

# contracts is a list of dicts with YAML content
# Dashboard/Hub handles storage decisions
```

## Dependencies
- `python-docx` - for DOCX parsing
- `PyPDF2` - for PDF parsing

## Installation
Package this module with domain installer for Floor Hub deployment.
