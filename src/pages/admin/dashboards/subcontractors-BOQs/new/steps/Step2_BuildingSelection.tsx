import React from "react";
import { useWizardContext } from "../context/WizardContext";

export const Step2_BuildingSelection: React.FC = () => {
    const { formData, setFormData, projects, buildings } = useWizardContext();
    
    const selectedProject = projects.find(p => p.id === formData.projectId);

    const handleBuildingToggle = (buildingId: number, checked: boolean) => {
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
                <p className="text-sm text-base-content/70 ml-7">Select the buildings for this subcontract</p>
            </div>

            {buildings.length > 0 ? (
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Buildings *</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {buildings.map(building => (
                            <div key={building.id} className="relative">
                                <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                    formData.buildingIds.includes(building.id)
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-base-300 bg-base-100 hover:border-base-400'
                                }`}>
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary"
                                        checked={formData.buildingIds.includes(building.id)}
                                        onChange={(e) => handleBuildingToggle(building.id, e.target.checked)}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="iconify lucide--building size-5 text-base-content/60"></span>
                                            <span className="font-medium text-base-content">{building.name}</span>
                                        </div>
                                    </div>
                                    {formData.buildingIds.includes(building.id) && (
                                        <span className="iconify lucide--check-circle size-5 text-primary"></span>
                                    )}
                                </label>
                            </div>
                        ))}
                    </div>
                    
                    {formData.buildingIds.length > 0 && (
                        <div className="bg-base-200 border border-base-300 p-3 rounded-lg mt-4">
                            <div className="flex items-center gap-2">
                                <span className="iconify lucide--check-circle size-5 text-primary"></span>
                                <span className="font-medium text-base-content">
                                    {formData.buildingIds.length} building(s) selected
                                </span>
                            </div>
                            <div className="text-sm text-base-content/70 mt-1">
                                {buildings
                                    .filter(b => formData.buildingIds.includes(b.id))
                                    .map(b => b.name)
                                    .join(', ')}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8">
                    <span className="iconify lucide--building size-12 text-base-content/40 mx-auto mb-2"></span>
                    <p className="text-base-content/60">No buildings found for this project</p>
                </div>
            )}
        </div>
    );
};