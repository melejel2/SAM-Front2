import { useState, useRef } from "react";
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
}

const BOQStep: React.FC<BOQStepProps> = ({ 
    dialogType, 
    buildings, 
    selectedProject, 
    projectData, 
    setProjectData 
}) => {
    const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
    const [showCreateBuildings, setShowCreateBuildings] = useState(false);
    const [buildingCount, setBuildingCount] = useState(1);
    const [buildingName, setBuildingName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        createBuildings,
        previewBuildings,
        uploadBoq,
        getBoqPreview,
        clearBoq
    } = useBudgetBOQsDialog();
    
    const { toaster } = useToast();

    const handleClearBoq = async () => {
        if (!selectedProject || !selectedBuilding) {
            toaster.error("Please select a building first");
            return;
        }

        const result = await clearBoq({
            scope: "Building",
            projectId: selectedProject.id,
            buildingId: selectedBuilding.id
        });

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
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-2">
                <Button 
                    type="button" 
                    size="sm"
                    onClick={handleClearBoq}
                    disabled={!selectedProject || !selectedBuilding}
                >
                    Clear BOQ
                </Button>
                <div className="flex items-center space-x-2">
                    <Select
                        className="w-full border-none bg-transparent focus:ring-0 focus:outline-none"
                        onChange={(e) => {
                            const building = buildings.find(b => b.id === parseInt(e.target.value));
                            setSelectedBuilding(building);
                        }}
                        name="building"
                        value={selectedBuilding?.id || ""}
                        onTouchStart={(e) => {
                            if (e.touches.length > 1) {
                                e.preventDefault();
                            }
                        }}>
                        <>
                            <SelectOption value="" disabled hidden>
                                {buildings.length === 0 ? "No buildings found - Create buildings first" : "Select Building"}
                            </SelectOption>

                            {(buildings ?? []).map((building) => (
                                <SelectOption key={building.id} value={building.id} className="bg-base-100">
                                    {building.name}
                                </SelectOption>
                            ))}
                        </>
                    </Select>
                    <Button 
                        type="button" 
                        size="sm"
                        onClick={() => setShowCreateBuildings(true)}
                        disabled={!selectedProject}
                    >
                        Create buildings
                    </Button>
                    <Button 
                        type="button" 
                        size="sm"
                        onClick={handleImportBoq}
                        disabled={!selectedProject}
                    >
                        Import BOQ
                    </Button>
                </div>
            </div>
            
            {showCreateBuildings && (
                <div className="border-b p-2 space-y-2">
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
                        <Button type="button" size="sm" onClick={handleCreateBuildings}>
                            Create
                        </Button>
                        <Button type="button" size="sm" onClick={() => setShowCreateBuildings(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
            
            <div className="h-[92%] p-2">
                <BOQTable 
                    selectedBuilding={selectedBuilding}
                    projectData={projectData}
                    setProjectData={setProjectData}
                />
            </div>
            
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default BOQStep;
