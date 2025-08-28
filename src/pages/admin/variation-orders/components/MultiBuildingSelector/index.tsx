import React, { useState, useEffect } from "react";
import { Button, Modal } from "@/components/daisyui";
import useBuildings, { Building } from "@/hooks/use-buildings";

interface BuildingVOConfig {
    buildingId: number;
    buildingName: string;
    voLevel: number;
    replaceMode: boolean; // true = Replace, false = Append
    selected: boolean;
}

interface MultiBuildingSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (buildingConfigs: BuildingVOConfig[]) => void;
    projectId: number;
    initialSelectedBuildings?: number[];
}

const MultiBuildingSelector: React.FC<MultiBuildingSelectorProps> = ({
    isOpen,
    onClose,
    onConfirm,
    projectId,
    initialSelectedBuildings = []
}) => {
    const { buildings, loading: buildingsLoading, getBuildingsByProject } = useBuildings();
    const [buildingConfigs, setBuildingConfigs] = useState<BuildingVOConfig[]>([]);

    // Load buildings when modal opens or project changes
    useEffect(() => {
        if (isOpen && projectId) {
            getBuildingsByProject(projectId);
        }
    }, [isOpen, projectId, getBuildingsByProject]);

    // Initialize building configurations when buildings load
    useEffect(() => {
        if (buildings.length > 0) {
            const configs = buildings.map((building: Building) => ({
                buildingId: building.id,
                buildingName: building.name,
                voLevel: 1, // Default VO level
                replaceMode: false, // Default to Append mode
                selected: initialSelectedBuildings.includes(building.id)
            }));
            setBuildingConfigs(configs);
        }
    }, [buildings, initialSelectedBuildings]);

    const handleBuildingToggle = (buildingId: number) => {
        setBuildingConfigs(prev => 
            prev.map(config => 
                config.buildingId === buildingId 
                    ? { ...config, selected: !config.selected }
                    : config
            )
        );
    };

    const handleVOLevelChange = (buildingId: number, level: number) => {
        setBuildingConfigs(prev => 
            prev.map(config => 
                config.buildingId === buildingId 
                    ? { ...config, voLevel: level }
                    : config
            )
        );
    };

    const handleReplaceModeToggle = (buildingId: number) => {
        setBuildingConfigs(prev => 
            prev.map(config => 
                config.buildingId === buildingId 
                    ? { ...config, replaceMode: !config.replaceMode }
                    : config
            )
        );
    };

    const handleSelectAll = () => {
        const allSelected = buildingConfigs.every(config => config.selected);
        setBuildingConfigs(prev => 
            prev.map(config => ({ ...config, selected: !allSelected }))
        );
    };

    const handleConfirm = () => {
        const selectedConfigs = buildingConfigs.filter(config => config.selected);
        if (selectedConfigs.length === 0) {
            // Show warning
            return;
        }
        onConfirm(selectedConfigs);
        onClose();
    };

    const selectedCount = buildingConfigs.filter(config => config.selected).length;
    const totalCount = buildingConfigs.length;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="bg-base-100">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-base-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                            <span className="iconify lucide--building-2 text-purple-600 dark:text-purple-400 size-5"></span>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-base-content">Multi-Building VO Configuration</h2>
                            <p className="text-sm text-base-content/70">
                                Select buildings and configure VO settings for each
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="btn btn-sm btn-ghost btn-circle"
                    >
                        <span className="iconify lucide--x size-4"></span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {buildingsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="loading loading-spinner loading-md text-primary"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Controls Header */}
                            <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handleSelectAll}
                                    >
                                        <span className="iconify lucide--check-square size-4"></span>
                                        {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
                                    </Button>
                                    <div className="text-sm text-base-content/70">
                                        {selectedCount} of {totalCount} buildings selected
                                    </div>
                                </div>
                            </div>

                            {/* Building List */}
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {buildingConfigs.map((config) => (
                                    <div 
                                        key={config.buildingId}
                                        className={`p-4 border border-base-300 rounded-lg ${
                                            config.selected ? 'bg-primary/5 border-primary/30' : 'bg-base-100'
                                        } hover:bg-base-50 transition-colors`}
                                    >
                                        {/* Building Header */}
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    className="checkbox checkbox-primary"
                                                    checked={config.selected}
                                                    onChange={() => handleBuildingToggle(config.buildingId)}
                                                />
                                                <div>
                                                    <div className="font-medium text-base-content">
                                                        {config.buildingName}
                                                    </div>
                                                    <div className="text-xs text-base-content/60">
                                                        Building ID: {config.buildingId}
                                                    </div>
                                                </div>
                                            </label>
                                            
                                            {config.selected && (
                                                <div className="flex items-center gap-2">
                                                    <span className="iconify lucide--settings size-4 text-primary"></span>
                                                    <span className="text-xs text-primary font-medium">Configured</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Building Configuration (only when selected) */}
                                        {config.selected && (
                                            <div className="mt-4 pl-8 space-y-3 border-t border-base-300 pt-3">
                                                {/* VO Level Selection */}
                                                <div className="flex items-center gap-4">
                                                    <label className="text-sm font-medium text-base-content min-w-0 flex-shrink-0">
                                                        VO Level:
                                                    </label>
                                                    <div className="flex gap-2">
                                                        {[1, 2, 3, 4, 5].map(level => (
                                                            <label key={level} className="flex items-center gap-1 cursor-pointer">
                                                                <input 
                                                                    type="radio"
                                                                    name={`voLevel_${config.buildingId}`}
                                                                    className="radio radio-primary radio-xs"
                                                                    checked={config.voLevel === level}
                                                                    onChange={() => handleVOLevelChange(config.buildingId, level)}
                                                                />
                                                                <span className="text-xs text-base-content">{level}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Replace/Append Mode */}
                                                <div className="flex items-center gap-4">
                                                    <label className="text-sm font-medium text-base-content min-w-0 flex-shrink-0">
                                                        Mode:
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="checkbox"
                                                            className="toggle toggle-primary toggle-sm"
                                                            checked={config.replaceMode}
                                                            onChange={() => handleReplaceModeToggle(config.buildingId)}
                                                        />
                                                        <span className="text-sm text-base-content">
                                                            {config.replaceMode ? 'Replace existing VO items' : 'Append to existing VO items'}
                                                        </span>
                                                    </label>
                                                </div>
                                                
                                                {/* Mode Description */}
                                                <div className="text-xs text-base-content/60 pl-0">
                                                    {config.replaceMode 
                                                        ? '⚠️ This will replace all existing VO items for this building'
                                                        : '✅ This will add new VO items alongside existing ones'
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between p-4 border-t border-base-300">
                    <div className="text-sm text-base-content/70">
                        {selectedCount > 0 && (
                            <>
                                Creating VO for {selectedCount} building{selectedCount !== 1 ? 's' : ''}
                            </>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-primary text-primary-content hover:bg-primary/90"
                            onClick={handleConfirm}
                            disabled={selectedCount === 0}
                        >
                            <span className="iconify lucide--check size-4"></span>
                            Generate VO ({selectedCount})
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default MultiBuildingSelector;