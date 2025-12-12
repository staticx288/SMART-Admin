import { useState } from "react";
import { Upload, FileText, Download, Eye, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface ParsedSection {
  number: number;
  title: string;
  content: string;
}

interface SectionSelection extends ParsedSection {
  selected: boolean;
  contract_type: string;
  contract_id: string;
}

interface GeneratedContract {
  id: string;
  type: string;
  filename: string;
  yaml_content: string;
  domain: string;
}

interface ParseResultV2 {
  domain: string;
  filename: string;
  sections: ParsedSection[];
  total_sections: number;
}

export default function SandboxTesting() {
  const { toast } = useToast();
  const [converterType, setConverterType] = useState<'production' | 'business'>('production');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResultV2 | null>(null);
  const [sectionSelections, setSectionSelections] = useState<SectionSelection[]>([]);
  const [generatedContracts, setGeneratedContracts] = useState<GeneratedContract[]>([]);
  const [viewingContract, setViewingContract] = useState<GeneratedContract | null>(null);

  // Domain options
  const productionDomains = ['LP', 'MPI', 'UT', 'RT', 'VT', 'WELD', 'MACHINE', 'HEAT', 'CP', 'PAINT', 'POLISH', 'ASSEMBLE', 'INSPECT'];
  const businessDomains = ['CLIENT', 'PAY', 'TRAIN', 'CERT', 'HR', 'PROJECT', 'AUDIT', 'ADMIN'];
  
  // Contract types
  const contractTypes = [
    'SmartSafety',
    'SmartMaintenance',
    'SmartInventory',
    'SmartCompliance',
    'SmartSP',
    'SmartQA',
    'SmartStandards'
  ];

  const domains = converterType === 'production' ? productionDomains : businessDomains;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setParseResult(null);
      setGeneratedContracts([]);
      toast({
        title: "File Selected",
        description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
      });
    }
  };

  const handleParseSOP = async () => {
    if (!selectedFile || !selectedDomain) {
      toast({
        title: "Missing Information",
        description: "Please select a file and domain",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setParseResult(null);
    setGeneratedContracts([]);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('domain', selectedDomain);
      formData.append('converter_type', converterType);

      const response = await fetch('/api/sandbox/parse-sop', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      console.log('Response status:', response.status);
      console.log('Content-Type:', contentType);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to parse SOP: ${response.status} ${response.statusText}`);
      }

      // Check if response is actually JSON
      if (!contentType || !contentType.includes('application/json')) {
        const htmlText = await response.text();
        console.error('Received HTML instead of JSON:', htmlText.substring(0, 500));
        throw new Error('Server returned HTML instead of JSON. Check server logs for errors.');
      }

      const result = await response.json();
      setParseResult(result);
      
      // Initialize section selections with smart defaults
      const selections: SectionSelection[] = result.sections.map((section: ParsedSection) => {
        const titleLower = section.title.toLowerCase();
        let suggestedType = 'SmartCompliance'; // default
        let suggestedId = `${selectedDomain}-SEC-${section.number.toString().padStart(3, '0')}`;
        
        // Smart type detection based on section title
        if (titleLower.includes('safety') || titleLower.includes('ppe') || titleLower.includes('hazard')) {
          suggestedType = 'SmartSafety';
          suggestedId = `${selectedDomain}-SAFE-${section.number.toString().padStart(3, '0')}`;
        } else if (titleLower.includes('equipment') || titleLower.includes('calibration') || titleLower.includes('maintenance')) {
          suggestedType = 'SmartMaintenance';
          suggestedId = `MAIN-${selectedDomain}-${section.number.toString().padStart(3, '0')}`;
        } else if (titleLower.includes('material') || titleLower.includes('inventory') || titleLower.includes('chemical')) {
          suggestedType = 'SmartInventory';
          suggestedId = `INV-${selectedDomain}-${section.number.toString().padStart(3, '0')}`;
        } else if (titleLower.includes('process') || titleLower.includes('procedure') || titleLower.includes('step')) {
          suggestedType = 'SmartSP';
          suggestedId = `SP-${selectedDomain}-${section.number.toString().padStart(3, '0')}`;
        } else if (titleLower.includes('qa') || titleLower.includes('quality') || titleLower.includes('inspection') || titleLower.includes('final')) {
          suggestedType = 'SmartQA';
          suggestedId = `QA-${selectedDomain}-${section.number.toString().padStart(3, '0')}`;
        } else if (titleLower.includes('standard') || titleLower.includes('reference')) {
          suggestedType = 'SmartStandards';
          suggestedId = `STD-${selectedDomain}-${section.number.toString().padStart(3, '0')}`;
        }
        
        return {
          ...section,
          selected: false,
          contract_type: suggestedType,
          contract_id: suggestedId
        };
      });
      
      setSectionSelections(selections);

      toast({
        title: "SOP Parsed Successfully",
        description: `Found ${result.total_sections} sections - select which to convert`,
      });
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: "Parse Failed",
        description: error instanceof Error ? error.message : "Failed to parse SOP",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateContracts = async () => {
    const selected = sectionSelections.filter(s => s.selected);
    
    if (selected.length === 0) {
      toast({
        title: "No Sections Selected",
        description: "Please select at least one section to convert",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/sandbox/generate-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: selected,
          domain: selectedDomain,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate contracts');
      }

      const result = await response.json();
      setGeneratedContracts(result.contracts);

      toast({
        title: "Contracts Generated",
        description: `Generated ${result.contracts.length} contracts`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate contracts",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const toggleSection = (index: number) => {
    setSectionSelections(prev => prev.map((s, i) => 
      i === index ? { ...s, selected: !s.selected } : s
    ));
  };
  
  const updateSectionType = (index: number, type: string) => {
    setSectionSelections(prev => prev.map((s, i) => 
      i === index ? { ...s, contract_type: type } : s
    ));
  };
  
  const updateSectionId = (index: number, id: string) => {
    setSectionSelections(prev => prev.map((s, i) => 
      i === index ? { ...s, contract_id: id } : s
    ));
  };

  const handleDownloadContract = (contract: GeneratedContract) => {
    const blob = new Blob([contract.yaml_content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = contract.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSelectedDomain('');
    setParseResult(null);
    setSectionSelections([]);
    setGeneratedContracts([]);
    setViewingContract(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">🧪 Sandbox Testing</h2>
        <p className="text-muted-foreground">
          Test SmartContract Engine modules without deploying anything
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SOP Converter Testing</CardTitle>
          <CardDescription>
            Upload SOPs and test the Production or Business converter modules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Converter Type Selection */}
          <div className="space-y-2">
            <Label>Converter Type</Label>
            <Tabs value={converterType} onValueChange={(v) => setConverterType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="production">🏭 Production Floor</TabsTrigger>
                <TabsTrigger value="business">💼 Business Operations</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-sm text-muted-foreground">
              {converterType === 'production' 
                ? 'Testing, manufacturing, chemical processing SOPs'
                : 'Client management, HR, training, finance SOPs'
              }
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload SOP Document</Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".docx,.pdf,.md,.txt"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {selectedFile && (
                <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Domain Selection */}
          <div className="space-y-2">
            <Label>Select Domain</Label>
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a domain..." />
              </SelectTrigger>
              <SelectContent>
                {domains.map(domain => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleParseSOP} 
              disabled={!selectedFile || !selectedDomain || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Parse SOP
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parse Results - Section Selection */}
      {parseResult && sectionSelections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Sections to Convert</CardTitle>
            <CardDescription>
              Found {parseResult.total_sections} sections from {parseResult.filename} - choose which to convert to SmartContracts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {sectionSelections.map((section, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={section.selected}
                      onCheckedChange={() => toggleSection(index)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="font-medium">
                          Section {section.number}: {section.title}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {section.content.substring(0, 150)}...
                        </div>
                      </div>
                      
                      {section.selected && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Contract Type</Label>
                            <Select 
                              value={section.contract_type} 
                              onValueChange={(val) => updateSectionType(index, val)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {contractTypes.map(type => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs">Contract ID</Label>
                            <Input
                              value={section.contract_id}
                              onChange={(e) => updateSectionId(index, e.target.value)}
                              placeholder="CONTRACT-ID-001"
                              className="h-8"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleGenerateContracts} 
              disabled={isProcessing || sectionSelections.filter(s => s.selected).length === 0} 
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Contracts...
                </>
              ) : (
                <>
                  Generate {sectionSelections.filter(s => s.selected).length} Selected Contracts
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated Contracts */}
      {generatedContracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Contracts</CardTitle>
            <CardDescription>
              {generatedContracts.length} contracts ready for review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {generatedContracts.map(contract => (
                <div key={contract.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex-1">
                    <div className="font-medium">{contract.filename}</div>
                    <div className="text-sm text-muted-foreground">
                      {contract.type} • {contract.domain} domain
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setViewingContract(contract)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadContract(contract)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Viewer Modal */}
      {viewingContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>{viewingContract.filename}</CardTitle>
              <CardDescription>{viewingContract.type}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <Textarea
                value={viewingContract.yaml_content}
                readOnly
                className="font-mono text-sm min-h-[500px]"
              />
            </CardContent>
            <div className="p-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setViewingContract(null)}>
                Close
              </Button>
              <Button onClick={() => handleDownloadContract(viewingContract)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
