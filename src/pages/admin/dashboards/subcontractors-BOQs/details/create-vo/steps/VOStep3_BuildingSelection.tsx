import React from 'react';
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';

export const VOStep3_BuildingSelection: React.FC = () => {
    const { contractData, formData, setFormData, contractLoading } = useContractVOWizardContext();

    const handleBuildingToggle = (buildingId: number) => {
        const currentSelected = formData.selectedBuildingIds;
        const isSelected = currentSelected.includes(buildingId);
        
        if (isSelected) {
            // Remove from selection
            setFormData({
                selectedBuildingIds: currentSelected.filter(id => id !== buildingId)
            });
        } else {
            // Add to selection
            setFormData({
                selectedBuildingIds: [...currentSelected, buildingId]
            });
        }
    };

    const handleSelectAll = () => {
        if (!contractData) return;
        setFormData({
            selectedBuildingIds: contractData.buildings.map(b => b.id)
        });
    };

    const handleSelectNone = () => {
        setFormData({
            selectedBuildingIds: []
        });
    };

    if (contractLoading || !contractData) {
        return (
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                    <div className="text-center p-8">
                        <span className="iconify lucide--loader-2 size-8 animate-spin text-base-content/60 mb-2"></span>
                        <p className="text-base-content/70">Loading contract buildings...</p>
                        <p className="text-xs text-base-content/50 mt-1">Please wait while we fetch building information</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
                {/* Header with Contract Context */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="iconify lucide--building size-5 text-blue-600"></span>
                    <div>
                        <h3 className="font-semibold text-base-content">Select Buildings for VO</h3>
                        <p className="text-sm text-base-content/70">
                            Contract: <span className="font-medium">{contractData.contractNumber}</span> • 
                            Available Buildings: <span className="font-medium">{contractData.buildings.length}</span>
                        </p>
                    </div>
                </div>

                {/* Quick Actions Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-base-content/70">
                        {formData.selectedBuildingIds.length} of {contractData.buildings.length} buildings selected
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleSelectAll}
                            className="btn btn-xs bg-base-200 text-base-content hover:bg-base-300"
                            disabled={formData.selectedBuildingIds.length === contractData.buildings.length}
                        >
                            <span className="iconify lucide--check-square size-3"></span>
                            All
                        </button>
                        <button
                            onClick={handleSelectNone}
                            className="btn btn-xs bg-base-200 text-base-content hover:bg-base-300"
                            disabled={formData.selectedBuildingIds.length === 0}
                        >
                            <span className="iconify lucide--square size-3"></span>
                            None
                        </button>
                    </div>
                </div>

                {/* Buildings Grid */}
                {contractData.buildings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contractData.buildings.map((building) => {
                            const isSelected = formData.selectedBuildingIds.includes(building.id);
                            
                            return (
                                <div 
                                    key={building.id}
                                    className={`cursor-pointer transition-all duration-200 rounded-lg border-2 p-4 ${
                                        isSelected 
                                            ? 'border-primary bg-primary/5 shadow-md' 
                                            : 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-200'
                                    }`}
                                    onClick={() => handleBuildingToggle(building.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Checkbox */}
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                            isSelected 
                                                ? 'border-primary bg-primary' 
                                                : 'border-base-300'
                                        }`}>
                                            {isSelected && (
                                                <span className="iconify lucide--check text-primary-content size-3"></span>
                                            )}
                                        </div>
                                        
                                        {/* Building Icon */}
                                        <div className={`p-2 rounded ${
                                            isSelected 
                                                ? 'bg-primary/20' 
                                                : 'bg-blue-100 dark:bg-blue-900/30'
                                        }`}>
                                            <span className={`iconify lucide--building size-5 ${
                                                isSelected 
                                                    ? 'text-primary' 
                                                    : 'text-blue-600 dark:text-blue-400'
                                            }`}></span>
                                        </div>
                                        
                                        {/* Building Info */}
                                        <div className="flex-1">
                                            <p className={`font-medium ${
                                                isSelected ? 'text-primary' : 'text-base-content'
                                            }`}>
                                                {building.name}
                                            </p>
                                            <p className="text-xs text-base-content/60">
                                                ID: #{building.id}
                                            </p>
                                        </div>
                                        
                                        {/* Selected Badge */}
                                        {isSelected && (
                                            <div className="badge badge-primary badge-sm">
                                                Selected
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <span className="iconify lucide--building-2 size-16 text-base-content/20 mb-4"></span>
                        <p className="text-base-content/70 text-lg mb-2">No Buildings Available</p>
                        <p className="text-base-content/50 text-sm">This contract doesn't have any buildings assigned.</p>
                    </div>
                )}

                {/* Selection Summary */}
                {formData.selectedBuildingIds.length > 0 && (
                    <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-3">
                            <span className="iconify lucide--check-circle text-primary size-5"></span>
                            <div>
                                <p className="font-medium text-primary">
                                    {formData.selectedBuildingIds.length} Building{formData.selectedBuildingIds.length !== 1 ? 's' : ''} Selected
                                </p>
                                <p className="text-sm text-base-content/70">
                                    Selected buildings: {contractData.buildings
                                        .filter(b => formData.selectedBuildingIds.includes(b.id))
                                        .map(b => b.name)
                                        .join(', ')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Tip */}
                {formData.selectedBuildingIds.length === 0 && (
                    <div className="bg-info/10 text-info rounded-lg p-3 mt-4 text-sm">
                        <span className="iconify lucide--info size-4 mr-2"></span>
                        Select at least one building to continue to the next step.
                    </div>
                )}
            </div>
        </div>
    );
};