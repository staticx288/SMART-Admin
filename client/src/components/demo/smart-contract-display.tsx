import { type Scenario } from "../../../../shared/demo-schema";
import { getSmartContract, getComplianceDisplayName } from "../../../../shared/smart-contracts";
import { FileText, Shield, Scale, Wrench, Award, ExternalLink } from "lucide-react";

interface SmartContractDisplayProps {
  scenario: Scenario;
  "data-testid"?: string;
}

export function SmartContractDisplay({ scenario, "data-testid": dataTestId }: SmartContractDisplayProps) {
  const contract = getSmartContract(scenario.contractId);

  if (!contract) {
    return (
      <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-lg" data-testid={dataTestId}>
        <div className="text-sm text-gray-400">No SmartContract data available</div>
      </div>
    );
  }

  const test = contract.tests[0]; // Using first test for demo
  const priorityColor = contract.priority === "Critical" ? "bg-red-900/50 text-red-400 border border-red-600" : 
                       contract.priority === "High" ? "bg-orange-900/50 text-orange-400 border border-orange-600" : 
                       "bg-gray-900/50 text-gray-400 border border-gray-600";

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-700 rounded-lg" data-testid={dataTestId}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold text-white">{contract.id}</h3>
              <button
                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                title="View Raw YAML"
              >
                <FileText className="w-3 h-3" />
                View YAML
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="text-sm text-gray-400">
              {contract.client} • {contract.part_description}
            </div>
          </div>
          <span className={`shrink-0 px-2 py-1 rounded-md text-xs font-medium ${priorityColor}`}>
            {contract.priority}
          </span>
        </div>

        {/* Test Type & Part */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Test Type:</span>
            <div className="font-mono text-white">{contract.test_type}</div>
          </div>
          <div>
            <span className="text-gray-400">Part Number:</span>
            <div className="font-mono text-white">{contract.part_number}</div>
          </div>
        </div>

        {/* SmartContract Components */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4" />
            SmartContract Components
          </h4>
          
          {/* Special Process */}
          <div className="p-3 rounded-lg bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-white">Special Process (SP)</span>
            </div>
            <div className="text-xs font-mono text-white">{test.sp}</div>
            <div className="text-xs text-gray-400 mt-1">{test.sp_description}</div>
          </div>

          {/* Standard */}
          <div className="p-3 rounded-lg bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-white">Standard</span>
            </div>
            <div className="text-xs font-mono text-white">{test.standard}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {test.standard_conditions.map((condition, index) => (
                <span key={index} className="text-xs bg-zinc-700 text-gray-300 border border-zinc-600 px-2 py-1 rounded-md">
                  {condition}
                </span>
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div className="p-3 rounded-lg bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-white">Compliance</span>
            </div>
            <div className="text-xs font-mono text-white">
              {getComplianceDisplayName(test.compliance)}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {test.compliance_conditions.map((condition, index) => (
                <span key={index} className="text-xs bg-zinc-700 text-gray-300 border border-zinc-600 px-2 py-1 rounded-md">
                  {condition}
                </span>
              ))}
            </div>
          </div>

          {/* Required Certifications */}
          <div className="p-3 rounded-lg bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-white">Required Certifications</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {test.required_certs.map((cert, index) => (
                <span key={index} className="text-xs bg-blue-900/50 text-blue-300 border border-blue-600 px-2 py-1 rounded-md">
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* Maintenance */}
          <div className="p-3 rounded-lg bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-white">Maintenance</span>
            </div>
            <div className="text-xs font-mono text-white">{test.maintenance}</div>
            {test.maintenance_conditions && (
              <div className="flex flex-wrap gap-1 mt-2">
                {test.maintenance_conditions.map((condition, index) => (
                  <span key={index} className="text-xs bg-zinc-700 text-gray-300 border border-zinc-600 px-2 py-1 rounded-md">
                    {condition}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}