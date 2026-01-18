import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import buildingIcon from "@iconify/icons-lucide/building";
import checkCircleIcon from "@iconify/icons-lucide/check-circle";
import chevronDownIcon from "@iconify/icons-lucide/chevron-down";
import chevronRightIcon from "@iconify/icons-lucide/chevron-right";

interface BuildingSelectionSectionProps {
    tradeName: string;
    buildings: any[];
    selectedBuildings: number[];
    onBuildingToggle: (buildingId: number, checked: boolean) => void;
}

export const BuildingSelectionSection: React.FC<BuildingSelectionSectionProps> = ({
    tradeName,
    buildings,
    selectedBuildings,
    onBuildingToggle
}) => {
    // Start expanded if no buildings selected, collapsed if buildings already selected
    const [isExpanded, setIsExpanded] = useState(selectedBuildings.length === 0);

    // Auto-collapse when a building is selected
    useEffect(() => {
        if (selectedBuildings.length > 0) {
            setIsExpanded(false);
        }
    }, [selectedBuildings.length]);

    const handleBuildingToggle = (buildingId: number, checked: boolean) => {
        onBuildingToggle(buildingId, checked);
        // Auto-collapse after selecting a building
        if (checked) {
            setIsExpanded(false);
        }
    };

    // Get selected building names for display
    const selectedBuildingNames = selectedBuildings
        .map(id => buildings.find(b => b.id === id)?.name)
        .filter(Boolean);

    return (
        <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
            {/* Collapsible Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between px-3 py-2 hover:bg-base-50 transition-colors ${isExpanded ? 'border-b border-base-300' : ''}`}
            >
                <div className="flex items-center gap-2">
                    <Icon
                        icon={isExpanded ? chevronDownIcon : chevronRightIcon}
                        className="w-4 h-4 text-base-content/60"
                    />
                    <Icon icon={buildingIcon} className="w-4 h-4 text-secondary" />
                    <span className="font-medium text-sm text-base-content">Select Buildings</span>
                    {selectedBuildings.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                            {selectedBuildingNames.map(name => (
                                <div key={name} className="badge badge-primary badge-sm">
                                    {name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="p-3">
                    {buildings.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {buildings.map(building => {
                                const isSelected = selectedBuildings.includes(building.id);
                                const availableSheetsCount = building.sheets.filter(
                                    (sheet: any) => sheet.name === tradeName
                                ).length;

                                return (
                                    <label
                                        key={building.id}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-all duration-150 hover:shadow-sm ${
                                            isSelected
                                                ? 'border-primary bg-primary/5'
                                                : 'border-base-300 bg-base-100 hover:border-base-400'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-primary checkbox-sm"
                                            checked={isSelected}
                                            onChange={(e) => handleBuildingToggle(building.id, e.target.checked)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <Icon icon={buildingIcon} className="w-4 h-4 text-base-content/60 flex-shrink-0" />
                                                <span className="font-medium text-sm text-base-content truncate">{building.name}</span>
                                            </div>
                                            <div className="text-xs text-base-content/60">
                                                {availableSheetsCount} sheet{availableSheetsCount !== 1 ? 's' : ''} available
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <Icon icon={checkCircleIcon} className="w-4 h-4 text-primary flex-shrink-0" />
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <Icon icon={buildingIcon} className="w-8 h-8 text-base-content/40 mx-auto mb-2" />
                            <p className="text-sm text-base-content/60">No buildings available for this trade</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
