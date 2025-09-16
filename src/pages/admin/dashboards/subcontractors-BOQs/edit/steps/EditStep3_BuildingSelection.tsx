import React, { useState } from "react";
import { useEditWizardContext } from "../context/EditWizardContext";
import BuildingChangeWarningDialog from "../../shared/components/BuildingChangeWarningDialog";

export const EditStep3_BuildingSelection: React.FC = () => {
    const { formData, setFormData, projects, buildings, originalContractData } = useEditWizardContext();
    const [showBuildingChangeWarning, setShowBuildingChangeWarning] = useState(false);
    const [pendingBuildingChange, setPendingBuildingChange] = useState<{
        buildingId: number;
        checked: boolean;
        buildingName: string;
        changeType: 'add' | 'remove';
    } | null>(null);
    
    const selectedProject = projects.find(p => p.id === formData.projectId);

    // Check if we have existing trade or BOQ data that could be affected
    const hasExistingTradeData = () => {
        return formData.boqData && formData.boqData.length > 0 && 
               formData.boqData.some(boq => boq.sheetName && boq.sheetName.trim() !== '');
    };

    const hasExistingBOQData = () => {
        return formData.boqData && formData.boqData.length > 0 && 
               formData.boqData.some(boq => boq.items && boq.items.length > 0);
    };

    const handleBuildingToggle = (buildingId: number, checked: boolean) => {
        const building = buildings.find(b => b.id === buildingId);
        const buildingName = building?.name || building?.buildingName || `Building ${buildingId}`;
        
        // Check if this is an existing contract with trade/BOQ data
        const shouldShowWarning = originalContractData && 
                                 (hasExistingTradeData() || hasExistingBOQData());
        
        if (shouldShowWarning) {
            // Show warning dialog
            setPendingBuildingChange({
                buildingId,
                checked,
                buildingName,
                changeType: checked ? 'add' : 'remove'
            });
            setShowBuildingChangeWarning(true);
            return;
        }
        
        // Safe building change - no existing data to worry about
        applyBuildingChange(buildingId, checked);
    };

    const applyBuildingChange = (buildingId: number, checked: boolean) => {
        if (checked) {
            setFormData({
                buildingIds: [...formData.buildingIds, buildingId]
            });
        } else {
            setFormData({
                buildingIds: formData.buildingIds.filter(id => id !== buildingId)
            });
        }
    };

    const handleConfirmBuildingChange = () => {
        if (pendingBuildingChange) {
            applyBuildingChange(pendingBuildingChange.buildingId, pendingBuildingChange.checked);
        }
        setShowBuildingChangeWarning(false);
        setPendingBuildingChange(null);
    };

    const handleCancelBuildingChange = () => {
        setShowBuildingChangeWarning(false);
        setPendingBuildingChange(null);
    };

    if (!selectedProject) {
        return (
            <div className="text-center py-8">
                <p className="text-base-content/60">Please select a project first</p>
            </div>
        );
    }

    return (
        <div>
            <div className="bg-base-100 border border-base-300 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="iconify lucide--folder-open size-5 text-primary"></span>
                    <h3 className="font-semibold text-base-content">Project: {selectedProject.name}</h3>
                </div>
            </div>

            {buildings.length > 0 ? (
                <div className="form-control">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {buildings.map(building => (
                            <div key={building.id} className="relative">
                                <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                    formData.buildingIds.some(id => id == building.id)
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-base-300 bg-base-100 hover:border-base-400'
                                }`}>
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary"
                                        checked={formData.buildingIds.some(id => id == building.id)}
                                        onChange={(e) => handleBuildingToggle(building.id, e.target.checked)}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="iconify lucide--building size-5 text-base-content/60"></span>
                                            <span className="font-medium text-base-content">{building.name || building.buildingName}</span>
                                        </div>
                                    </div>
                                    {formData.buildingIds.some(id => id == building.id) && (
                                        <span className="iconify lucide--check-circle size-5 text-primary"></span>
                                    )}
                                </label>
                            </div>
                        ))}
                    </div>
                    
                </div>
            ) : (
                <div className="text-center py-8">
                    <span className="iconify lucide--building size-12 text-base-content/40 mx-auto mb-2"></span>
                    <p className="text-base-content/60">No buildings found for this project</p>
                </div>
            )}

            {/* Building Change Warning Dialog */}
            <BuildingChangeWarningDialog
                isOpen={showBuildingChangeWarning}
                changeType={pendingBuildingChange?.changeType || 'modify'}
                buildingName={pendingBuildingChange?.buildingName || ''}
                onConfirm={handleConfirmBuildingChange}
                onCancel={handleCancelBuildingChange}
                hasExistingTradeData={hasExistingTradeData()}
                hasExistingBOQData={hasExistingBOQData()}
            />
        </div>
    );
};