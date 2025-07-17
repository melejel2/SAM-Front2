import { useState, useRef, useEffect } from "react";
import { Button, Select, SelectOption } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";

import BOQTable from "./components/boqTable";
import useBudgetBOQsDialog from "../use-budget-boq-dialog";

interface BOQStepProps {
    dialogType: "Add" | "Edit" | "Delete" | "Preview" | "Select";
    buildings: any[];
    selectedProject: any;
    projectData: any;
    setProjectData: (data: any) => void;
    onBack?: () => void;
    onSave?: () => void;
    saving?: boolean;
    hasUnsavedChanges?: boolean;
}

const BOQStep: React.FC<BOQStepProps> = ({ 
    dialogType, 
    buildings, 
    selectedProject, 
    projectData, 
    setProjectData,
    onBack,
    onSave,
    saving,
    hasUnsavedChanges
}) => {
    const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
    const [showCreateBuildings, setShowCreateBuildings] = useState(false);
    const [buildingCount, setBuildingCount] = useState(1);
    const [buildingName, setBuildingName] = useState("");
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [clearScope, setClearScope] = useState<"trade" | "building" | "all">("trade");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        createBuildings,
        previewBuildings,
        uploadBoq,
        getBoqPreview,
        clearBoq
    } = useBudgetBOQsDialog();
    
    const { toaster } = useToast();

    // Auto-select first building when buildings are loaded
    useEffect(() => {
        if (buildings && buildings.length > 0 && !selectedBuilding) {
            setSelectedBuilding(buildings[0]);
        }
    }, [buildings, selectedBuilding]);

    // Auto-select first building from project data when available
    useEffect(() => {
        if (projectData && projectData.buildings && projectData.buildings.length > 0) {
            // Check if current selected building exists in project data
            const currentBuildingInProject = projectData.buildings.find((b: any) => b.id === selectedBuilding?.id);
            
            if (!currentBuildingInProject) {
                // If current building is not in project data, select the first one from project data
                setSelectedBuilding(projectData.buildings[0]);
            }
        }
    }, [projectData, selectedBuilding]);

    const handleClearBoq = () => {
        if (!selectedProject || !selectedBuilding) {
            toaster.error("Please select a building first");
            return;
        }
        setShowClearDialog(true);
    };

    const handleClearConfirm = () => {
        setShowClearDialog(false);
        setShowConfirmDialog(true);
    };

    const handleFinalClear = async () => {
        setShowConfirmDialog(false);
        
        if (!selectedProject || !selectedBuilding) {
            toaster.error("Please select a building first");
            return;
        }

        let clearData: any = {
            projectId: selectedProject.id,
        };

        switch (clearScope) {
            case "trade":
                clearData.scope = "Sheet";
                clearData.buildingId = selectedBuilding.id;
                // We need to get the current selected trade/sheet ID
                break;
            case "building":
                clearData.scope = "Building";
                clearData.buildingId = selectedBuilding.id;
                break;
            case "all":
                clearData.scope = "Project";
                break;
        }

        const result = await clearBoq(clearData);

        if (result.success) {
            toaster.success("BOQ cleared successfully");
        } else {
            toaster.error(result.message || "Failed to clear BOQ");
        }
    };

    const handleCreateBuildings = async () => {
        if (!selectedProject || !buildingName || buildingCount < 1) {
            toaster.error("Please fill in all fields");
            return;
        }

        const result = await createBuildings({
            projectId: selectedProject.id,
            name: buildingName,
            buildingNumber: buildingCount
        });

        if (result.success) {
            toaster.success("Buildings created successfully");
            setShowCreateBuildings(false);
            setBuildingName("");
            setBuildingCount(1);
        } else {
            toaster.error(result.message || "Failed to create buildings");
        }
    };

    const handleImportBoq = () => {
        if (!selectedProject) {
            toaster.error("Please select a project first");
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!selectedProject) {
            toaster.error("Please select a project first");
            return;
        }

        const buildingId = selectedBuilding?.id || 0;
        const buildingName = selectedBuilding?.name || "New Building";

        try {
            // First get preview
            const previewData = await getBoqPreview({
                projectId: selectedProject.id,
                buildingId: buildingId,
                name: buildingName,
                excelFile: file
            });

            if (previewData) {
                // For now, directly upload - in a real app you might want to show preview first
                const result = await uploadBoq({
                    projectId: selectedProject.id,
                    buildingId: buildingId,
                    name: buildingName,
                    excelFile: file
                });

                if (result.success) {
                    toaster.success("BOQ imported successfully");
                } else {
                    toaster.error(result.message || "Failed to import BOQ");
                }
            }
        } catch (error) {
            toaster.error("Error importing BOQ file");
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div>
            {/* Top row with Back, Clear, and action buttons */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    {/* Back Button */}
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="btn btn-sm bg-base-100 border border-base-300 text-base-content hover:bg-base-200 flex items-center gap-2"
                        >
                            <span className="iconify lucide--arrow-left size-4" />
                            <span>Back</span>
                        </button>
                    )}
                    
                    {/* Clear BOQ Button */}
                    <button
                        type="button" 
                        onClick={handleClearBoq}
                        disabled={!selectedProject || !selectedBuilding}
                        className="btn btn-sm bg-red-500 border border-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                    >
                        Clear BOQ
                    </button>
                </div>
                
                {/* Right side buttons */}
                <div className="flex items-center space-x-2">
                    {/* Create Buildings Button */}
                    <button
                        type="button" 
                        onClick={() => setShowCreateBuildings(true)}
                        disabled={!selectedProject}
                        className="btn btn-sm bg-base-100 border border-base-300 text-base-content hover:bg-base-200 disabled:opacity-50"
                    >
                        Create buildings
                    </button>
                    
                    {/* Import BOQ Button */}
                    <button
                        type="button" 
                        onClick={handleImportBoq}
                        disabled={!selectedProject}
                        className="btn btn-sm bg-base-100 border border-base-300 text-base-content hover:bg-base-200 disabled:opacity-50"
                    >
                        Import BOQ
                    </button>
                    
                    {hasUnsavedChanges && (
                        <span className="text-sm text-warning">
                            • Unsaved changes
                        </span>
                    )}
                    
                    {/* Save Button */}
                    {onSave && (
                        <button
                            onClick={onSave}
                            disabled={saving || !hasUnsavedChanges}
                            className="btn btn-sm bg-base-100 border border-base-300 text-base-content hover:bg-base-200 flex items-center gap-2 disabled:opacity-50"
                        >
                            <span className="iconify lucide--save size-4" />
                            <span>{saving ? "Saving..." : "Save"}</span>
                        </button>
                    )}
                </div>
            </div>
            
            {/* Create Buildings Form */}
            {showCreateBuildings && (
                <div className="mb-4 p-4 bg-base-100 border border-base-300 rounded">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            placeholder="Building name"
                            value={buildingName}
                            onChange={(e) => setBuildingName(e.target.value)}
                            className="input input-sm input-bordered flex-1"
                        />
                        <input
                            type="number"
                            placeholder="Count"
                            value={buildingCount}
                            onChange={(e) => setBuildingCount(parseInt(e.target.value) || 1)}
                            min="1"
                            className="input input-sm input-bordered w-20"
                        />
                        <button type="button" onClick={handleCreateBuildings} className="btn btn-sm bg-base-100 border border-base-300 text-base-content hover:bg-base-200">
                            Create
                        </button>
                        <button type="button" onClick={() => setShowCreateBuildings(false)} className="btn btn-sm bg-base-100 border border-base-300 text-base-content hover:bg-base-200">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            
            {/* Table */}
            <div>
                <BOQTable 
                    selectedBuilding={selectedBuilding}
                    projectData={projectData}
                    setProjectData={setProjectData}
                    buildings={buildings}
                    selectedProject={selectedProject}
                    onBuildingChange={setSelectedBuilding}
                />
            </div>
            
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
            />
            
            {/* Clear BOQ Scope Dialog */}
            {showClearDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4">Clear BOQ</h3>
                        <p className="text-base-content/70 mb-4">
                            What would you like to clear?
                        </p>
                        <div className="space-y-2 mb-6">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="clearScope"
                                    value="trade"
                                    checked={clearScope === "trade"}
                                    onChange={(e) => setClearScope(e.target.value as "trade" | "building" | "all")}
                                    className="radio radio-primary"
                                />
                                <span>Current Trade/Sheet only</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="clearScope"
                                    value="building"
                                    checked={clearScope === "building"}
                                    onChange={(e) => setClearScope(e.target.value as "trade" | "building" | "all")}
                                    className="radio radio-primary"
                                />
                                <span>Current Building ({selectedBuilding?.name})</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="clearScope"
                                    value="all"
                                    checked={clearScope === "all"}
                                    onChange={(e) => setClearScope(e.target.value as "trade" | "building" | "all")}
                                    className="radio radio-primary"
                                />
                                <span>All Buildings in Project</span>
                            </label>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleClearConfirm}
                                className="btn btn-sm bg-red-500 border border-red-500 text-white hover:bg-red-600 flex-1"
                            >
                                Continue
                            </button>
                            <button
                                onClick={() => setShowClearDialog(false)}
                                className="btn btn-sm bg-base-100 border border-base-300 text-base-content hover:bg-base-200 flex-1"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Clear BOQ Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4 text-red-600">⚠️ Confirm Clear</h3>
                        <p className="text-base-content/70 mb-4">
                            This action is <strong>irreversible</strong>. Are you sure you want to clear the BOQ data?
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                            <p className="text-sm text-red-800">
                                You are about to clear:{" "}
                                <strong>
                                    {clearScope === "trade" ? "Current Trade/Sheet" : 
                                     clearScope === "building" ? `Building: ${selectedBuilding?.name}` : 
                                     "All Buildings in Project"}
                                </strong>
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleFinalClear}
                                className="btn btn-sm bg-red-500 border border-red-500 text-white hover:bg-red-600 flex-1"
                            >
                                Yes, Clear
                            </button>
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                className="btn btn-sm bg-base-100 border border-base-300 text-base-content hover:bg-base-200 flex-1"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BOQStep;
