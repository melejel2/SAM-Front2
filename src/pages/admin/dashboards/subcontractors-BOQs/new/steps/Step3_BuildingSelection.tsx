import React from "react";
import { Icon } from "@iconify/react";
import folderIcon from "@iconify/icons-lucide/folder-open";
import layersIcon from "@iconify/icons-lucide/layers";
import buildingIcon from "@iconify/icons-lucide/building";
import checkCircleIcon from "@iconify/icons-lucide/check-circle";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import { useWizardContext } from "../context/WizardContext";

export const Step3_BuildingSelection: React.FC = () => {
    const { formData, setFormData, projects, trades, buildings, loadingBuildings } = useWizardContext();

    const selectedProject = projects.find(p => p.id === formData.projectId);
    const selectedTrade = trades.find(t => t.id === formData.tradeId);

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

    if (!selectedProject || !selectedTrade) {
        return (
            <div className="text-center py-8">
                <p className="text-base-content/60">
                    {!selectedProject ? "Please select a project first" : "Please select a trade first"}
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="bg-base-100 border border-base-300 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Icon icon={folderIcon} className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-base-content">Project: {selectedProject.name}</h3>
                </div>
                <div className="flex items-center gap-2 mb-2 ml-7">
                    <Icon icon={layersIcon} className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-medium text-base-content">Trade: {selectedTrade.name}</span>
                </div>
            </div>

            {loadingBuildings ? (
                <div className="text-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="mt-4 text-base-content/70">Loading buildings with {selectedTrade.name}...</p>
                </div>
            ) : buildings.length > 0 ? (
                <div className="form-control">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {buildings.map(building => (
                            <div key={building.id} className="relative">
                                <label className={`flex flex-col gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                    formData.buildingIds.includes(building.id)
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-base-300 bg-base-100 hover:border-base-400'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-primary"
                                            checked={formData.buildingIds.includes(building.id)}
                                            onChange={(e) => handleBuildingToggle(building.id, e.target.checked)}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon icon={buildingIcon} className="w-5 h-5 text-base-content/60" />
                                                <span className="font-medium text-base-content">{building.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-base-content/70">
                                                <Icon icon={fileTextIcon} className="w-4 h-4" />
                                                <span>{building.sheetCount} trade{building.sheetCount !== 1 ? 's' : ''} available</span>
                                            </div>
                                        </div>
                                        {formData.buildingIds.includes(building.id) && (
                                            <Icon icon={checkCircleIcon} className="w-5 h-5 text-primary" />
                                        )}
                                    </div>

                                </label>
                            </div>
                        ))}
                    </div>
                    
                </div>
            ) : (
                <div className="text-center py-8">
                    <Icon icon={buildingIcon} className="w-12 h-12 text-base-content/40 mx-auto mb-2" />
                    <p className="text-base-content/60">No buildings found with {selectedTrade.name} trade</p>
                    <p className="text-sm text-base-content/50 mt-1">
                        Try selecting a different trade or check if buildings have BOQ sheets configured
                    </p>
                </div>
            )}
        </div>
    );
};