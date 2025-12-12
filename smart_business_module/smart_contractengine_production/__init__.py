"""
SMART-ContractEngine-Production
Standalone module for converting production floor SOPs to SmartContracts

Handles: Testing, Manufacturing, Chemical Processing
Domains: LP, MPI, UT, RT, VT, WELD, MACHINE, HEAT, CP, PAINT, etc.

Generates: SmartCompliance, SmartSP, SmartMaintenance, SmartSafety,
          SmartQA, SmartStandards, SmartInventory contracts
"""

from .production_converter import ProductionConverter

__version__ = "1.0.0"
__all__ = ['ProductionConverter']
