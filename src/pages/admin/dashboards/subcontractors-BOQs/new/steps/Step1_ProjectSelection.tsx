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

    const handleProjectSelect = (project: Project) => {
        setFormData({
            projectId: project.id,
            selectedTrades: [],
            buildingTradeMap: {},
            boqData: [] // Clear stale BOQ items
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