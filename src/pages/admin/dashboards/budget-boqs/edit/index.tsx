import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";
import { Loader } from "@/components/Loader";

import BOQStep from "../components/BOQ";
import useBudgetBOQsDialog from "../components/use-budget-boq-dialog";
import useBudgetBOQs from "../use-budget-boqs";
import useCurrencies from "@/pages/admin/adminTools/currencies/use-currencies";

interface Building {
    id: number;
    [key: string]: any;
}

interface Currency {
    id: number;
    name: string;
    currencies: string;
}

const BudgetBOQEdit = () => {
    const navigate = useNavigate();
    const { projectIdentifier } = useParams<{ projectIdentifier: string }>();
    const location = useLocation();
    const { toaster } = useToast();
    
    // Get actual project ID from navigation state (for API calls) or try to parse if it's numeric
    const projectId = location.state?.projectId || 
        (!isNaN(Number(projectIdentifier)) ? projectIdentifier : null);
    
    const [projectData, setProjectData] = useState<any>(null);
    const [originalProjectData, setOriginalProjectData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [projectsLoaded, setProjectsLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    
    const { tableData: projects, getProjectsList } = useBudgetBOQs();
    const { tableData: currencies, getCurrencies } = useCurrencies();
    const {
        getBuildingsList,
        buildings,
        openProject,
        saveProject,
        createBuildings,
        getBoqPreview,
        clearBoq,
        selectedTrade,
        setSelectedTrade,
        columns,
        processBoqData,
    } = useBudgetBOQsDialog();

    const selectedProject = projects?.find((p) => p.id === parseInt(projectId || "0"));

    useEffect(() => {
        getCurrencies();
    }, []);

    useEffect(() => {
        // Load projects list first if not already loaded
        if (!projectsLoaded && (!projects || projects.length === 0)) {
            getProjectsList().finally(() => {
                setProjectsLoaded(true);
            });
        } else if (projects && projects.length > 0) {
            setProjectsLoaded(true);
        }
    }, [projects, projectsLoaded]);

    useEffect(() => {
        if (projectsLoaded && projectId) {
            if (selectedProject) {
                loadProjectData();
            } else if (projectIdentifier) {
                // If we have a project code but no ID, show error and redirect
                toaster.error("Project not found. Please navigate from the projects list.");
                navigate("/dashboard/budget-BOQs");
                return;
            } else {
                // Project not found, stop loading
                setLoading(false);
            }
        }
    }, [projectsLoaded, projectId, projectIdentifier, selectedProject]);

    const loadProjectData = async () => {
        if (!selectedProject) return;

        setLoading(true);
        try {
            // Load buildings list
            await getBuildingsList(selectedProject.id);

            // Load project data
            const data = await openProject(selectedProject.id);
            setProjectData(data);
            setOriginalProjectData(JSON.parse(JSON.stringify(data))); // Deep copy

            console.log("BudgetBOQEdit - Loaded project data:", data);
        } catch (error) {
            console.error("Error loading project data:", error);
            toaster.error("Failed to load project data");
        } finally {
            setLoading(false);
        }
    };

    const hasUnsavedChanges = () => {
        if (!projectData || !originalProjectData) return false;
        return JSON.stringify(projectData) !== JSON.stringify(originalProjectData);
    };

    const handleBack = () => {
        if (hasUnsavedChanges()) {
            setShowUnsavedDialog(true);
        } else {
            navigate("/dashboard/budget-BOQs");
        }
    };

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCurrencyId = parseInt(e.target.value);
        if (projectData) {
            setProjectData({ ...projectData, currencyId: newCurrencyId });
        }
    };

    const handleSave = async () => {
        if (!projectData || !originalProjectData) return;

        setSaving(true);
        try {
            // Find changed buildings by comparing with original data
            const changedBuildings = projectData.buildings.filter((building: Building) => {
                const originalBuilding = originalProjectData.buildings.find((b: Building) => b.id === building.id);
                // If building is new or has changed, include it.
                return !originalBuilding || JSON.stringify(building) !== JSON.stringify(originalBuilding);
            });

            let payload;
            if (changedBuildings.length > 0) {
                // If there are changed buildings, send only them.
                // This assumes the backend will correctly merge/update.
                payload = {
                    ...projectData,
                    buildings: changedBuildings
                };
            } else if (hasUnsavedChanges()) {
                // This handles cases where project-level properties might have changed, but no specific building.
                // Or if a building was deleted.
                // In this case, we send the full projectData as before.
                payload = projectData;
            } else {
                // No changes, no need to save.
                toaster.info("No changes to save.");
                setSaving(false);
                return;
            }

            const result = await saveProject(payload);
            if (result.success) {
                toaster.success("Project saved successfully");
                setOriginalProjectData(JSON.parse(JSON.stringify(projectData))); // Update original data
            } else {
                toaster.error(result.message || "Failed to save project");
            }
        } catch (error) {
            console.error("Error saving project:", error);
            toaster.error("Failed to save project");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAndExit = async () => {
        await handleSave();
        navigate("/dashboard/budget-BOQs");
    };

    const handleExitWithoutSaving = () => {
        navigate("/dashboard/budget-BOQs");
    };

    const handleCancelExit = () => {
        setShowUnsavedDialog(false);
    };

    if (loading || !projectsLoaded) {
        return <Loader />;
    }

    if (!selectedProject) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
                    <Button onClick={() => navigate("/dashboard/budget-BOQs")}>
                        Back to Budget BOQs
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <BOQStep
                dialogType="Edit"
                buildings={buildings}
                selectedProject={selectedProject}
                projectData={projectData}
                setProjectData={setProjectData}
                onBack={handleBack}
                onSave={handleSave}
                saving={saving}
                hasUnsavedChanges={hasUnsavedChanges()}
                createBuildings={createBuildings}
                getBoqPreview={getBoqPreview}
                clearBoq={clearBoq}
                selectedTrade={selectedTrade}
                setSelectedTrade={setSelectedTrade}
                columns={columns}
                processBoqData={processBoqData}
                currencies={currencies as Currency[]}
                onCurrencyChange={handleCurrencyChange}
                onDataRefresh={loadProjectData}
            />
            
            {/* Unsaved Changes Dialog */}
            {showUnsavedDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4">Unsaved Changes</h3>
                        <p className="text-base-content/70 mb-6">
                            You have unsaved changes. What would you like to do?
                        </p>
                        <div className="flex space-x-2">
                            <Button
                                onClick={handleSaveAndExit}
                                className="flex-1"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save & Exit"}
                            </Button>
                            <Button
                                onClick={handleExitWithoutSaving}
                                variant="outline"
                                className="flex-1"
                            >
                                Exit without saving
                            </Button>
                            <Button
                                onClick={handleCancelExit}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetBOQEdit;