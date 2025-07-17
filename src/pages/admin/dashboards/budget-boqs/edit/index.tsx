import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";
import { Loader } from "@/components/Loader";

import BOQStep from "../components/BOQ";
import useBudgetBOQsDialog from "../components/use-budget-boq-dialog";
import useBudgetBOQs from "../use-budget-boqs";

const BudgetBOQEdit = () => {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();
    const { toaster } = useToast();
    
    const [projectData, setProjectData] = useState<any>(null);
    const [originalProjectData, setOriginalProjectData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [projectsLoaded, setProjectsLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    
    const { tableData: projects, getProjectsList } = useBudgetBOQs();
    const { 
        getBuildingsList, 
        buildings, 
        openProject, 
        saveProject 
    } = useBudgetBOQsDialog();
    
    const selectedProject = projects?.find(p => p.id === parseInt(projectId || "0"));
    
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
            } else {
                // Project not found, stop loading
                setLoading(false);
            }
        }
    }, [projectsLoaded, projectId, selectedProject]);
    
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
    
    const handleSave = async () => {
        if (!projectData) return;
        
        setSaving(true);
        try {
            const result = await saveProject(projectData);
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
            />
            
            {/* Unsaved Changes Dialog */}
            {showUnsavedDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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