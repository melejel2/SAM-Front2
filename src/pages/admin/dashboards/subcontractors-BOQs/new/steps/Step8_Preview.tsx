import React from "react";
import { useWizardContext } from "../context/WizardContext";
import PreviewStep from "../../components/Preview";

export const Step8_Preview: React.FC = () => {
    const { formData, projects, subcontractors } = useWizardContext();
    
    // Get selected project and subcontractor for preview
    const selectedProject = projects.find(p => p.id === formData.projectId);
    const selectedSubcontractor = subcontractors.find(s => s.id === formData.subcontractorId);

    return (
        <div className="h-full flex flex-col">
            <PreviewStep 
                formData={formData}
                selectedProject={selectedProject}
                selectedSubcontractor={selectedSubcontractor}
            />
        </div>
    );
};