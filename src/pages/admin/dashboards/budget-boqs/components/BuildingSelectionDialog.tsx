import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import xIcon from "@iconify/icons-lucide/x";
import checkIcon from "@iconify/icons-lucide/check";
import searchIcon from "@iconify/icons-lucide/search";
import searchXIcon from "@iconify/icons-lucide/search-x";
import buildingIcon from "@iconify/icons-lucide/building";
import infoIcon from "@iconify/icons-lucide/info";
import plusIcon from "@iconify/icons-lucide/plus";
import loaderIcon from "@iconify/icons-lucide/loader";
import editIcon from "@iconify/icons-lucide/pencil";
import linkIcon from "@iconify/icons-lucide/link";
import unlinkIcon from "@iconify/icons-lucide/unlink";
import alertTriangleIcon from "@iconify/icons-lucide/alert-triangle";

interface Building {
    id: number;
    name: string;
    type?: string;
    projectLevel?: number;
    subContractorLevel?: number;
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
    onUpdateBuilding?: (buildingData: { id: number; name: string; type?: string; projectLevel?: number; subContractorLevel?: number }) => Promise<any>;
}

const BuildingSelectionDialog: React.FC<BuildingSelectionDialogProps> = ({
    isOpen,
    onClose,
    onBuildingSelect,
    buildings,
    currentBuilding,
    projectName,
    projectId,
    onCreateBuildings,
    onUpdateBuilding
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [buildingName, setBuildingName] = useState("");
    const [buildingCount, setBuildingCount] = useState(1);
    const [isCreating, setIsCreating] = useState(false);

    // Edit state
    const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
    const [editName, setEditName] = useState("");
    const [editType, setEditType] = useState<string>("");
    const [isUpdating, setIsUpdating] = useState(false);

    // Confirmation dialog state
    const [pendingUpdate, setPendingUpdate] = useState<{
        type: "rename" | "makeUnique" | "linkToGroup";
        building: Building;
        newName?: string;
        newType?: string;
        targetGroupNames?: string[];
    } | null>(null);

    // Get unique types from buildings for grouping options
    const buildingTypes = useMemo(() => {
        const types = new Map<string, Building[]>();
        buildings.forEach(b => {
            if (b.type) {
                const existing = types.get(b.type) || [];
                types.set(b.type, [...existing, b]);
            }
        });
        return types;
    }, [buildings]);

    // Get buildings that share the same type as the editing building
    const getSameTypeBuildings = (type: string | undefined) => {
        if (!type) return [];
        return buildings.filter(b => b.type === type);
    };

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
        setEditingBuilding(null);
        setEditName("");
        setEditType("");
        setPendingUpdate(null);
        onClose();
    };

    const handleStartEdit = (building: Building, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingBuilding(building);
        setEditName(building.name);
        setEditType(building.type || "");
        setShowCreateForm(false);
    };

    const handleCancelEdit = () => {
        setEditingBuilding(null);
        setEditName("");
        setEditType("");
    };

    // Show confirmation dialog for name change
    const handleUpdateBuilding = () => {
        if (!editingBuilding || !editName || !onUpdateBuilding) return;

        // Check if there are actual changes
        const nameChanged = editName !== editingBuilding.name;
        if (!nameChanged) {
            // No changes, just close edit mode
            setEditingBuilding(null);
            setEditName("");
            setEditType("");
            return;
        }

        // Show confirmation dialog
        setPendingUpdate({
            type: "rename",
            building: editingBuilding,
            newName: editName,
            newType: editType || editingBuilding.type
        });
    };

    // Show confirmation dialog for make unique
    const handleMakeUnique = () => {
        if (!editingBuilding || !onUpdateBuilding) return;

        // Generate a new unique type (GUID-like string)
        const newType = btoa(Math.random().toString(36).substring(2) + Date.now().toString(36));

        // Get names of buildings currently in the same group
        const currentGroupNames = getSameTypeBuildings(editingBuilding.type)
            .filter(b => b.id !== editingBuilding.id)
            .map(b => b.name);

        setPendingUpdate({
            type: "makeUnique",
            building: editingBuilding,
            newName: editName || editingBuilding.name,
            newType: newType,
            targetGroupNames: currentGroupNames
        });
    };

    // Show confirmation dialog for linking to group
    const handleLinkToType = (targetType: string) => {
        if (!editingBuilding || !onUpdateBuilding) return;

        // Get names of buildings in the target group
        const targetGroupBuildings = buildings.filter(b => b.type === targetType);
        const targetGroupNames = targetGroupBuildings.map(b => b.name);

        setPendingUpdate({
            type: "linkToGroup",
            building: editingBuilding,
            newName: editName || editingBuilding.name,
            newType: targetType,
            targetGroupNames: targetGroupNames
        });
    };

    // Execute the pending update after confirmation
    const confirmUpdate = async () => {
        if (!pendingUpdate || !onUpdateBuilding) return;

        setIsUpdating(true);
        try {
            const result = await onUpdateBuilding({
                id: pendingUpdate.building.id,
                name: pendingUpdate.newName || pendingUpdate.building.name,
                type: pendingUpdate.newType || pendingUpdate.building.type,
                projectLevel: pendingUpdate.building.projectLevel || 1,
                subContractorLevel: pendingUpdate.building.subContractorLevel || 1
            });

            if (result.success) {
                setEditingBuilding(null);
                setEditName("");
                setEditType("");
                setPendingUpdate(null);
            }
        } catch (error) {
            console.error("Error updating building:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    // Cancel the pending update
    const cancelPendingUpdate = () => {
        setPendingUpdate(null);
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
        <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
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
                        className="p-2 rounded-lg bg-base-200 text-base-content/60 hover:bg-error hover:text-error-content transition-colors duration-200"
                        title="Close"
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

                    {/* Edit Building Form */}
                    {editingBuilding && onUpdateBuilding && (
                        <div className="mt-4 p-4 bg-primary/10 rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm text-base-content flex items-center gap-2">
                                    <Icon icon={editIcon} className="w-4 h-4 text-primary" />
                                    Edit Building
                                </h4>
                                <button
                                    onClick={handleCancelEdit}
                                    disabled={isUpdating}
                                    className="btn btn-ghost btn-xs"
                                >
                                    <Icon icon={xIcon} className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Building Name */}
                            <div className="space-y-1">
                                <label className="text-xs text-base-content/70">Building Name</label>
                                <input
                                    type="text"
                                    placeholder="Building name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="input input-sm input-bordered w-full"
                                    disabled={isUpdating}
                                />
                            </div>

                            {/* Building Type Section */}
                            <div className="space-y-2">
                                <label className="text-xs text-base-content/70">Building Type (for grouping identical buildings)</label>

                                {/* Show current type info */}
                                {editingBuilding.type && (
                                    <div className="text-xs bg-base-200 p-2 rounded">
                                        <span className="text-base-content/60">Currently grouped with: </span>
                                        <span className="font-medium">
                                            {getSameTypeBuildings(editingBuilding.type)
                                                .filter(b => b.id !== editingBuilding.id)
                                                .map(b => b.name)
                                                .join(", ") || "None (unique building)"}
                                        </span>
                                    </div>
                                )}

                                {/* Type Actions */}
                                <div className="flex flex-wrap gap-2">
                                    {/* Make Unique Button */}
                                    {getSameTypeBuildings(editingBuilding.type).length > 1 && (
                                        <button
                                            onClick={handleMakeUnique}
                                            disabled={isUpdating}
                                            className="btn btn-xs bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200"
                                            title="Remove from group and make this building unique"
                                        >
                                            <Icon icon={unlinkIcon} className="w-3 h-3" />
                                            Make Unique
                                        </button>
                                    )}

                                    {/* Link to Other Type Dropdown */}
                                    {buildingTypes.size > 0 && (
                                        <div className="dropdown dropdown-end">
                                            <button
                                                tabIndex={0}
                                                disabled={isUpdating}
                                                className="btn btn-xs bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
                                            >
                                                <Icon icon={linkIcon} className="w-3 h-3" />
                                                Link to Group
                                            </button>
                                            <ul tabIndex={0} className="dropdown-content z-[300] menu p-2 shadow-lg bg-base-100 rounded-box w-64 max-h-48 overflow-auto">
                                                {Array.from(buildingTypes.entries())
                                                    .filter(([type]) => type !== editingBuilding.type)
                                                    .map(([type, buildings]) => (
                                                        <li key={type}>
                                                            <button
                                                                onClick={() => handleLinkToType(type)}
                                                                className="text-xs"
                                                            >
                                                                <span className="truncate">
                                                                    {buildings.map(b => b.name).join(", ")}
                                                                </span>
                                                                <span className="badge badge-sm badge-ghost">{buildings.length}</span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                {Array.from(buildingTypes.entries()).filter(([type]) => type !== editingBuilding.type).length === 0 && (
                                                    <li className="text-xs text-base-content/50 p-2">No other groups available</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end gap-2 pt-2 border-t border-base-300">
                                <button
                                    onClick={handleCancelEdit}
                                    disabled={isUpdating}
                                    className="btn btn-sm btn-ghost"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateBuilding}
                                    disabled={!editName || isUpdating}
                                    className="btn btn-sm btn-primary"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Icon icon={loaderIcon} className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon={checkIcon} className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
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
                                const isEditing = editingBuilding?.id === building.id;
                                const itemCount = getBuildingItemCount(building);
                                const hasData = itemCount > 0;
                                const sameTypeBuildings = getSameTypeBuildings(building.type);
                                const hasGroup = sameTypeBuildings.length > 1;

                                return (
                                    <div
                                        key={building.id}
                                        className={`
                                            relative p-4 rounded-xl border-2 text-left transition-all duration-200
                                            ${isEditing ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : ''}
                                            ${
                                                isCurrentBuilding && !isEditing
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                    : !isEditing ? 'border-base-300 hover:border-primary/50 hover:bg-base-50' : ''
                                            }
                                        `}
                                    >
                                        {/* Building Icon & Name */}
                                        <div className="flex items-start justify-between">
                                            <button
                                                onClick={() => handleBuildingClick(building)}
                                                className="flex items-start gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
                                            >
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
                                                    {/* Group indicator */}
                                                    {hasGroup && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Icon icon={linkIcon} className="w-3 h-3 text-blue-500" />
                                                            <span className="text-xs text-blue-500">
                                                                Grouped ({sameTypeBuildings.length})
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 ml-2">
                                                {/* Edit Button */}
                                                {onUpdateBuilding && (
                                                    <button
                                                        onClick={(e) => handleStartEdit(building, e)}
                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                            isEditing
                                                                ? 'bg-primary text-primary-content'
                                                                : 'bg-base-200 text-base-content/60 hover:bg-base-300 hover:text-base-content'
                                                        }`}
                                                        title="Edit building"
                                                    >
                                                        <Icon icon={editIcon} className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                {/* Current Building Indicator */}
                                                {isCurrentBuilding && (
                                                    <div className="p-1">
                                                        <Icon icon={checkIcon} className="w-4 h-4 text-primary" />
                                                    </div>
                                                )}
                                            </div>
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
                                            <div className="absolute top-2 right-10">
                                                <div className="w-2 h-2 rounded-full bg-success" title="Has BOQ data" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-base-300">
                    <div className="text-sm text-base-content/60">
                        <Icon icon={infoIcon} className="w-4 h-4 inline mr-2" />
                        {filteredBuildings.length} {filteredBuildings.length === 1 ? 'building' : 'buildings'} available
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {pendingUpdate && (
                <div className="fixed inset-0 z-[250] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-base-100 rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in duration-200">
                        {/* Dialog Header */}
                        <div className="flex items-center gap-3 p-5 border-b border-base-300">
                            <div className="p-2 bg-warning/20 rounded-lg">
                                <Icon icon={alertTriangleIcon} className="w-5 h-5 text-warning" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-base-content">
                                    Confirm {pendingUpdate.type === "rename" ? "Name Change" :
                                             pendingUpdate.type === "makeUnique" ? "Unlink Building" :
                                             "Link to Group"}
                                </h3>
                                <p className="text-sm text-base-content/60">
                                    Please confirm the following change
                                </p>
                            </div>
                        </div>

                        {/* Dialog Content */}
                        <div className="p-5 space-y-4">
                            {/* Rename Confirmation */}
                            {pendingUpdate.type === "rename" && (
                                <div className="space-y-3">
                                    <p className="text-sm text-base-content/80">
                                        Are you sure you want to rename this building?
                                    </p>
                                    <div className="bg-base-200 rounded-lg p-4 space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-base-content/60 w-16">From:</span>
                                            <span className="font-medium text-error line-through">{pendingUpdate.building.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-base-content/60 w-16">To:</span>
                                            <span className="font-medium text-success">{pendingUpdate.newName}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Make Unique Confirmation */}
                            {pendingUpdate.type === "makeUnique" && (
                                <div className="space-y-3">
                                    <p className="text-sm text-base-content/80">
                                        Are you sure you want to unlink <span className="font-semibold">{pendingUpdate.building.name}</span> from its group?
                                    </p>
                                    <div className="bg-base-200 rounded-lg p-4 space-y-2">
                                        <p className="text-xs text-base-content/60 mb-2">This will remove it from the group with:</p>
                                        {pendingUpdate.targetGroupNames && pendingUpdate.targetGroupNames.length > 0 ? (
                                            <ul className="list-disc list-inside text-sm space-y-1">
                                                {pendingUpdate.targetGroupNames.map((name, idx) => (
                                                    <li key={idx} className="text-base-content/80">{name}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-base-content/50 italic">No other buildings in group</p>
                                        )}
                                    </div>
                                    <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                                        <p className="text-xs text-warning">
                                            <Icon icon={alertTriangleIcon} className="w-3 h-3 inline mr-1" />
                                            This building will no longer share BOQ/VO data with the group.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Link to Group Confirmation */}
                            {pendingUpdate.type === "linkToGroup" && (
                                <div className="space-y-3">
                                    <p className="text-sm text-base-content/80">
                                        Are you sure you want to link <span className="font-semibold">{pendingUpdate.building.name}</span> to this group?
                                    </p>
                                    <div className="bg-base-200 rounded-lg p-4 space-y-2">
                                        <p className="text-xs text-base-content/60 mb-2">Buildings in the target group:</p>
                                        {pendingUpdate.targetGroupNames && pendingUpdate.targetGroupNames.length > 0 ? (
                                            <ul className="list-disc list-inside text-sm space-y-1">
                                                {pendingUpdate.targetGroupNames.map((name, idx) => (
                                                    <li key={idx} className="text-base-content/80">{name}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-base-content/50 italic">No buildings in target group</p>
                                        )}
                                    </div>
                                    <div className="bg-info/10 border border-info/30 rounded-lg p-3">
                                        <p className="text-xs text-info">
                                            <Icon icon={linkIcon} className="w-3 h-3 inline mr-1" />
                                            This building will share BOQ/VO data with the group members.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Dialog Actions */}
                        <div className="flex justify-end gap-2 p-5 border-t border-base-300 bg-base-50">
                            <button
                                onClick={cancelPendingUpdate}
                                disabled={isUpdating}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmUpdate}
                                disabled={isUpdating}
                                className={`btn ${
                                    pendingUpdate.type === "makeUnique" ? "btn-warning" :
                                    pendingUpdate.type === "linkToGroup" ? "btn-info" :
                                    "btn-primary"
                                }`}
                            >
                                {isUpdating ? (
                                    <>
                                        <Icon icon={loaderIcon} className="w-4 h-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon={checkIcon} className="w-4 h-4" />
                                        Yes, Confirm
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(BuildingSelectionDialog);
