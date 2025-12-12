# SMART-ContractEngine-Business

Standalone Python module for converting business operations SOPs to SmartContracts.

## Purpose
Converts business/admin SOPs into modular SmartContracts for Business Hub deployment.

## Supported Domains
- **CLIENT** - Client Management
- **PAY** - Payment/Billing
- **TRAIN** - Training/Education
- **CERT** - Certification
- **HR** - People Operations
- **PROJECT** - Project Management
- **AUDIT** - Audit Procedures
- **ADMIN** - General Administration

## Generated Contracts
- SmartClientManager - Client relationship management
- SmartClientPO - Work orders
- SmartPay - Payment logic
- SmartEducation - Training modules
- SmartCertifiedPeople - Certification requirements
- SmartPeopleOps - HR processes
- SmartProjects - Project workflows

## Usage

```python
from SMART_ContractEngine_Business import BusinessConverter

converter = BusinessConverter()

# Parse SOP document
result = converter.parse_sop(
    file_content=file_bytes,
    filename='Client-Onboarding.docx',
    domain='CLIENT'
)

# Generate contracts
contracts = converter.generate_contracts(
    sections=result['sections'],
    domain='CLIENT',
    user_names={'client_manager': 'Intake-Process'}
)

# contracts is a list of dicts with YAML content
# Dashboard/Hub handles storage decisions
```

## Dependencies
- `python-docx` - for DOCX parsing
- `PyPDF2` - for PDF parsing

## Installation
Package this module with domain installer for Business Hub deployment.
