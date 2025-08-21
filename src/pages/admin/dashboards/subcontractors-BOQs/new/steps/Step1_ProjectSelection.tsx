import React from "react";
import { useWizardContext } from "../context/WizardContext";
import SAMTable from "@/components/Table";

interface Project {
    id: number;
    code: string;
    name?: string;
    acronym?: string;
    city?: string;
}

export const Step1_ProjectSelection: React.FC = () => {
    const { formData, setFormData, projects, loadingProjects } = useWizardContext();
    
    // Find selected project based on formData.projectId
    const selectedProject = React.useMemo(() => {
        if (projects.length > 0 && formData.projectId) {
            return projects.find(p => p.id === formData.projectId) || null;
        }
        return null;
    }, [projects, formData.projectId]);

    const handleProjectSelect = (project: Project) => {
        setFormData({ 
            projectId: project.id, 
            buildingIds: [] // Reset building selection when project changes
        });
        // Buildings will be loaded automatically by the useEffect in WizardContext
    };

    return (
        <>
            <SAMTable
                columns={{ 
                    code: "Code",
                    name: "Name", 
                    acronym: "Acronym",
                    city: "City"
                }}
                tableData={projects}
                title="Projects"
                loading={loadingProjects}
                onSuccess={() => {}}
                onRowSelect={handleProjectSelect}
                select={false}
                actions={false}
                addBtn={false}
                selectedRowId={formData.projectId}
            />
        </>
    );
};