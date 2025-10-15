import React, { useState } from "react";
import { Icon } from "@iconify/react";
import xIcon from "@iconify/icons-lucide/x";
import checkIcon from "@iconify/icons-lucide/check";
import searchIcon from "@iconify/icons-lucide/search";
import searchXIcon from "@iconify/icons-lucide/search-x";
import buildingIcon from "@iconify/icons-lucide/building";
import infoIcon from "@iconify/icons-lucide/info";
import plusIcon from "@iconify/icons-lucide/plus";
import loaderIcon from "@iconify/icons-lucide/loader";

interface Building {
    id: number;
    name: string;
    boqSheets?: any[];
    [key: string]: any;
}

interface BuildingSelectionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onBuildingSelect: (building: Building) => void;
    buildings: Building[];
    currentBuilding: Building | null;
    projectName?: string;
    projectId?: number;
    onCreateBuildings?: (buildingData: { projectId: number; name: string; buildingNumber: number }) => Promise<any>;
}

const BuildingSelectionDialog: React.FC<BuildingSelectionDialogProps> = ({
    isOpen,
    onClose,
    onBuildingSelect,
    buildings,
    currentBuilding,
    projectName,
    projectId,
    onCreateBuildings
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [buildingName, setBuildingName] = useState("");
    const [buildingCount, setBuildingCount] = useState(1);
    const [isCreating, setIsCreating] = useState(false);

    // Filter buildings based on search term
    const filteredBuildings = buildings.filter(building =>
        building.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate item count for each building
    const getBuildingItemCount = (building: Building): number => {
        if (!building.boqSheets || building.boqSheets.length === 0) return 0;
        return building.boqSheets.reduce((total, sheet) => {
            return total + (sheet.boqItems?.length || 0);
        }, 0);
    };

    const handleBuildingClick = (building: Building) => {
        onBuildingSelect(building);
        onClose();
    };

    const handleClose = () => {
        setSearchTerm("");
        setShowCreateForm(false);
        setBuildingName("");
        setBuildingCount(1);
        onClose();
    };

    const handleCreateBuildings = async () => {
        if (!projectId || !buildingName || buildingCount < 1 || !onCreateBuildings) return;

        setIsCreating(true);
        try {
            const result = await onCreateBuildings({
                projectId,
                name: buildingName,
                buildingNumber: buildingCount
            });

            if (result.success && result.data && result.data.length > 0) {
                // Auto-select the first created building
                onBuildingSelect(result.data[0]);
                setShowCreateForm(false);
                setBuildingName("");
                setBuildingCount(1);
            }
        } catch (error) {
            console.error("Error creating buildings:", error);
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col animate-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-base-300">
                    <div>
                        <h3 className="text-xl font-semibold text-base-content">Select Building</h3>
                        <p className="text-sm text-base-content/60 mt-1">
                            {projectName && (
                                <span>
                                    Project: <span className="font-medium">{projectName}</span>
                                </span>
                            )}
                            {currentBuilding && (
                                <span className="ml-2">
                                    • Current: <span className="font-medium text-primary">{currentBuilding.name}</span>
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="btn btn-sm btn-circle btn-ghost hover:bg-base-200"
                    >
                        <Icon icon={xIcon} className="w-4 h-4" />
                    </button>
                </div>

                {/* Search & Create Button */}
                <div className="p-6 border-b border-base-300">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Icon icon={searchIcon} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                            <input
                                type="text"
                                placeholder="Search buildings..."
                                className="input input-bordered w-full pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {onCreateBuildings && projectId && (
                            <button
                                onClick={() => setShowCreateForm(!showCreateForm)}
                                className="btn btn-primary btn-sm flex items-center gap-2"
                            >
                                <Icon icon={plusIcon} className="w-4 h-4" />
                                Create New
                            </button>
                        )}
                    </div>

                    {/* Create Building Form */}
                    {showCreateForm && onCreateBuildings && (
                        <div className="mt-4 p-4 bg-base-200 rounded-lg space-y-3">
                            <h4 className="font-medium text-sm text-base-content">Create New Buildings</h4>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Building name"
                                    value={buildingName}
                                    onChange={(e) => setBuildingName(e.target.value)}
                                    className="input input-sm input-bordered flex-1"
                                    disabled={isCreating}
                                />
                                <input
                                    type="number"
                                    placeholder="Count"
                                    value={buildingCount}
                                    onChange={(e) => setBuildingCount(parseInt(e.target.value) || 1)}
                                    min="1"
                                    max="50"
                                    className="input input-sm input-bordered w-20"
                                    disabled={isCreating}
                                />
                                <button
                                    onClick={handleCreateBuildings}
                                    disabled={!buildingName || buildingCount < 1 || isCreating}
                                    className="btn btn-sm btn-success text-white disabled:opacity-50"
                                >
                                    {isCreating ? (
                                        <>
                                            <Icon icon={loaderIcon} className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon={checkIcon} className="w-4 h-4" />
                                            Create
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setBuildingName("");
                                        setBuildingCount(1);
                                    }}
                                    disabled={isCreating}
                                    className="btn btn-sm btn-ghost"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredBuildings.length === 0 ? (
                        <div className="text-center py-12">
                            <Icon icon={searchXIcon} className="w-12 h-12 text-base-content/40 mx-auto mb-4" />
                            <p className="text-base-content/60">
                                {buildings.length === 0 ? "No buildings available" : "No buildings found matching your search"}
                            </p>
                            {buildings.length === 0 && onCreateBuildings && (
                                <p className="text-sm text-base-content/50 mt-2">
                                    Click "Create New" to add buildings to this project
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredBuildings.map((building) => {
                                const isCurrentBuilding = currentBuilding?.id === building.id;
                                const itemCount = getBuildingItemCount(building);
                                const hasData = itemCount > 0;

                                return (
                                    <button
                                        key={building.id}
                                        onClick={() => handleBuildingClick(building)}
                                        className={`
                                            relative p-4 rounded-xl border-2 text-left transition-all duration-200
                                            hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20
                                            ${
                                                isCurrentBuilding
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                    : 'border-base-300 hover:border-primary/50 hover:bg-base-50'
                                            }
                                        `}
                                    >
                                        {/* Building Icon & Name */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className={`p-2 rounded-lg ${isCurrentBuilding ? 'bg-primary/20' : 'bg-base-200'}`}>
                                                    <Icon
                                                        icon={buildingIcon}
                                                        className={`w-5 h-5 ${isCurrentBuilding ? 'text-primary' : 'text-base-content/60'}`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`font-medium text-sm truncate ${isCurrentBuilding ? 'text-primary' : 'text-base-content'}`}>
                                                        {building.name}
                                                    </h4>
                                                </div>
                                            </div>

                                            {/* Current Building Indicator */}
                                            {isCurrentBuilding && (
                                                <div className="ml-2">
                                                    <Icon icon={checkIcon} className="w-4 h-4 text-primary" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Building Stats */}
                                        <div className="mt-3 pt-3 border-t border-base-200 space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-base-content/60">BOQ Items:</span>
                                                <span className={`font-medium ${hasData ? 'text-success' : 'text-base-content/50'}`}>
                                                    {itemCount}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-base-content/60">Sheets:</span>
                                                <span className="font-medium text-base-content/70">
                                                    {building.boqSheets?.length || 0}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Data Status Badge */}
                                        {hasData && (
                                            <div className="absolute top-2 right-2">
                                                <div className="w-2 h-2 rounded-full bg-success" title="Has BOQ data" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-base-300">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-base-content/60">
                            <Icon icon={infoIcon} className="w-4 h-4 inline mr-2" />
                            {filteredBuildings.length} {filteredBuildings.length === 1 ? 'building' : 'buildings'} available
                        </div>
                        <button
                            onClick={handleClose}
                            className="btn btn-ghost btn-sm hover:bg-base-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuildingSelectionDialog;
