import React, { useMemo, useCallback } from "react";
import { useWizardContext } from "../context/WizardContext";
import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";

interface Project {
    id: number;
    code: string;
    name?: string;
    acronym?: string;
    city?: string;
}

export const Step1_ProjectSelection: React.FC = () => {
    const { formData, setFormData, projects, loadingProjects } = useWizardContext();

    const handleProjectSelect = useCallback((project: Project) => {
        setFormData({
            projectId: project.id,
            selectedTrades: [],
            buildingTradeMap: {},
            boqData: [] // Clear stale BOQ items
        });
        // Buildings will be loaded automatically by the useEffect in WizardContext
    }, [setFormData]);

    const columns = useMemo((): SpreadsheetColumn<Project>[] => [
        { key: "code", label: "Code", width: 120, sortable: true, filterable: true },
        { key: "name", label: "Name", width: 250, sortable: true, filterable: true },
        { key: "acronym", label: "Acronym", width: 120, sortable: true, filterable: true },
        { key: "city", label: "City", width: 150, sortable: true, filterable: true },
    ], []);

    const rowClassName = useCallback((row: Project) => {
        return row.id === formData.projectId ? "bg-primary/10" : undefined;
    }, [formData.projectId]);

    return (
        <Spreadsheet<Project>
            data={projects}
            columns={columns}
            mode="view"
            loading={loadingProjects}
            emptyMessage="No projects found"
            persistKey="contract-wizard-projects"
            rowHeight={40}
            onRowClick={handleProjectSelect}
            getRowId={(row) => row.id}
            rowClassName={rowClassName}
            scrollToRowId={formData.projectId}
            allowKeyboardNavigation
            allowColumnResize
            allowSorting
            allowFilters
        />
    );
};
