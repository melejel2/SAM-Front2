import React, { useMemo, useCallback } from "react";
import { useWizardContext } from "../context/WizardContext";
import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";

interface Subcontractor {
    id: number;
    name: string | null;
    siegeSocial?: string | null;
    commerceRegistrar?: string | null;
    commerceNumber?: string | null;
    taxNumber?: string | null;
    representedBy?: string | null;
    qualityRepresentive?: string | null;
    subcontractorTel?: string | null;
}

export const Step2_SubcontractorSelection: React.FC = () => {
    const { formData, setFormData, subcontractors, loading } = useWizardContext();

    const handleSubcontractorSelect = useCallback((subcontractor: Subcontractor) => {
        setFormData({ subcontractorId: subcontractor.id });
    }, [setFormData]);

    const columns = useMemo((): SpreadsheetColumn<Subcontractor>[] => [
        { key: "name", label: "Company Name", width: 220, sortable: true, filterable: true },
        { key: "siegeSocial", label: "Address", width: 250, sortable: true, filterable: true },
        { key: "commerceNumber", label: "Commerce Number", width: 160, sortable: true, filterable: true },
        { key: "representedBy", label: "Represented By", width: 180, sortable: true, filterable: true },
    ], []);

    const rowClassName = useCallback((row: Subcontractor) => {
        return row.id === formData.subcontractorId ? "bg-primary/10" : undefined;
    }, [formData.subcontractorId]);

    return (
        <Spreadsheet<Subcontractor>
            data={subcontractors}
            columns={columns}
            mode="view"
            loading={loading}
            emptyMessage="No subcontractors found"
            persistKey="contract-wizard-subcontractors"
            rowHeight={40}
            onRowClick={handleSubcontractorSelect}
            getRowId={(row) => row.id}
            rowClassName={rowClassName}
            scrollToRowId={formData.subcontractorId}
            allowKeyboardNavigation
            allowColumnResize
            allowSorting
            allowFilters
        />
    );
};
