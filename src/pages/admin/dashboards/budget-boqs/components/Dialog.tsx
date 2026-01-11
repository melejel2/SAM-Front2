import React, { useEffect, useState } from "react";

import CloseBtn from "@/components/CloseBtn";
import { Button, Select, SelectOption } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";
import useCurrencies from "@/pages/admin/adminTools/currencies/use-currencies";

import BOQStep from "./BOQ";
import useBudgetBOQsDialog from "./use-budget-boq-dialog";

interface BudgetBOQDialogProps {
    handleHide: () => void;
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    dialogType: "Add" | "Edit" | "Delete" | "Preview" | "Terminate" | "Select" | "Archive";
    selectedProject: any;
    onSuccess: () => void;
    onCreate?: (formData: any) => void;
    onUpdate?: (formData: any) => void;
    onDelete?: () => void;
    onArchive?: () => void;
}

const BudgetBOQDialog: React.FC<BudgetBOQDialogProps> = ({
    handleHide,
    dialogRef,
    dialogType,
    selectedProject,
    onSuccess,
    onCreate,
    onUpdate,
    onDelete,
    onArchive,
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
        openProject,
        createBuildings,
        updateBuilding,
        getBoqPreview,
        clearBoq,
        selectedTrade,
        columns,
        processBoqData,
    } = useBudgetBOQsDialog();

    const { tableData: currencies, getCurrencies } = useCurrencies();
    const { toaster } = useToast();

    useEffect(() => {
        getCurrencies();
    }, []);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            if (dialogType === "Add" && onCreate) {
                await onCreate(projectData);
            } else if (dialogType === "Delete" && onDelete) {
                await onDelete();
                handleClose();
            } else if (dialogType === "Archive" && onArchive) {
                await onArchive();
                handleClose();
            } else if (projectData) {
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

    const handleDataRefresh = async () => {
        if (selectedProject) {
            await getBuildingsList(selectedProject.id);
            const data = await openProject(selectedProject.id);
            if (data) {
                setProjectData(data);
            }
        }
    };

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const currencyId = parseInt(e.target.value);
        setProjectData((prev: any) => ({
            ...prev,
            currencyId,
        }));
    };

    useEffect(() => {
        if (dialogType === "Add") {
            setProjectData({
                id: 0,
                currencyId: 0,
                buildings: [],
                name: "",
                code: "",
                acronym: "",
                city: "",
            });
        } else if (selectedProject && (dialogType === "Edit" || dialogType === "Select")) {
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
                            buildings: [],
                        });
                    }
                } catch (error) {
                    console.error("Error loading project data:", error);
                    // Create basic project structure as fallback
                    setProjectData({
                        id: selectedProject.id,
                        currencyId: 1,
                        buildings: [],
                    });
                    toaster.warning(
                        "Project data loaded with basic structure. You can still create buildings and import BOQ data.",
                    );
                }
            };

            loadProjectData();
        } else {
            // Clear state when not editing
            setProjectData(null);
            setBuildings([]);
            setSelectedTrade(null);
        }
    }, [selectedProject, dialogType]);

    // Render confirmation dialog for Delete and Archive actions
    if (dialogType === "Delete" || dialogType === "Archive") {
        const isArchive = dialogType === "Archive";
        return (
            <dialog ref={dialogRef as React.Ref<HTMLDialogElement>} className="modal" aria-modal="true">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">
                        {isArchive ? "Archive Project" : "Delete Project"}
                    </h3>
                    <p className="py-4">
                        {isArchive
                            ? `Are you sure you want to archive project "${selectedProject?.name}"? This will move the project to the archived database.`
                            : `Are you sure you want to delete project "${selectedProject?.name}"? This action cannot be undone.`}
                    </p>
                    <div className="modal-action">
                        <Button
                            size="sm"
                            color={isArchive ? "warning" : "error"}
                            type="button"
                            disabled={isLoading}
                            loading={isLoading}
                            onClick={handleSubmit}>
                            {isArchive ? "Archive" : "Delete"}
                        </Button>
                        <Button size="sm" color="ghost" type="button" disabled={isLoading} onClick={handleClose}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </dialog>
        );
    }

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
                                    createBuildings={createBuildings}
                                    updateBuilding={updateBuilding}
                                    getBoqPreview={getBoqPreview}
                                    clearBoq={clearBoq}
                                    selectedTrade={selectedTrade}
                                    setSelectedTrade={setSelectedTrade}
                                    columns={columns}
                                    processBoqData={processBoqData}
                                    currencies={currencies || []}
                                    onCurrencyChange={handleCurrencyChange}
                                    onDataRefresh={handleDataRefresh}
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
