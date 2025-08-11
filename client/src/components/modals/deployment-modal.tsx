import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { X, Rocket } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface DeploymentModalProps {
  moduleId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeploymentModal({ moduleId, isOpen, onClose }: DeploymentModalProps) {
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [configuration, setConfiguration] = useState(`{
  "memory_limit": "2GB",
  "cpu_limit": "1.5",
  "auto_restart": true
}`);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: modules } = useQuery({
    queryKey: ["/api/modules/available"],
    queryFn: apiClient.getModules,
  });

  const { data: nodes } = useQuery({
    queryKey: ["/api/nodes"],
    queryFn: apiClient.getNodes,
  });

  const deployMutation = useMutation({
    mutationFn: apiClient.deploy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
      toast({
        title: "Deployment Started",
        description: "Module deployment has been initiated successfully.",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to start deployment.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedNodeIds([]);
    setSelectedModuleId("");
    setConfiguration(`{
  "memory_limit": "2GB",
  "cpu_limit": "1.5",
  "auto_restart": true
}`);
  };

  const handleNodeToggle = (nodeId: string, checked: boolean) => {
    if (checked) {
      setSelectedNodeIds([...selectedNodeIds, nodeId]);
    } else {
      setSelectedNodeIds(selectedNodeIds.filter(id => id !== nodeId));
    }
  };

  const handleDeploy = () => {
    const targetModuleId = moduleId || selectedModuleId;
    if (!targetModuleId || selectedNodeIds.length === 0) {
      toast({
        title: "Invalid Selection",
        description: "Please select a module and at least one node.",
        variant: "destructive",
      });
      return;
    }

    let config;
    try {
      config = configuration ? JSON.parse(configuration) : {};
    } catch (error) {
      toast({
        title: "Invalid Configuration",
        description: "Configuration must be valid JSON.",
        variant: "destructive",
      });
      return;
    }

    deployMutation.mutate({
      moduleId: targetModuleId,
      nodeIds: selectedNodeIds,
      configuration: config,
    });
  };

  const handleClose = () => {
    if (!deployMutation.isPending) {
      onClose();
      resetForm();
    }
  };

  const readyModules = modules?.filter(m => m.status === "loaded") || [];
  const onlineNodes = nodes?.filter(n => n.status === "online") || [];
  const currentModule = moduleId ? modules?.find(m => m.id === moduleId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Deploy Module
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={deployMutation.isPending}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!moduleId && (
            <div>
              <Label className="text-sm font-medium text-slate-700">Select Module</Label>
              <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Choose a module to deploy" />
                </SelectTrigger>
                <SelectContent>
                  {readyModules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.name} {module.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {currentModule && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-slate-900">{currentModule.name}</h4>
              <p className="text-sm text-slate-600 mt-1">{currentModule.description}</p>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium text-slate-700">Target Nodes</Label>
            <div className="space-y-3 mt-2">
              {onlineNodes.map((node) => (
                <div key={node.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={node.id}
                    checked={selectedNodeIds.includes(node.id)}
                    onCheckedChange={(checked) => handleNodeToggle(node.id, checked as boolean)}
                  />
                  <Label
                    htmlFor={node.id}
                    className="text-sm text-slate-700 flex-1 cursor-pointer"
                  >
                    {node.name} ({node.ipAddress})
                  </Label>
                </div>
              ))}
              
              {nodes?.filter(n => n.status !== "online").map((node) => (
                <div key={node.id} className="flex items-center space-x-3 opacity-50">
                  <Checkbox id={node.id} disabled />
                  <Label htmlFor={node.id} className="text-sm text-slate-400">
                    {node.name} ({node.ipAddress}) - Offline
                  </Label>
                </div>
              ))}

              {onlineNodes.length === 0 && (
                <p className="text-sm text-slate-500">No online nodes available</p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700">Configuration</Label>
            <Textarea
              className="mt-2 font-mono text-sm"
              rows={6}
              value={configuration}
              onChange={(e) => setConfiguration(e.target.value)}
              placeholder="Enter JSON configuration or leave empty for defaults"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 mt-8">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={deployMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeploy}
            disabled={deployMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <Rocket className="w-4 h-4 mr-2" />
            {deployMutation.isPending ? "Deploying..." : "Deploy Module"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
