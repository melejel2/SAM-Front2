import React, { useState, useEffect } from "react";
import { useEditWizardContext } from "../context/EditWizardContext";
import { ContractDetailsForm } from "../../shared/components/ContractDetailsForm";


export const EditStep3_ContractDetails: React.FC = () => {
    const { formData, setFormData, contracts, currencies, projects } = useEditWizardContext();
    const [contractNumberSuffix, setContractNumberSuffix] = useState<string>("001");

    // Get the selected project to access its acronym from database
    const selectedProject = projects.find(p => p.id === formData.projectId);
    const projectAcronym = selectedProject?.acronym || "XXX";

    // Generate the full contract number
    const generateContractNumber = (suffix: string) => {
        return `CS-${projectAcronym}-${suffix.padStart(3, '0')}`;
    };

    // Initialize contract number suffix from existing contract number (run once on mount)
    useEffect(() => {
        if (formData.contractNumber && formData.contractNumber.startsWith(`CS-${projectAcronym}-`)) {
            const suffix = formData.contractNumber.split('-')[2];
            if (suffix && /^\d{3}$/.test(suffix)) {
                setContractNumberSuffix(suffix);
            }
        }
        // Remove automatic contract number generation - only generate when user changes suffix
    }, []); // Run only once on mount
    
    // Update contract number when suffix changes (handle manually)
    const updateContractNumber = (newSuffix: string) => {
        if (projectAcronym !== "XXX") {
            const newContractNumber = generateContractNumber(newSuffix);
            // Only update if it's empty or follows the pattern (not a custom contract number)
            if (!formData.contractNumber || formData.contractNumber.startsWith(`CS-${projectAcronym}-`)) {
                setFormData({ contractNumber: newContractNumber });
            }
        }
    };

    const handleFieldChange = (field: string, value: any) => {
        setFormData({ [field]: value });
    };

    const handleContractNumberSuffixChange = (newSuffix: string) => {
        // Only allow numbers, max 3 digits
        const cleanSuffix = newSuffix.replace(/\D/g, '').substring(0, 3);
        const finalSuffix = cleanSuffix || "001";
        setContractNumberSuffix(finalSuffix);
        // Update contract number immediately when suffix changes
        updateContractNumber(finalSuffix);
    };

    return (
        <ContractDetailsForm
            formData={formData}
            contracts={contracts}
            currencies={currencies}
            projectAcronym={projectAcronym}
            contractNumberSuffix={contractNumberSuffix}
            contractNumberPlaceholder="001"
            contractNumberMaxLength={3}
            onContractNumberSuffixChange={handleContractNumberSuffixChange}
            onFieldChange={handleFieldChange}
        />
    );
};
