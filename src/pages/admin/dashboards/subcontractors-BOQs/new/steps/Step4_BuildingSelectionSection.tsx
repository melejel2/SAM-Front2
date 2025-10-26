import React, { useState } from "react";
import { Icon } from "@iconify/react";
import buildingIcon from "@iconify/icons-lucide/building";
import checkCircleIcon from "@iconify/icons-lucide/check-circle";
import chevronDownIcon from "@iconify/icons-lucide/chevron-down";
import chevronRightIcon from "@iconify/icons-lucide/chevron-right";
import layersIcon from "@iconify/icons-lucide/layers";

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
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
            {/* Collapsible Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 bg-base-200 hover:bg-base-300 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon
                        icon={isExpanded ? chevronDownIcon : chevronRightIcon}
                        className="w-5 h-5 text-base-content/60"
                    />
                    <Icon icon={layersIcon} className="w-5 h-5 text-secondary" />
                    <span className="font-semibold text-base-content">{tradeName}</span>
                    <div className="badge badge-neutral badge-sm">
                        {buildings.length} building{buildings.length !== 1 ? 's' : ''} available
                    </div>
                </div>
                {selectedBuildings.length > 0 && (
                    <div className="badge badge-primary badge-sm">
                        {selectedBuildings.length} selected
                    </div>
                )}
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="p-4">
                    {buildings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {buildings.map(building => {
                                const isSelected = selectedBuildings.includes(building.id);
                                const availableSheetsCount = building.sheets.filter(
                                    (sheet: any) => sheet.name === tradeName
                                ).length;

                                return (
                                    <div key={building.id} className="relative">
                                        <label
                                            className={`flex flex-col gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                                isSelected
                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                    : 'border-base-300 bg-base-100 hover:border-base-400'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-primary"
                                                    checked={isSelected}
                                                    onChange={(e) => onBuildingToggle(building.id, e.target.checked)}
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Icon icon={buildingIcon} className="w-5 h-5 text-base-content/60" />
                                                        <span className="font-medium text-base-content">{building.name}</span>
                                                    </div>
                                                    <div className="text-sm text-base-content/70">
                                                        {availableSheetsCount} sheet{availableSheetsCount !== 1 ? 's' : ''} available
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <Icon icon={checkCircleIcon} className="w-5 h-5 text-primary" />
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Icon icon={buildingIcon} className="w-12 h-12 text-base-content/40 mx-auto mb-2" />
                            <p className="text-base-content/60">No buildings available for this trade</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
