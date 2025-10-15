import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Button, Select, SelectOption } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";
import buildingIcon from "@iconify/icons-lucide/building";
import chevronDownIcon from "@iconify/icons-lucide/chevron-down";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";
import saveIcon from "@iconify/icons-lucide/save";

import BOQTable from "./components/boqTable";
import VODialog from "../VOManagement/VODialog";
import BuildingSelectionDialog from "../BuildingSelectionDialog";
import { Building } from "@/types/variation-order";

interface Currency {
    id: number;
    name: string;
    currencies: string;
}

interface BOQStepProps {
    dialogType: "Add" | "Edit" | "Delete" | "Preview" | "Terminate" | "Select";
    buildings: Building[];
    selectedProject: any;
    projectData: any;
    setProjectData: (data: any) => void;
    onBack?: () => void;
    onSave?: () => void;
    saving?: boolean;
    hasUnsavedChanges?: boolean;
    createBuildings: (buildingData: any) => Promise<any>;
    getBoqPreview: (importData: any) => Promise<any>;
    clearBoq: (clearData: any) => Promise<any>;
    currencies: Currency[];
    onCurrencyChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onDataRefresh: () => void;
    columns: Record<string, string>;
    processBoqData: (data: any) => any;
    selectedTrade: any;
    setSelectedTrade: (trade: any) => void;
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
    hasUnsavedChanges,
    createBuildings,
    getBoqPreview,
    clearBoq,
    currencies,
    onCurrencyChange,
    onDataRefresh,
    columns,
    processBoqData,
    selectedTrade,
    setSelectedTrade,
}) => {
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [clearScope, setClearScope] = useState<"trade" | "building" | "all">("trade");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showVODialog, setShowVODialog] = useState(false);
    const [currentSheetForVO, setCurrentSheetForVO] = useState<any>(null);
    const [showBuildingDialog, setShowBuildingDialog] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                if (!selectedTrade) {
                    toaster.error("Please select a trade/sheet first.");
                    return;
                }
                clearData.scope = 0; // Sheet
                clearData.buildingId = selectedBuilding.id;
                clearData.sheetId = (selectedTrade as any).buildingSheetId;
                break;
            case "building":
                clearData.scope = 1; // Building
                clearData.buildingId = selectedBuilding.id;
                break;
            case "all":
                clearData.scope = 2; // Project
                break;
        }

        const result = await clearBoq(clearData);

        if (result.success) {
            toaster.success("BOQ cleared successfully");
            onDataRefresh();
        } else {
            toaster.error(result.message || "Failed to clear BOQ");
        }
    };

    const handleCreateBuildings = async (buildingData: any) => {
        const result = await createBuildings(buildingData);

        if (result.success) {
            toaster.success("Buildings created successfully");
            onDataRefresh(); // Refresh project data to get updated buildings list
        } else {
            toaster.error(result.message || "Failed to create buildings");
        }

        return result;
    };

    const handleImportBoq = () => {
        if (!selectedProject || !selectedBuilding) {
            toaster.error("Please select a project and a building first");
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!selectedProject || !selectedBuilding) {
            toaster.error("Please select a project and a building first");
            return;
        }

        const buildingId = selectedBuilding.id;

        try {
            const buildingSaveModels = await getBoqPreview({
                projectId: selectedProject.id,
                buildingId: buildingId,
                excelFile: file
            });

            if (buildingSaveModels && Array.isArray(buildingSaveModels) && buildingSaveModels.length > 0) {
                setProjectData((prevData: any) => {
                    if (!prevData) return null;

                    const updatedBuildings = [...prevData.buildings];

                    buildingSaveModels.forEach((buildingModel: any) => {
                        const existingBuildingIndex = updatedBuildings.findIndex(b => b.id === buildingModel.id);

                        if (existingBuildingIndex !== -1) {
                            // MERGE sheets instead of replacing entire building
                            const existingBuilding = updatedBuildings[existingBuildingIndex];
                            const existingSheets = existingBuilding.boqSheets || [];
                            const importedSheets = buildingModel.boqSheets || [];

                            // Create a map of existing sheets for quick lookup
                            const existingSheetsMap = new Map(
                                existingSheets.map((sheet: any) => [sheet.id || sheet.name, sheet])
                            );

                            // Merge: Update existing sheets or add new ones from import
                            importedSheets.forEach((importedSheet: any) => {
                                const key = importedSheet.id || importedSheet.name;
                                existingSheetsMap.set(key, importedSheet);
                            });

                            // Convert map back to array
                            const mergedSheets = Array.from(existingSheetsMap.values());

                            // Update building with merged sheets, keep all other properties
                            updatedBuildings[existingBuildingIndex] = {
                                ...existingBuilding,
                                ...buildingModel,
                                boqSheets: mergedSheets
                            };
                        } else {
                            // Add new building
                            updatedBuildings.push(buildingModel);
                        }
                    });

                    return { ...prevData, buildings: updatedBuildings };
                });

                toaster.success(`BOQ preview loaded successfully for ${buildingSaveModels.length} building(s)!`);
            } else if (buildingSaveModels) {
                // Handle case where import is valid but results in no sheets
                toaster.info("The imported file did not contain any valid BOQ sheets. The existing data remains unchanged.");
            } else {
                // Handle case where the API fails to return a model
                toaster.error("Failed to get BOQ preview.");
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
        <div style={{ height: '100%', width: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Top row with Back, Clear, and action buttons */}
            <div className="flex justify-between items-center mb-1" style={{ flexShrink: 0 }}>
                <div className="flex items-center gap-3">
                    {/* Back Button */}
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="btn btn-sm bg-base-100 border border-base-300 text-base-content hover:bg-base-200 flex items-center gap-2"
                        >
                            <Icon icon={arrowLeftIcon} className="w-4 h-4" />
                            <span>Back</span>
                        </button>
                    )}

                    {/* Building Selector Button */}
                    <button
                        type="button"
                        onClick={() => setShowBuildingDialog(true)}
                        disabled={!buildings || buildings.length === 0}
                        className="btn btn-sm bg-base-100 border border-base-300 text-base-content hover:bg-base-200 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Icon icon={buildingIcon} className="w-4 h-4" />
                        <span className="font-medium">{selectedBuilding?.name || "Select Building"}</span>
                        <Icon icon={chevronDownIcon} className="w-3 h-3 opacity-60" />
                    </button>

                    <Select
                        className="w-48"
                        value={projectData?.currencyId || ''}
                        onChange={onCurrencyChange}
                    >
                        <SelectOption value="" disabled>
                            Select Currency
                        </SelectOption>
                        {(currencies || []).map((currency) => (
                            <SelectOption key={currency.id} value={currency.id}>
                                {currency.currencies}
                            </SelectOption>
                        ))}
                    </Select>

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
                    {/* View VOs Button */}
                    <button
                        type="button" 
                        onClick={() => {
                            // Capture the current sheet info when button is clicked
                            const building = projectData?.buildings?.find((b: any) => b.id === selectedBuilding?.id);
                            let sheet = null;
                            
                            if ((selectedTrade as any)?.buildingSheetId) {
                                sheet = building?.boqSheets?.find((s: any) => s.id === (selectedTrade as any).buildingSheetId);
                            } else if (selectedTrade?.name) {
                                sheet = building?.boqSheets?.find((s: any) => s.name === selectedTrade.name);
                            }
                            
                            // If no sheet found by the above methods, try to find the first sheet with data
                            if (!sheet && building?.boqSheets) {
                                sheet = building.boqSheets.find((s: any) => s.boqItems && s.boqItems.length > 0);
                            }
                            
                            setCurrentSheetForVO({
                                sheet,
                                trade: selectedTrade,
                                sheetId: sheet?.id || (selectedTrade as any)?.buildingSheetId || selectedTrade?.id
                            });
                            setShowVODialog(true);
                        }}
                        disabled={!selectedProject || !selectedBuilding}
                        className="btn btn-sm bg-base-100 border border-base-300 text-base-content hover:bg-base-200 disabled:opacity-50"
                    >
                        View VOs
                    </button>
                    
                    {/* Import BOQ Button */}
                    <button
                        type="button" 
                        onClick={handleImportBoq}
                        disabled={!selectedProject || !selectedBuilding}
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
                            <Icon icon={saveIcon} className="w-4 h-4" />
                            <span>{saving ? "Saving..." : "Save"}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
                <BOQTable
                    selectedBuilding={selectedBuilding}
                    projectData={projectData}
                    setProjectData={setProjectData}
                    selectedProject={selectedProject}
                    columns={columns}
                    processBoqData={processBoqData}
                    selectedTrade={selectedTrade}
                    setSelectedTrade={setSelectedTrade}
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
                <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
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
                <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
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
            
            {/* VO Dialog */}
            {selectedProject && selectedBuilding && currentSheetForVO && (
                <VODialog
                    isOpen={showVODialog}
                    onClose={() => {
                        setShowVODialog(false);
                        setCurrentSheetForVO(null);
                    }}
                    projectId={selectedProject.id}
                    buildingId={selectedBuilding.id}
                    buildingName={selectedBuilding.name}
                    tradeName={currentSheetForVO.sheet?.name || currentSheetForVO.trade?.name || "Unknown"}
                    sheetId={currentSheetForVO.sheetId}
                    projectLevel={selectedBuilding?.projectLevel || 0}
                />
            )}

            {/* Building Selection Dialog */}
            <BuildingSelectionDialog
                isOpen={showBuildingDialog}
                onClose={() => setShowBuildingDialog(false)}
                onBuildingSelect={(building) => {
                    // Ensure building has required properties for the Building type
                    const buildingWithLevels: Building = {
                        ...building,
                        projectLevel: building.projectLevel ?? 0,
                        subContractorLevel: building.subContractorLevel ?? 0
                    };
                    setSelectedBuilding(buildingWithLevels);
                    setShowBuildingDialog(false);
                }}
                buildings={projectData?.buildings || buildings || []}
                currentBuilding={selectedBuilding}
                projectName={selectedProject?.name}
                projectId={selectedProject?.id}
                onCreateBuildings={handleCreateBuildings}
            />
        </div>
    );
};

export default BOQStep;
