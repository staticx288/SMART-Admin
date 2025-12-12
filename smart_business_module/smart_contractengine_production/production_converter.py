#!/usr/bin/env python3
"""
Production Floor SOP Converter
Converts testing and manufacturing SOPs to SmartContracts

Pure processing module - no storage logic
Input: SOP documents (docx, pdf, md, txt, images)
Output: Contract data structures (dicts/YAML strings)
"""

import re
from typing import Dict, List, Any, Optional, BinaryIO
from pathlib import Path


class ProductionConverter:
    """
    Converts production floor SOPs to SmartContracts
    Handles: LP, MPI, UT, RT, VT, WELD, MACHINE, HEAT, CP, PAINT, etc.
    """
    
    # Supported production domains
    DOMAINS = [
        'LP',      # Liquid Penetrant Testing
        'MPI',     # Magnetic Particle Inspection
        'UT',      # Ultrasonic Testing
        'RT',      # Radiographic Testing
        'VT',      # Visual Testing
        'WELD',    # Welding Operations
        'MACHINE', # Machining Operations
        'HEAT',    # Heat Treatment
        'CP',      # Chemical Processing
        'PAINT',   # Paint/Coating
        'POLISH',  # Polishing
        'ASSEMBLE',# Assembly
        'INSPECT'  # General Inspection
    ]
    
    # Contract types generated
    CONTRACT_TYPES = {
        'safety': 'SmartSafety',
        'compliance': 'SmartCompliance',
        'sp': 'SmartSP',
        'maintenance': 'SmartMaintenance',
        'materials': 'SmartInventory',
        'qa': 'SmartQA',
        'standards': 'SmartStandards'
    }
    
    def __init__(self):
        """Initialize the production converter"""
        self.domain = None
        self.sections = {}
        # Silently initialize - print only for standalone testing
    
    def parse_sop(self, file_content: bytes, filename: str, domain: str) -> Dict[str, Any]:
        """
        Parse SOP document and extract sections
        
        Args:
            file_content: Binary content of the SOP file
            filename: Original filename (for format detection)
            domain: Production domain (LP, WELD, etc.)
            
        Returns:
            Dictionary with extracted sections and metadata
        """
        if domain not in self.DOMAINS:
            raise ValueError(f"Invalid domain: {domain}. Must be one of {self.DOMAINS}")
        
        self.domain = domain
        
        # Detect file format
        file_ext = Path(filename).suffix.lower()
        
        # Parse based on format
        if file_ext == '.docx':
            document_text = self._parse_docx(file_content)
        elif file_ext == '.pdf':
            document_text = self._parse_pdf(file_content)
        elif file_ext in ['.md', '.txt']:
            document_text = file_content.decode('utf-8')
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
        
        # Extract sections from parsed text
        self.sections = self._extract_sections(document_text)
        
        # Generate suggested names
        suggested_names = self._suggest_contract_names(self.sections)
        
        return {
            'domain': domain,
            'filename': filename,
            'sections': self.sections,
            'suggested_names': suggested_names,
            'section_count': {k: len(v) if isinstance(v, list) else 1 for k, v in self.sections.items()}
        }
    
    def _parse_docx(self, file_content: bytes) -> str:
        """Parse DOCX file and extract text"""
        try:
            from docx import Document
            from io import BytesIO
            
            doc = Document(BytesIO(file_content))
            
            # Extract all text preserving structure
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            
            return '\n'.join(full_text)
            
        except ImportError:
            raise ImportError("python-docx required for DOCX parsing: pip install python-docx")
    
    def _parse_pdf(self, file_content: bytes) -> str:
        """Parse PDF file and extract text"""
        try:
            import PyPDF2
            from io import BytesIO
            
            pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
            
            # Extract all text
            full_text = []
            for page in pdf_reader.pages:
                full_text.append(page.extract_text())
            
            return '\n'.join(full_text)
            
        except ImportError:
            raise ImportError("PyPDF2 required for PDF parsing: pip install PyPDF2")
    
    def _extract_sections(self, document_text: str) -> Dict[str, Any]:
        """
        Extract sections from document text
        Uses pattern matching to identify section types
        """
        sections = {
            'safety': [],
            'compliance': [],
            'sp': [],
            'maintenance': [],
            'materials': [],
            'qa': [],
            'standards': []
        }
        
        # Split document into lines
        lines = document_text.split('\n')
        
        current_section = None
        current_content = []
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Identify section by keywords
            if any(keyword in line_lower for keyword in ['safety', 'ppe', 'hazard', 'emergency']):
                if current_section and current_content:
                    sections[current_section].append('\n'.join(current_content))
                current_section = 'safety'
                current_content = [line]
                
            elif any(keyword in line_lower for keyword in ['pre-check', 'daily check', 'before', 'setup']):
                if current_section and current_content:
                    sections[current_section].append('\n'.join(current_content))
                current_section = 'compliance'
                current_content = [line]
                
            elif any(keyword in line_lower for keyword in ['procedure', 'step', 'operation', 'process']):
                if current_section and current_content:
                    sections[current_section].append('\n'.join(current_content))
                current_section = 'sp'
                current_content = [line]
                
            elif any(keyword in line_lower for keyword in ['equipment', 'calibration', 'maintenance']):
                if current_section and current_content:
                    sections[current_section].append('\n'.join(current_content))
                current_section = 'maintenance'
                current_content = [line]
                
            elif any(keyword in line_lower for keyword in ['material', 'batch', 'chemical', 'inventory']):
                if current_section and current_content:
                    sections[current_section].append('\n'.join(current_content))
                current_section = 'materials'
                current_content = [line]
                
            elif any(keyword in line_lower for keyword in ['qa', 'quality', 'inspection', 'acceptance']):
                if current_section and current_content:
                    sections[current_section].append('\n'.join(current_content))
                current_section = 'qa'
                current_content = [line]
                
            elif any(keyword in line_lower for keyword in ['standard', 'astm', 'iso', 'aws', 'spec']):
                if current_section and current_content:
                    sections[current_section].append('\n'.join(current_content))
                current_section = 'standards'
                current_content = [line]
                
            elif current_section:
                current_content.append(line)
        
        # Add last section
        if current_section and current_content:
            sections[current_section].append('\n'.join(current_content))
        
        return sections
    
    def _suggest_contract_names(self, sections: Dict[str, Any]) -> Dict[str, str]:
        """
        Suggest contract names based on content
        Returns suggested names without domain prefix
        """
        suggestions = {}
        
        # Default suggestions based on common patterns
        if sections['safety']:
            suggestions['safety'] = 'Safety-Protocol'
        if sections['compliance']:
            suggestions['compliance'] = 'Daily-Checklist'
        if sections['sp']:
            suggestions['sp'] = 'Procedure-Steps'
        if sections['maintenance']:
            suggestions['maintenance'] = 'Equipment-Check'
        if sections['materials']:
            suggestions['materials'] = 'Material-Track'
        if sections['qa']:
            suggestions['qa'] = 'Final-Inspection'
        if sections['standards']:
            suggestions['standards'] = 'Standard-Ref'
        
        return suggestions
    
    def generate_contracts(
        self,
        sections: Dict[str, Any],
        domain: str,
        user_names: Dict[str, str]
    ) -> List[Dict[str, Any]]:
        """
        Generate contract YAML content from extracted sections
        
        Args:
            sections: Extracted SOP sections
            domain: Production domain
            user_names: User-provided names for each contract
            
        Returns:
            List of contracts with YAML content (no file operations)
        """
        contracts = []
        
        for section_type, content in sections.items():
            if not content:  # Skip empty sections
                continue
            
            user_name = user_names.get(section_type, self._suggest_contract_names(sections)[section_type])
            contract_id = f"{domain}-{user_name}"
            
            # Generate YAML based on contract type
            yaml_content = self._generate_yaml(
                contract_id=contract_id,
                contract_type=section_type,
                content=content,
                domain=domain
            )
            
            contracts.append({
                'id': contract_id,
                'type': section_type,
                'contract_class': self.CONTRACT_TYPES[section_type],
                'filename': f"{contract_id}.yaml",
                'yaml_content': yaml_content,
                'domain': domain
            })
        
        # Silently return - print only for standalone testing
        return contracts
    
    def _generate_yaml(
        self,
        contract_id: str,
        contract_type: str,
        content: Any,
        domain: str
    ) -> str:
        """Generate YAML content for specific contract type"""
        
        from datetime import datetime
        
        # Common header for all contracts
        yaml_lines = [
            f"# {self.CONTRACT_TYPES[contract_type]} Contract",
            f"# Generated from SOP for {domain} domain",
            f"",
            f"smart_contract_id: \"{contract_id}\"",
            f"contract_type: \"{self.CONTRACT_TYPES[contract_type]}\"",
            f"created_date: \"{datetime.now().strftime('%Y-%m-%d')}\"",
            f"domain: \"{domain}\"",
            f"status: \"draft\"",
            f""
        ]
        
        # Generate specific content based on type
        if contract_type == 'compliance':
            yaml_lines.extend(self._generate_compliance_yaml(content))
        elif contract_type == 'sp':
            yaml_lines.extend(self._generate_sp_yaml(content))
        elif contract_type == 'safety':
            yaml_lines.extend(self._generate_safety_yaml(content))
        elif contract_type == 'maintenance':
            yaml_lines.extend(self._generate_maintenance_yaml(content))
        elif contract_type == 'materials':
            yaml_lines.extend(self._generate_materials_yaml(content))
        elif contract_type == 'qa':
            yaml_lines.extend(self._generate_qa_yaml(content))
        elif contract_type == 'standards':
            yaml_lines.extend(self._generate_standards_yaml(content))
        
        return '\n'.join(yaml_lines)
    
    def _generate_compliance_yaml(self, content: List[str]) -> List[str]:
        """Generate SmartCompliance contract YAML"""
        yaml_lines = [
            'title: "Pre-Test Compliance Checklist"',
            'description: "Extracted from SOP"',
            '',
            'checklist_steps:'
        ]
        
        # Extract checklist items from content
        step_num = 1
        for section in content:
            lines = section.split('\n')
            for line in lines:
                if line.strip() and len(line) > 10:  # Skip empty and very short lines
                    yaml_lines.append(f'  - step: {step_num}')
                    yaml_lines.append(f'    description: "{line.strip()}"')
                    yaml_lines.append(f'    input_type: "checkbox"')
                    yaml_lines.append('')
                    step_num += 1
        
        return yaml_lines
    
    def _generate_sp_yaml(self, content: List[str]) -> List[str]:
        """Generate SmartSP contract YAML"""
        yaml_lines = [
            'title: "Special Process Procedure"',
            'description: "Step-by-step operations"',
            '',
            'procedure_steps:'
        ]
        
        # Extract procedure steps
        step_num = 1
        for section in content:
            lines = section.split('\n')
            for line in lines:
                if line.strip() and len(line) > 10:
                    yaml_lines.append(f'  - step: {step_num}')
                    yaml_lines.append(f'    operation: "{line.strip()}"')
                    yaml_lines.append('')
                    step_num += 1
        
        return yaml_lines
    
    def _generate_safety_yaml(self, content: List[str]) -> List[str]:
        """Generate SmartSafety contract YAML"""
        return [
            'title: "Safety Protocol"',
            'description: "Safety requirements and PPE"',
            '',
            'safety_requirements:',
            '  ppe_required:',
            '    - "Safety glasses"',
            '    - "Gloves"',
            '  hazards:',
            '    - "Chemical exposure"'
        ]
    
    def _generate_maintenance_yaml(self, content: List[str]) -> List[str]:
        """Generate SmartMaintenance contract YAML"""
        return [
            'title: "Equipment Maintenance"',
            'description: "Equipment checks and calibration"',
            '',
            'maintenance_items:',
            '  - equipment: "Equipment name"',
            '    check: "Calibration check"',
            '    frequency: "Daily"'
        ]
    
    def _generate_materials_yaml(self, content: List[str]) -> List[str]:
        """Generate SmartInventory contract YAML"""
        return [
            'title: "Materials Tracking"',
            'description: "Material batch and certification tracking"',
            '',
            'materials:',
            '  - material: "Material name"',
            '    requires_certification: true',
            '    requires_batch_tracking: true'
        ]
    
    def _generate_qa_yaml(self, content: List[str]) -> List[str]:
        """Generate SmartQA contract YAML"""
        return [
            'title: "Quality Assurance Validation"',
            'description: "Final inspection and acceptance criteria"',
            '',
            'qa_criteria:',
            '  - criterion: "Visual inspection"',
            '    acceptance: "No defects visible"'
        ]
    
    def _generate_standards_yaml(self, content: List[str]) -> List[str]:
        """Generate SmartStandards contract YAML"""
        yaml_lines = [
            'title: "Standards Reference"',
            'description: "Applicable standards and specifications"',
            '',
            'standards:'
        ]
        
        # Extract standard references
        for section in content:
            # Look for ASTM, ISO, AWS patterns
            standards = re.findall(r'(ASTM|ISO|AWS|ASME|API)\s*[A-Z]?\d+[\w-]*', section, re.IGNORECASE)
            for std in standards:
                yaml_lines.append(f'  - standard: "{std}"')
        
        return yaml_lines


# Standalone test
if __name__ == "__main__":
    print("🧪 Testing Production Contract Engine...")
    
    converter = ProductionConverter()
    
    # Test with sample content
    sample_sop = """
    Safety Requirements
    - Wear safety glasses
    - Use chemical resistant gloves
    
    Daily Pre-Check
    - Check UV light intensity
    - Verify batch numbers
    
    Procedure
    1. Clean part
    2. Apply penetrant
    3. Wait 10 minutes
    """
    
    result = converter.parse_sop(
        file_content=sample_sop.encode('utf-8'),
        filename='test.txt',
        domain='LP'
    )
    
    print(f"Extracted sections: {result['section_count']}")
    
    contracts = converter.generate_contracts(
        sections=result['sections'],
        domain='LP',
        user_names=result['suggested_names']
    )
    
    print(f"Generated {len(contracts)} contracts")
    for contract in contracts:
        print(f"  - {contract['id']} ({contract['contract_class']})")
    
    print("✅ Production Engine test complete")
