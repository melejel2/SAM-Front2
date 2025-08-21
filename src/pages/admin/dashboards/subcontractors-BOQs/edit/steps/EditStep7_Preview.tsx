import React from "react";
import { useEditWizardContext } from "../context/EditWizardContext";
import PreviewStep from "../../components/Preview";

export const EditStep7_Preview: React.FC = () => {
    const { formData, projects, subcontractors } = useEditWizardContext();
    
    // Get selected project and subcontractor for preview
    const selectedProject = projects.find(p => p.id === formData.projectId);
    const selectedSubcontractor = subcontractors.find(s => s.id === formData.subcontractorId);

    return (
        <PreviewStep 
            formData={formData}
            selectedProject={selectedProject}
            selectedSubcontractor={selectedSubcontractor}
            contractId={formData.id} // Pass the contract ID for edit mode
        />
    );
};