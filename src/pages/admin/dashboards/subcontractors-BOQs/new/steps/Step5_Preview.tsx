import React, { useCallback } from "react";
import { useWizardContext } from "../context/WizardContext";
import PreviewStep from "../../components/Preview";

export const Step5_Preview: React.FC = () => {
    const { formData, projects, subcontractors, setPreviewLoading } = useWizardContext();

    // Get selected project and subcontractor for preview
    const selectedProject = projects.find(p => p.id === formData.projectId);
    const selectedSubcontractor = subcontractors.find(s => s.id === formData.subcontractorId);

    // Callback to sync preview loading state to context
    const handleLoadingChange = useCallback((isLoading: boolean) => {
        setPreviewLoading(isLoading);
    }, [setPreviewLoading]);

    return (
        <div className="h-full flex flex-col">
            <PreviewStep
                formData={formData}
                selectedProject={selectedProject}
                selectedSubcontractor={selectedSubcontractor}
                onLoadingChange={handleLoadingChange}
            />
        </div>
    );
};
