import React, { useState, useEffect } from 'react';
import { VOType, VOTypeSelectionData } from '@/types/variation-order';

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface ContractDataset {
  id: number;
  contractNumber: string;
  subcontractorName: string;
  subcontractorId: number;
  projectName: string;
  tradeName?: string;
  status: string;
}

interface VOTypeSelectionStepProps {
  data: VOTypeSelectionData;
  onDataChange: (data: VOTypeSelectionData) => void;
  onValidityChange: (isValid: boolean) => void;
}

const VOTypeSelectionStep: React.FC<VOTypeSelectionStepProps> = ({
  data,
  onDataChange,
  onValidityChange
}) => {
  const [formData, setFormData] = useState<VOTypeSelectionData>(data);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [availableContracts, setAvailableContracts] = useState<ContractDataset[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(false);

  // Load projects when Budget BOQ is selected
  useEffect(() => {
    if (formData.voType === VOType.BudgetBOQ) {
      loadProjects();
    }
  }, [formData.voType]);

  // Load contract datasets when Contract Dataset is selected
  useEffect(() => {
    if (formData.voType === VOType.ContractDataset) {
      loadContractDatasets();
    }
  }, [formData.voType]);

  // Validate form data
  useEffect(() => {
    const isValid = formData.voType && 
      ((formData.voType === VOType.BudgetBOQ && formData.selectedFor?.projectId) ||
       (formData.voType === VOType.ContractDataset && formData.selectedFor?.contractDatasetId));

    onValidityChange(!!isValid);
  }, [formData, onValidityChange]);

  // Sync data changes
  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      // TODO: Replace with actual API call
      // const projects = await getProjects();
      const mockProjects: Project[] = [
        { id: 1, name: 'Construction Project Alpha', description: 'Main construction project' },
        { id: 2, name: 'Renovation Project Beta', description: 'Building renovation project' }
      ];
      setAvailableProjects(mockProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadContractDatasets = async () => {
    setLoadingContracts(true);
    try {
      // TODO: Replace with actual API call
      // const contracts = await getContractDatasets('Editable');
      const mockContracts: ContractDataset[] = [
        {
          id: 1,
          contractNumber: 'CT-2024-001',
          subcontractorName: 'ABC Construction',
          subcontractorId: 10,
          projectName: 'Construction Project Alpha',
          tradeName: 'Electrical Work',
          status: 'Editable'
        },
        {
          id: 2,
          contractNumber: 'CT-2024-002',
          subcontractorName: 'XYZ Plumbing',
          subcontractorId: 11,
          projectName: 'Renovation Project Beta',
          tradeName: 'Plumbing Work',
          status: 'Editable'
        }
      ];
      setAvailableContracts(mockContracts);
    } catch (error) {
      console.error('Failed to load contract datasets:', error);
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleVOTypeChange = (voType: VOType) => {
    setFormData({
      voType,
      selectedFor: undefined // Reset selection when changing type
    });
  };

  const handleProjectSelection = (projectId: number) => {
    const project = availableProjects.find(p => p.id === projectId);
    setFormData(prev => ({
      ...prev,
      selectedFor: {
        projectId,
        projectName: project?.name || ''
      }
    }));
  };

  const handleContractSelection = (contractDatasetId: number) => {
    const contract = availableContracts.find(c => c.id === contractDatasetId);
    setFormData(prev => ({
      ...prev,
      selectedFor: {
        contractDatasetId,
        contractNumber: contract?.contractNumber || '',
        subcontractorId: contract?.subcontractorId || 0,
        subcontractorName: contract?.subcontractorName || ''
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
          <span className="iconify lucide--split text-blue-600 dark:text-blue-400 size-5"></span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-base-content">Select VO Type</h2>
          <p className="text-sm text-base-content/70">Choose what type of Variation Order you want to create</p>
        </div>
      </div>

      {/* VO Type Selection */}
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h3 className="card-title text-base">VO Type Selection</h3>
          
          <div className="space-y-4">
            {/* Budget BOQ VO Option */}
            <label className="flex items-start gap-3 p-4 border border-base-300 rounded-lg hover:border-blue-400 cursor-pointer transition-colors">
              <input
                type="radio"
                name="voType"
                value={VOType.BudgetBOQ}
                checked={formData.voType === VOType.BudgetBOQ}
                onChange={() => handleVOTypeChange(VOType.BudgetBOQ)}
                className="radio radio-primary mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="iconify lucide--folder-tree text-blue-600 size-4"></span>
                  <span className="font-medium">Budget BOQ VO</span>
                </div>
                <p className="text-sm text-base-content/70 mt-1">
                  Create variations for project-level budget BOQs. These VOs modify the overall project budget 
                  and affect all subcontractors working on the project.
                </p>
                <div className="text-xs text-blue-600 mt-2">
                  Uses: api/Vo/* endpoints
                </div>
              </div>
            </label>

            {/* Contract Dataset VO Option */}
            <label className="flex items-start gap-3 p-4 border border-base-300 rounded-lg hover:border-purple-400 cursor-pointer transition-colors">
              <input
                type="radio"
                name="voType"
                value={VOType.ContractDataset}
                checked={formData.voType === VOType.ContractDataset}
                onChange={() => handleVOTypeChange(VOType.ContractDataset)}
                className="radio radio-primary mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="iconify lucide--file-contract text-purple-600 size-4"></span>
                  <span className="font-medium">Contract Dataset VO</span>
                </div>
                <p className="text-sm text-base-content/70 mt-1">
                  Create variations for specific subcontractor contracts. These VOs are linked to individual 
                  contract datasets and affect only the selected subcontractor's scope of work.
                </p>
                <div className="text-xs text-purple-600 mt-2">
                  Uses: api/VoDataSet/* endpoints
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Project Selection for Budget BOQ VO */}
      {formData.voType === VOType.BudgetBOQ && (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h3 className="card-title text-base">Select Project</h3>
            
            {loadingProjects ? (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-md"></span>
                <span className="ml-2">Loading projects...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {availableProjects.map((project) => (
                  <label 
                    key={project.id}
                    className="flex items-start gap-3 p-3 border border-base-300 rounded-lg hover:border-blue-400 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="projectSelection"
                      value={project.id}
                      checked={formData.selectedFor?.projectId === project.id}
                      onChange={() => handleProjectSelection(project.id)}
                      className="radio radio-primary mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-base-content">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-base-content/70">{project.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contract Selection for Contract Dataset VO */}
      {formData.voType === VOType.ContractDataset && (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h3 className="card-title text-base">Select Contract Dataset</h3>
            
            {loadingContracts ? (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-md"></span>
                <span className="ml-2">Loading contract datasets...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {availableContracts.map((contract) => (
                  <label 
                    key={contract.id}
                    className="flex items-start gap-3 p-3 border border-base-300 rounded-lg hover:border-purple-400 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="contractSelection"
                      value={contract.id}
                      checked={formData.selectedFor?.contractDatasetId === contract.id}
                      onChange={() => handleContractSelection(contract.id)}
                      className="radio radio-primary mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-base-content">{contract.contractNumber}</span>
                        <span className="badge badge-outline">{contract.status}</span>
                      </div>
                      <div className="text-sm text-base-content/70">
                        <div>{contract.subcontractorName}</div>
                        <div>{contract.projectName} • {contract.tradeName}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VOTypeSelectionStep;