import { useState, useEffect } from "react";
import { Button } from "@/components/daisyui";
import { WizardStepProps, BuildingSelectionStepData } from "../types";

const BuildingSelectionStep: React.FC<WizardStepProps> = ({
    data,
    onDataChange,
    onValidationChange,
    mode,
    voDataset
}) => {
    const [formData, setFormData] = useState<BuildingSelectionStepData>({
        selectedBuildings: data.buildingSelection?.selectedBuildings || [],
        buildingNames: data.buildingSelection?.buildingNames || [],
        level: data.buildingSelection?.level || 'Building'
    });

    // Mock buildings data - replace with actual API call
    const availableBuildings = [
        { id: 1, name: 'Building A', description: 'Main residential block' },
        { id: 2, name: 'Building B', description: 'Commercial complex' },
        { id: 3, name: 'Building C', description: 'Parking structure' },
        { id: 4, name: 'Building D', description: 'Amenities building' }
    ];

    // Validation and data update
    useEffect(() => {
        const isValid = formData.selectedBuildings.length > 0;
        onValidationChange(isValid);
        onDataChange(formData);
    }, [formData, onDataChange, onValidationChange]);

    const handleBuildingToggle = (buildingId: number, buildingName: string) => {
        const isSelected = formData.selectedBuildings.includes(buildingId);
        
        if (isSelected) {
            // Remove building
            setFormData(prev => ({
                ...prev,
                selectedBuildings: prev.selectedBuildings.filter(id => id !== buildingId),
                buildingNames: prev.buildingNames.filter(name => name !== buildingName)
            }));
        } else {
            // Add building
            setFormData(prev => ({
                ...prev,
                selectedBuildings: [...prev.selectedBuildings, buildingId],
                buildingNames: [...prev.buildingNames, buildingName]
            }));
        }
    };

    const handleSelectAll = () => {
        if (formData.selectedBuildings.length === availableBuildings.length) {
            // Deselect all
            setFormData(prev => ({
                ...prev,
                selectedBuildings: [],
                buildingNames: []
            }));
        } else {
            // Select all
            setFormData(prev => ({
                ...prev,
                selectedBuildings: availableBuildings.map(b => b.id),
                buildingNames: availableBuildings.map(b => b.name)
            }));
        }
    };

    const handleLevelChange = (level: 'Project' | 'Building') => {
        setFormData(prev => ({
            ...prev,
            level,
            // If switching to Project level, select all buildings
            ...(level === 'Project' ? {
                selectedBuildings: availableBuildings.map(b => b.id),
                buildingNames: availableBuildings.map(b => b.name)
            } : {})
        }));
    };

    return (
        <div className="space-y-6">
            {/* Level Selection */}
            <div className="space-y-3">
                <h3 className="text-base font-semibold text-base-content">VO Scope Level</h3>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            className="radio radio-primary"
                            checked={formData.level === 'Project'}
                            onChange={() => handleLevelChange('Project')}
                        />
                        <span className="font-medium">Project Level</span>
                        <span className="text-sm text-base-content/70">(All Buildings)</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            className="radio radio-primary"
                            checked={formData.level === 'Building'}
                            onChange={() => handleLevelChange('Building')}
                        />
                        <span className="font-medium">Building Level</span>
                        <span className="text-sm text-base-content/70">(Select specific buildings)</span>
                    </label>
                </div>
            </div>

            {/* Building Selection */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-base-content">
                        Select Buildings {formData.level === 'Project' ? '(All Selected)' : ''}
                    </h3>
                    
                    {formData.level === 'Building' && (
                        <Button
                            type="button"
                            size="sm"
                            className="bg-base-200 text-base-content hover:bg-base-300"
                            onClick={handleSelectAll}
                        >
                            {formData.selectedBuildings.length === availableBuildings.length ? 'Deselect All' : 'Select All'}
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableBuildings.map((building) => {
                        const isSelected = formData.selectedBuildings.includes(building.id);
                        const isDisabled = formData.level === 'Project';
                        
                        return (
                            <div
                                key={building.id}
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                    isSelected
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-base-300 hover:border-base-400 bg-base-100'
                                } ${isDisabled ? 'opacity-70' : ''}`}
                                onClick={() => !isDisabled && handleBuildingToggle(building.id, building.name)}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary mt-1"
                                        checked={isSelected}
                                        disabled={isDisabled}
                                        onChange={() => {}} // Handled by parent div click
                                    />
                                    
                                    <div className="flex-1">
                                        <h4 className="font-medium text-base-content flex items-center gap-2">
                                            <span className="iconify lucide--building size-4"></span>
                                            {building.name}
                                        </h4>
                                        <p className="text-sm text-base-content/70 mt-1">
                                            {building.description}
                                        </p>
                                    </div>
                                    
                                    {isSelected && (
                                        <span className="iconify lucide--check text-primary size-5"></span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selection Summary */}
            <div className={`p-4 rounded-lg border ${
                formData.selectedBuildings.length > 0
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
            }`}>
                <div className="flex items-center gap-3">
                    <span className={`iconify ${
                        formData.selectedBuildings.length > 0
                            ? 'lucide--check-circle text-green-600 dark:text-green-400'
                            : 'lucide--alert-triangle text-yellow-600 dark:text-yellow-400'
                    } size-5`}></span>
                    
                    <div>
                        <h4 className={`font-medium ${
                            formData.selectedBuildings.length > 0
                                ? 'text-green-900 dark:text-green-100'
                                : 'text-yellow-900 dark:text-yellow-100'
                        }`}>
                            {formData.selectedBuildings.length > 0
                                ? `${formData.selectedBuildings.length} Building(s) Selected`
                                : 'No Buildings Selected'
                            }
                        </h4>
                        
                        <p className={`text-sm ${
                            formData.selectedBuildings.length > 0
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-yellow-700 dark:text-yellow-300'
                        }`}>
                            {formData.selectedBuildings.length > 0
                                ? `Selected: ${formData.buildingNames.join(', ')}`
                                : 'Please select at least one building to proceed'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Edit Mode Information */}
            {mode === 'edit' && voDataset && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <span className="iconify lucide--info text-blue-600 dark:text-blue-400 size-5 mt-0.5"></span>
                        <div>
                            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Editing Existing VO
                            </h5>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                You can modify the building selection for this VO. This will affect which buildings the VO line items apply to.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="text-sm text-base-content/70 space-y-1">
                <p><strong>Instructions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Project Level:</strong> VO applies to all buildings in the project</li>
                    <li><strong>Building Level:</strong> VO applies only to selected buildings</li>
                    <li>You can change the selection at any time during VO creation</li>
                    <li>At least one building must be selected to proceed</li>
                </ul>
            </div>
        </div>
    );
};

export default BuildingSelectionStep;