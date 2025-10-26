import React, { useEffect, useState } from "react";

import SAMTable from "@/components/Table";

import ProjectChangeWarningDialog from "../../shared/components/ProjectChangeWarningDialog";
import { useEditWizardContext } from "../context/EditWizardContext";

interface Project {
    id: number;
    code: string;
    name?: string;
    acronym?: string;
    city?: string;
}

export const EditStep1_ProjectSelection: React.FC = () => {
    const { formData, setFormData, projects, loadingProjects, originalContractData } = useEditWizardContext();
    const [showProjectChangeWarning, setShowProjectChangeWarning] = useState(false);
    const [pendingProject, setPendingProject] = useState<Project | null>(null);

    // ✅ FIX: Track the displayed selection separately from form data
    // This prevents visual flickering when user cancels
    const [displayedProjectId, setDisplayedProjectId] = useState<number | null>(null);
    const [tableKey, setTableKey] = useState(0); // Force table re-render

    // Initialize displayed selection from form data
    React.useEffect(() => {
        if (formData.projectId && displayedProjectId === null) {
            setDisplayedProjectId(formData.projectId);
        }
    }, [formData.projectId, displayedProjectId]);

    // Check if contract has existing data that would be lost
    const hasExistingData = React.useMemo(() => {
        if (!originalContractData) return false;

        const hasBuildings = originalContractData.buildings && originalContractData.buildings.length > 0;
        const hasBoqItems = originalContractData.buildings?.some(
            (building) => building.boqsContract && building.boqsContract.length > 0,
        );

        return hasBuildings || hasBoqItems;
    }, [originalContractData]);

    // ✅ NUCLEAR SOLUTION: Force complete table re-render to reset selection
    const handleProjectSelect = (project: Project) => {
        // If this is an existing contract and project is changing, show warning
        if (originalContractData && originalContractData.projectId && originalContractData.projectId !== project.id) {
            setPendingProject(project);
            setShowProjectChangeWarning(true);

            // ✅ NUCLEAR OPTION: Force complete table re-render
            // This destroys the table's internal state and recreates it with correct selection
            setDisplayedProjectId(formData.projectId);
            setTableKey((prev) => prev + 1); // This forces React to completely re-render the table

            return;
        }

        // Safe project change (new contract or same project)
        applyProjectChange(project);
    };

    const applyProjectChange = (project: Project) => {
        setFormData({
            projectId: project.id,
            selectedTrades: [], // Reset trade selection
            buildingTradeMap: [], // Reset building-trade mappings
            boqData: [], // Clear BOQ data
            // Reset other dependent fields
            contractDate: formData.contractDate, // Keep basic contract info
            completionDate: formData.completionDate,
            subcontractorAdvancePayee: formData.subcontractorAdvancePayee,
            recoverAdvance: formData.recoverAdvance,
        });

        // ✅ UPDATE: Now update the displayed selection
        setDisplayedProjectId(project.id);

        // Buildings will be loaded automatically by the useEffect in EditWizardContext
    };

    const handleConfirmProjectChange = () => {
        if (pendingProject) {
            applyProjectChange(pendingProject);
        }
        setShowProjectChangeWarning(false);
        setPendingProject(null);
    };

    const handleCancelProjectChange = () => {
        // ✅ FIX: Ensure selection stays on original project
        setShowProjectChangeWarning(false);
        setPendingProject(null);

        // ✅ ENSURE: Table shows original selection
        setDisplayedProjectId(formData.projectId);
        setTableKey((prev) => prev + 1); // Force re-render to be absolutely sure
    };

    // Get project names for dialog
    const currentProjectName = originalContractData?.projectId
        ? projects.find((p) => p.id === originalContractData.projectId)?.name || "Unknown Project"
        : "New Project";
    const newProjectName = pendingProject?.name || "Unknown Project";

    return (
        <>
            <SAMTable
                key={tableKey} // ✅ FORCE re-render when key changes
                columns={{
                    code: "Code",
                    name: "Name",
                    acronym: "Acronym",
                    city: "City",
                }}
                tableData={projects}
                title="Projects"
                loading={loadingProjects}
                onSuccess={() => {}}
                onRowSelect={handleProjectSelect}
                select={false}
                actions={false}
                addBtn={false}
                selectedRowId={displayedProjectId}
            />

            {/* Project Change Warning Dialog */}
            <ProjectChangeWarningDialog
                isOpen={showProjectChangeWarning}
                currentProjectName={currentProjectName}
                newProjectName={newProjectName}
                onConfirm={handleConfirmProjectChange}
                onCancel={handleCancelProjectChange}
                hasExistingData={hasExistingData}
            />
        </>
    );
};
