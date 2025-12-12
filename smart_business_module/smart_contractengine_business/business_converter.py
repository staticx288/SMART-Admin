#!/usr/bin/env python3
"""
Business Operations SOP Converter
Converts business/admin SOPs to SmartContracts

Pure processing module - no storage logic
Input: SOP documents (docx, pdf, md, txt)
Output: Contract data structures (dicts/YAML strings)
"""

import re
from typing import Dict, List, Any, Optional
from pathlib import Path


class BusinessConverter:
    """
    Converts business operations SOPs to SmartContracts
    Handles: CLIENT, PAY, TRAIN, CERT, HR, PROJECT, AUDIT
    """
    
    # Supported business domains
    DOMAINS = [
        'CLIENT',  # Client Management
        'PAY',     # Payment/Billing
        'TRAIN',   # Training/Education
        'CERT',    # Certification
        'HR',      # People Operations
        'PROJECT', # Project Management
        'AUDIT',   # Audit Procedures
        'ADMIN'    # General Administration
    ]
    
    # Contract types generated
    CONTRACT_TYPES = {
        'client_manager': 'SmartClientManager',
        'client_po': 'SmartClientPO',
        'pay': 'SmartPay',
        'education': 'SmartEducation',
        'certification': 'SmartCertifiedPeople',
        'peopleops': 'SmartPeopleOps',
        'project': 'SmartProjects'
    }
    
    def __init__(self):
        """Initialize the business converter"""
        self.domain = None
        self.sections = {}
        # Silently initialize - print only for standalone testing
    
    def parse_sop(self, file_content: bytes, filename: str, domain: str) -> Dict[str, Any]:
        """
        Parse SOP document and extract sections
        
        Args:
            file_content: Binary content of the SOP file
            filename: Original filename (for format detection)
            domain: Business domain (CLIENT, PAY, etc.)
            
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
            'client_manager': [],
            'client_po': [],
            'pay': [],
            'education': [],
            'certification': [],
            'peopleops': [],
            'project': []
        }
        
        # Split document into lines
        lines = document_text.split('\n')
        
        current_section = None
        current_content = []
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Identify section by keywords
            if any(keyword in line_lower for keyword in ['client', 'customer', 'account', 'relationship']):
                if current_section and current_content:
                    sections[current_section].append('\n'.join(current_content))
                current_section = 'client_manager'
                current_content = [line]
                
            elif any(keyword in line_lower for keyword in ['po', 'purchase order', 'work order', 'job']):
                if current_section and current_content:
                    sections[current_section].append('\n'.join(current_content))
                current_section = 'client_po'
                current_content = [line]
                
            elif any(keyword in line_lower for keyword in ['payment', 'billing', 'invoice', 'payroll']):
                if current_section and current_content:
                    sections[current_section].append('\n'.join(current_content))
                current_section = 'pay'
                current_content = [line]
                
            elif any(keyword in line_lower for keyword in ['training', 'education', 'learning', 'course']):
                if current_section and current_content:
                    sections[current_section].append('\n'.join(current_content))
                current_section = 'education'
                current_content = [line]
                
            elif any(keyword in line_lower for keyword in ['certification', 'credential', 'qualification']):
                if current_section and current_content:
                    sections[current_section].append('\n'.join(current_content))
                current_section = 'certification'
                current_content = [line]
                
            elif any(keyword in line_lower for keyword in ['hr', 'employee', 'personnel', 'staff', 'hiring']):
                if current_section and current_content:
                    sections[current_section].append('\n'.join(current_content))
                current_section = 'peopleops'
                current_content = [line]
                
            elif any(keyword in line_lower for keyword in ['project', 'milestone', 'task', 'deliverable']):
                if current_section and current_content:
                    sections[current_section].append('\n'.join(current_content))
                current_section = 'project'
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
        
        # Default suggestions
        if sections['client_manager']:
            suggestions['client_manager'] = 'Client-Intake'
        if sections['client_po']:
            suggestions['client_po'] = 'Work-Order'
        if sections['pay']:
            suggestions['pay'] = 'Payment-Process'
        if sections['education']:
            suggestions['education'] = 'Training-Module'
        if sections['certification']:
            suggestions['certification'] = 'Cert-Requirements'
        if sections['peopleops']:
            suggestions['peopleops'] = 'HR-Process'
        if sections['project']:
            suggestions['project'] = 'Project-Workflow'
        
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
            domain: Business domain
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
        
        # Common header
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
        if contract_type == 'client_manager':
            yaml_lines.extend(self._generate_client_manager_yaml(content))
        elif contract_type == 'pay':
            yaml_lines.extend(self._generate_pay_yaml(content))
        elif contract_type == 'education':
            yaml_lines.extend(self._generate_education_yaml(content))
        elif contract_type == 'certification':
            yaml_lines.extend(self._generate_certification_yaml(content))
        elif contract_type == 'peopleops':
            yaml_lines.extend(self._generate_peopleops_yaml(content))
        elif contract_type == 'project':
            yaml_lines.extend(self._generate_project_yaml(content))
        
        return '\n'.join(yaml_lines)
    
    def _generate_client_manager_yaml(self, content: List[str]) -> List[str]:
        """Generate SmartClientManager contract YAML"""
        return [
            'title: "Client Management Process"',
            'description: "Client onboarding and relationship management"',
            '',
            'process_steps:',
            '  - step: "Client intake"',
            '  - step: "Account setup"',
            '  - step: "Communication protocol"'
        ]
    
    def _generate_pay_yaml(self, content: List[str]) -> List[str]:
        """Generate SmartPay contract YAML"""
        return [
            'title: "Payment Process"',
            'description: "Payment and billing logic"',
            '',
            'payment_rules:',
            '  - rule: "Invoice generation"',
            '  - rule: "Payment terms"'
        ]
    
    def _generate_education_yaml(self, content: List[str]) -> List[str]:
        """Generate SmartEducation contract YAML"""
        return [
            'title: "Training Module"',
            'description: "Education and training requirements"',
            '',
            'training_modules:',
            '  - module: "Module name"',
            '    duration: "Duration"',
            '    certification: true'
        ]
    
    def _generate_certification_yaml(self, content: List[str]) -> List[str]:
        """Generate SmartCertifiedPeople contract YAML"""
        return [
            'title: "Certification Requirements"',
            'description: "Required certifications and qualifications"',
            '',
            'certifications:',
            '  - name: "Certification name"',
            '    required_for: "Role or task"',
            '    renewal_period: "Annual"'
        ]
    
    def _generate_peopleops_yaml(self, content: List[str]) -> List[str]:
        """Generate SmartPeopleOps contract YAML"""
        return [
            'title: "HR Process"',
            'description: "Human resources operations"',
            '',
            'hr_steps:',
            '  - step: "Process step"',
            '    responsibility: "Role"'
        ]
    
    def _generate_project_yaml(self, content: List[str]) -> List[str]:
        """Generate SmartProjects contract YAML"""
        return [
            'title: "Project Workflow"',
            'description: "Project management and milestones"',
            '',
            'project_phases:',
            '  - phase: "Initiation"',
            '  - phase: "Execution"',
            '  - phase: "Completion"'
        ]


# Standalone test
if __name__ == "__main__":
    print("🧪 Testing Business Contract Engine...")
    
    converter = BusinessConverter()
    
    # Test with sample content
    sample_sop = """
    Client Onboarding Process
    1. Receive client inquiry
    2. Schedule initial meeting
    3. Create account
    
    Payment Terms
    - Net 30 payment terms
    - Invoice upon completion
    
    Training Requirements
    - Complete onboarding training
    - Pass assessment
    """
    
    result = converter.parse_sop(
        file_content=sample_sop.encode('utf-8'),
        filename='test.txt',
        domain='CLIENT'
    )
    
    print(f"Extracted sections: {result['section_count']}")
    
    contracts = converter.generate_contracts(
        sections=result['sections'],
        domain='CLIENT',
        user_names=result['suggested_names']
    )
    
    print(f"Generated {len(contracts)} contracts")
    for contract in contracts:
        print(f"  - {contract['id']} ({contract['contract_class']})")
    
    print("✅ Business Engine test complete")
