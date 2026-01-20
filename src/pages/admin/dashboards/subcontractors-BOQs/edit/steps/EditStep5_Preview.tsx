import React, { useCallback } from "react";
import { useEditWizardContext } from "../context/EditWizardContext";
import PreviewStep from "../../components/Preview";

export const EditStep5_Preview: React.FC = () => {
    const { formData, projects, subcontractors, setPreviewLoading } = useEditWizardContext();

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
                contractId={formData.id} // Pass the contract ID for edit mode
                onLoadingChange={handleLoadingChange}
            />
        </div>
    );
};
