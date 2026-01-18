import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";
import { Loader } from "@/components/Loader";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { useBlockNavigation, useNavigationBlocker } from "@/contexts/navigation-blocker";

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
    const { tryNavigate } = useNavigationBlocker();
    
    // Get actual project ID from navigation state (for API calls) or try to parse if it's numeric
    const projectId = location.state?.projectId || 
        (!isNaN(Number(projectIdentifier)) ? projectIdentifier : null);
    
    const [projectData, setProjectData] = useState<any>(null);
    const [originalProjectData, setOriginalProjectData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [projectsLoaded, setProjectsLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const { tableData: projects, getProjectsList } = useBudgetBOQs();
    const { tableData: currencies, getCurrencies } = useCurrencies();
    const {
        getBuildingsList,
        buildings,
        openProject,
        saveProject,
        createBuildings,
        updateBuilding,
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
        } catch (error) {
            console.error("Error loading project data:", error);
            toaster.error("Failed to load project data");
        } finally {
            setLoading(false);
        }
    };

    // Memoize unsaved changes check to prevent unnecessary re-renders
    const hasUnsavedChanges = useMemo(() => {
        if (!projectData || !originalProjectData) return false;
        return JSON.stringify(projectData) !== JSON.stringify(originalProjectData);
    }, [projectData, originalProjectData]);

    // Save function - defined before useBlockNavigation so it can be used in callbacks
    const performSave = useCallback(async () => {
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
            } else if (hasUnsavedChanges) {
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
    }, [projectData, originalProjectData, hasUnsavedChanges, saveProject, toaster]);

    const debouncedSave = useDebouncedCallback(performSave, 500);

    const handleSave = useCallback(async () => {
        await debouncedSave();
    }, [debouncedSave]);

    // Register navigation blocking with callbacks for save/discard
    useBlockNavigation(
        hasUnsavedChanges,
        {
            onSave: async () => {
                await performSave();
            },
            onDiscard: () => {
                // Reset to original data when discarding
                setProjectData(originalProjectData);
            }
        },
        "You have unsaved changes. What would you like to do?"
    );

    // Also warn on browser refresh/close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = "";
                return "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const handleBack = useCallback(() => {
        tryNavigate("/dashboard/budget-BOQs");
    }, [tryNavigate]);

    const handleCurrencyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCurrencyId = parseInt(e.target.value);
        if (projectData) {
            setProjectData({ ...projectData, currencyId: newCurrencyId });
        }
    }, [projectData]);

    if (loading || !projectsLoaded) {
        return (
            <Loader
                icon="table-2"
                subtitle="Loading: Budget BOQ"
                description="Preparing budget data..."
            />
        );
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
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <BOQStep
                    dialogType="Edit"
                    buildings={buildings}
                    selectedProject={selectedProject}
                    projectData={projectData}
                    setProjectData={setProjectData}
                    onBack={handleBack}
                    onSave={handleSave}
                    saving={saving}
                    hasUnsavedChanges={hasUnsavedChanges}
                    createBuildings={createBuildings}
                    updateBuilding={updateBuilding}
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
        </div>
    );
};

export default BudgetBOQEdit;
