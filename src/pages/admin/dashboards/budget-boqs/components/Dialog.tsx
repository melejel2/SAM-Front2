import React, { useState, useEffect } from "react";

import CloseBtn from "@/components/CloseBtn";
import { Button, Select, SelectOption } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";

import BOQStep from "./BOQ";
import useBudgetBOQsDialog from "./use-budget-boq-dialog";

interface BudgetBOQDialogProps {
    handleHide: () => void;
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    dialogType: "Add" | "Edit" | "Delete" | "Preview" | "Select";
    selectedProject: any;
    onSuccess: () => void;
}

const BudgetBOQDialog: React.FC<BudgetBOQDialogProps> = ({ 
    handleHide, 
    dialogRef, 
    dialogType, 
    selectedProject,
    onSuccess 
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { 
        setSelectedTrade, 
        buildings,
        setBuildings,
        projectData,
        setProjectData,
        saveProject,
        getBuildingsList,
        openProject
    } = useBudgetBOQsDialog();

    const { toaster } = useToast();

    const handleSubmit = async () => {
        setIsLoading(true);

        try {
            if (projectData) {
                const result = await saveProject(projectData);
                if (result.success) {
                    toaster.success("Project saved successfully!");
                    onSuccess();
                    handleClose();
                } else {
                    toaster.error(result.message || "Failed to save project");
                }
            } else {
                toaster.success("Done...");
                onSuccess();
                handleClose();
            }
        } catch (error) {
            toaster.error("An error occurred while saving");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedTrade(null);
        setBuildings([]);
        setProjectData(null);
        handleHide();
    };

    useEffect(() => {
        if (selectedProject && (dialogType === "Edit" || dialogType === "Select")) {
            // Clear existing state first
            setProjectData(null);
            setBuildings([]);
            setSelectedTrade(null);
            
            // Load project data and buildings with error handling
            const loadProjectData = async () => {
                try {
                    // Load buildings first
                    await getBuildingsList(selectedProject.id);
                    
                    // Then load project data
                    const data = await openProject(selectedProject.id);
                    if (data) {
                        setProjectData(data);
                    } else {
                        // Create basic project structure if none exists
                        setProjectData({
                            id: selectedProject.id,
                            currencyId: 1,
                            buildings: []
                        });
                    }
                } catch (error) {
                    console.error("Error loading project data:", error);
                    // Create basic project structure as fallback
                    setProjectData({
                        id: selectedProject.id,
                        currencyId: 1,
                        buildings: []
                    });
                    toaster.warning("Project data loaded with basic structure. You can still create buildings and import BOQ data.");
                }
            };
            
            loadProjectData();
        } else {
            // Clear state when not editing
            setProjectData(null);
            setBuildings([]);
            setSelectedTrade(null);
        }
    }, [selectedProject, dialogType, getBuildingsList, openProject, setProjectData, setBuildings, setSelectedTrade, toaster]);

    return (
        <>
            <dialog ref={dialogRef as React.Ref<HTMLDialogElement>} className="modal" aria-modal="true">
                <div className="modal-box relative h-[85%] max-w-[85%]">
                    <div className="h-full">
                        <div className="flex h-full flex-col space-y-4">
                            <div>
                                <span className="font-semibold">Budget BOQ</span>
                                <CloseBtn handleClose={handleClose} />
                            </div>
                            <div className="h-full">
                                <BOQStep 
                                    dialogType={dialogType} 
                                    buildings={buildings} 
                                    selectedProject={selectedProject}
                                    projectData={projectData}
                                    setProjectData={setProjectData}
                                />
                            </div>
                            <div>
                                <Button
                                    className="w-full"
                                    size="sm"
                                    type="button"
                                    disabled={isLoading}
                                    loading={isLoading}
                                    onClick={handleSubmit}>
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </dialog>
        </>
    );
};

export default BudgetBOQDialog;
