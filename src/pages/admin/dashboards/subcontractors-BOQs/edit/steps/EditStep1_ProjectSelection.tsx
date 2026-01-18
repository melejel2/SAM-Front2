import React, { useState, useMemo, useCallback } from "react";

import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";

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

    // Track the displayed selection separately from form data for pending changes
    // This prevents visual flickering when user cancels a project change warning
    const [pendingDisplayId, setPendingDisplayId] = useState<number | null>(null);

    // The actual displayed project ID - use pending if we're showing a warning, otherwise use formData
    const displayedProjectId = pendingDisplayId ?? formData.projectId;

    // Check if contract has existing data that would be lost
    const hasExistingData = useMemo(() => {
        if (!originalContractData) return false;

        const hasBuildings = originalContractData.buildings && originalContractData.buildings.length > 0;
        const hasBoqItems = originalContractData.buildings?.some(
            (building: { boqsContract?: any[] }) => building.boqsContract && building.boqsContract.length > 0,
        );

        return hasBuildings || hasBoqItems;
    }, [originalContractData]);

    const applyProjectChange = useCallback((project: Project) => {
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

        // Clear pending display ID - the displayed ID will now come from formData.projectId
        setPendingDisplayId(null);

        // Buildings will be loaded automatically by the useEffect in EditWizardContext
    }, [setFormData, formData.contractDate, formData.completionDate, formData.subcontractorAdvancePayee, formData.recoverAdvance]);

    const handleProjectSelect = useCallback((project: Project) => {
        // If this is an existing contract and project is changing, show warning
        if (originalContractData && originalContractData.projectId && originalContractData.projectId !== project.id) {
            setPendingProject(project);
            setPendingDisplayId(project.id); // Show the clicked row as selected while warning is shown
            setShowProjectChangeWarning(true);
            return;
        }

        // Safe project change (new contract or same project)
        applyProjectChange(project);
    }, [originalContractData, applyProjectChange]);

    const handleConfirmProjectChange = useCallback(() => {
        if (pendingProject) {
            applyProjectChange(pendingProject);
        }
        setShowProjectChangeWarning(false);
        setPendingProject(null);
    }, [pendingProject, applyProjectChange]);

    const handleCancelProjectChange = useCallback(() => {
        // Ensure selection stays on original project
        setShowProjectChangeWarning(false);
        setPendingProject(null);

        // Clear pending display ID - reverts to showing formData.projectId
        setPendingDisplayId(null);
    }, []);

    // Get project names for dialog
    const currentProjectName = originalContractData?.projectId
        ? projects.find((p: Project) => p.id === originalContractData.projectId)?.name || "Unknown Project"
        : "New Project";
    const newProjectName = pendingProject?.name || "Unknown Project";

    const columns = useMemo((): SpreadsheetColumn<Project>[] => [
        { key: "code", label: "Code", width: 120, sortable: true, filterable: true },
        { key: "name", label: "Name", width: 250, sortable: true, filterable: true },
        { key: "acronym", label: "Acronym", width: 120, sortable: true, filterable: true },
        { key: "city", label: "City", width: 150, sortable: true, filterable: true },
    ], []);

    const rowClassName = useCallback((row: Project) => {
        return row.id === displayedProjectId ? "bg-primary/10" : undefined;
    }, [displayedProjectId]);

    return (
        <>
            <Spreadsheet<Project>
                data={projects}
                columns={columns}
                mode="view"
                loading={loadingProjects}
                emptyMessage="No projects found"
                persistKey="contract-edit-wizard-projects"
                rowHeight={40}
                onRowClick={handleProjectSelect}
                getRowId={(row) => row.id}
                rowClassName={rowClassName}
                scrollToRowId={displayedProjectId}
                allowKeyboardNavigation
                allowColumnResize
                allowSorting
                allowFilters
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
