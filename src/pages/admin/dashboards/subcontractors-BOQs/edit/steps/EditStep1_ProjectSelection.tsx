import React, { useState, useEffect } from "react";
import { useEditWizardContext } from "../context/EditWizardContext";
import SAMTable from "@/components/Table";

interface Project {
    id: number;
    code: string;
    name?: string;
    acronym?: string;
    city?: string;
}

export const EditStep1_ProjectSelection: React.FC = () => {
    const { formData, setFormData, projects, loadingProjects } = useEditWizardContext();
    
    // Calculate selectedProject directly from current state (no local state needed)
    const selectedProject = React.useMemo(() => {
        if (projects.length > 0 && formData.projectId) {
            return projects.find(p => p.id === formData.projectId) || null;
        }
        return null;
    }, [projects, formData.projectId]);
    
    // Remove forced re-rendering - it was breaking prop passing

    const handleProjectSelect = (project: Project) => {
        setFormData({ 
            projectId: project.id, 
            buildingIds: [] // Reset building selection when project changes
        });
        // Buildings will be loaded automatically by the useEffect in EditWizardContext
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