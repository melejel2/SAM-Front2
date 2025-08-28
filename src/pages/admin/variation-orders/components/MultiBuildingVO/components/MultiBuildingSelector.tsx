import { useState, useEffect } from "react";
import { Button, Select, SelectOption } from "@/components/daisyui";

interface BuildingVOConfig {
    buildingId: number;
    buildingName: string;
    voLevel: number;
    replaceAllItems: boolean;
    selected: boolean;
}

interface MultiBuildingSelectorProps {
    buildings: any[];
    projectId?: number;
    onSelectionChange?: (configs: BuildingVOConfig[]) => void;
    disabled?: boolean;
}

const MultiBuildingSelector: React.FC<MultiBuildingSelectorProps> = ({
    buildings,
    onSelectionChange,
    disabled = false
}) => {
    const [buildingConfigs, setBuildingConfigs] = useState<BuildingVOConfig[]>([]);

    useEffect(() => {
        // Initialize building configurations
        const initialConfigs = buildings.map(building => ({
            buildingId: building.id,
            buildingName: building.name,
            voLevel: 1,
            replaceAllItems: true,
            selected: false
        }));
        setBuildingConfigs(initialConfigs);
    }, [buildings]);

    useEffect(() => {
        if (onSelectionChange) {
            onSelectionChange(buildingConfigs);
        }
    }, [buildingConfigs, onSelectionChange]);

    const handleBuildingToggle = (buildingId: number, selected: boolean) => {
        setBuildingConfigs(prev =>
            prev.map(config =>
                config.buildingId === buildingId
                    ? { ...config, selected }
                    : config
            )
        );
    };

    const handleVoLevelChange = (buildingId: number, voLevel: number) => {
        setBuildingConfigs(prev =>
            prev.map(config =>
                config.buildingId === buildingId
                    ? { ...config, voLevel }
                    : config
            )
        );
    };

    const handleReplaceToggle = (buildingId: number, replaceAllItems: boolean) => {
        setBuildingConfigs(prev =>
            prev.map(config =>
                config.buildingId === buildingId
                    ? { ...config, replaceAllItems }
                    : config
            )
        );
    };

    const handleSelectAll = () => {
        setBuildingConfigs(prev =>
            prev.map(config => ({ ...config, selected: true }))
        );
    };

    const handleSelectNone = () => {
        setBuildingConfigs(prev =>
            prev.map(config => ({ ...config, selected: false }))
        );
    };

    const selectedCount = buildingConfigs.filter(c => c.selected).length;
    const totalCount = buildingConfigs.length;

    // VO Level options (1-5)
    const voLevelOptions = Array.from({ length: 5 }, (_, i) => ({
        value: i + 1,
        label: `Level ${i + 1}`
    }));

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <div>
                    <h3 className="text-base font-semibold text-base-content">Building Selection</h3>
                    <p className="text-sm text-base-content/70">
                        Select buildings and configure VO generation options
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-base-content/70">
                        {selectedCount} of {totalCount} selected
                    </span>
                    <Button
                        type="button"
                        size="sm"
                        className="bg-base-100 border-base-300 text-base-content hover:bg-base-300"
                        onClick={handleSelectAll}
                        disabled={disabled || selectedCount === totalCount}
                    >
                        Select All
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        className="bg-base-100 border-base-300 text-base-content hover:bg-base-300"
                        onClick={handleSelectNone}
                        disabled={disabled || selectedCount === 0}
                    >
                        Clear All
                    </Button>
                </div>
            </div>

            {/* Building Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {buildingConfigs.map((config) => (
                    <div
                        key={config.buildingId}
                        className={`
                            card bg-base-100 border transition-all duration-200
                            ${config.selected 
                                ? 'border-primary bg-primary/5 shadow-md' 
                                : 'border-base-300 hover:border-base-400'
                            }
                        `}
                    >
                        <div className="card-body p-4">
                            {/* Building Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary"
                                        checked={config.selected}
                                        onChange={(e) => handleBuildingToggle(config.buildingId, e.target.checked)}
                                        disabled={disabled}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-base-content truncate">
                                            {config.buildingName}
                                        </h4>
                                        <p className="text-xs text-base-content/70">
                                            Building ID: {config.buildingId}
                                        </p>
                                    </div>
                                </div>
                                {config.selected && (
                                    <span className="badge badge-primary badge-sm">Selected</span>
                                )}
                            </div>

                            {/* Configuration Options */}
                            {config.selected && (
                                <div className="space-y-3 mt-3 pt-3 border-t border-base-300">
                                    <label className="floating-label">
                                        <span>VO Level</span>
                                        <Select
                                            className="input input-sm bg-base-100 border-base-300"
                                            value={config.voLevel}
                                            onChange={(e) => handleVoLevelChange(config.buildingId, Number(e.target.value))}
                                            disabled={disabled}
                                        >
                                            <>
                                                {voLevelOptions.map((option) => (
                                                    <SelectOption key={option.value} value={option.value} className="bg-base-100">
                                                        {option.label}
                                                    </SelectOption>
                                                ))}
                                            </>
                                        </Select>
                                    </label>

                                    <div className="form-control">
                                        <label className="cursor-pointer label justify-start gap-3">
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-primary toggle-sm"
                                                checked={config.replaceAllItems}
                                                onChange={(e) => handleReplaceToggle(config.buildingId, e.target.checked)}
                                                disabled={disabled}
                                            />
                                            <div>
                                                <span className="label-text font-medium">
                                                    {config.replaceAllItems ? 'Replace All Items' : 'Append Items'}
                                                </span>
                                                <p className="text-xs text-base-content/70">
                                                    {config.replaceAllItems 
                                                        ? 'Replace existing VO items' 
                                                        : 'Add to existing VO items'
                                                    }
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            {selectedCount > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                        <span className="iconify lucide--info text-green-600 dark:text-green-400 size-5"></span>
                        <div>
                            <h5 className="text-sm font-medium text-green-900 dark:text-green-100">
                                Generation Summary
                            </h5>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                {selectedCount} building(s) selected for VO generation. 
                                {buildingConfigs.filter(c => c.selected && c.replaceAllItems).length} will replace existing items, 
                                {buildingConfigs.filter(c => c.selected && !c.replaceAllItems).length} will append to existing items.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {buildingConfigs.length === 0 && (
                <div className="text-center py-8">
                    <span className="iconify lucide--building text-base-content/50 size-12 mb-4"></span>
                    <p className="text-base-content/70">No buildings available for selection</p>
                </div>
            )}
        </div>
    );
};

export default MultiBuildingSelector;