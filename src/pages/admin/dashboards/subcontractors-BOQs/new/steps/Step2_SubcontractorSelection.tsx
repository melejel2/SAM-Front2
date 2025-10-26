import React from "react";
import { useWizardContext } from "../context/WizardContext";
import SAMTable from "@/components/Table";

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

    const handleSubcontractorSelect = (subcontractor: Subcontractor) => {
        setFormData({ subcontractorId: subcontractor.id });
    };

    return (
        <>
            <SAMTable
                columns={{ 
                    name: "Company Name", 
                    siegeSocial: "Address", 
                    commerceNumber: "Commerce Number",
                    representedBy: "Represented By"
                }}
                tableData={subcontractors}
                title="Subcontractors"
                loading={loading}
                onSuccess={() => {}}
                onRowSelect={handleSubcontractorSelect}
                select={false}
                actions={false}
                addBtn={false}
                selectedRowId={formData.subcontractorId}
            />
        </>
    );
};