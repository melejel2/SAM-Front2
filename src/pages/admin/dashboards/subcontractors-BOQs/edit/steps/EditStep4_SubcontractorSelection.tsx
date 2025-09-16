import React from "react";
import { Icon } from "@iconify/react";
import { useEditWizardContext } from "../context/EditWizardContext";
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

export const EditStep4_SubcontractorSelection: React.FC = () => {
    const { formData, setFormData, subcontractors, loading } = useEditWizardContext();
    
    // Calculate selectedSubcontractor directly from current state
    const selectedSubcontractor = React.useMemo(() => {
        if (subcontractors.length > 0 && formData.subcontractorId) {
            return subcontractors.find(s => s.id === formData.subcontractorId) || null;
        }
        return null;
    }, [subcontractors, formData.subcontractorId]);

    // Remove forced re-rendering - it was breaking prop passing

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