"""
SMART-ContractEngine-Business
Standalone module for converting business operations SOPs to SmartContracts

Handles: Client Management, HR, Training, Finance, Projects
Domains: CLIENT, PAY, TRAIN, CERT, HR, PROJECT, AUDIT, etc.

Generates: SmartClientPO, SmartPay, SmartEducation, SmartCertifiedPeople,
          SmartPeopleOps, SmartProjects contracts
"""

from .business_converter import BusinessConverter

__version__ = "1.0.0"
__all__ = ['BusinessConverter']
