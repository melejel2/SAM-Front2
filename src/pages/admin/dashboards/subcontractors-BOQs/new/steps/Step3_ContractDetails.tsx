import React, { useState, useEffect } from "react";
import { useWizardContext } from "../context/WizardContext";
import { ContractDetailsForm } from "../../shared/components/ContractDetailsForm";

export const Step3_ContractDetails: React.FC = () => {
    const { formData, setFormData, contracts, currencies, projects } = useWizardContext();
    const [contractNumberSuffix, setContractNumberSuffix] = useState<string>("");

    // Get the selected project to access its acronym from database
    const selectedProject = projects.find(p => p.id === formData.projectId);
    const projectAcronym = selectedProject?.acronym || "XXX";

    // Generate the full contract number
    const generateContractNumber = (suffix: string) => {
        // If suffix is empty, use "000" for the final contract number
        const finalSuffix = suffix.trim() === '' ? '000' : suffix.padStart(3, '0');
        return `CS-${projectAcronym}-${finalSuffix}`;
    };

    // Update contract number when suffix or project changes
    useEffect(() => {
        const newContractNumber = generateContractNumber(contractNumberSuffix);
        // Only update if the generated number is different from current one
        if (formData.contractNumber !== newContractNumber) {
            setFormData({ contractNumber: newContractNumber });
        }
    }, [contractNumberSuffix, projectAcronym, formData.contractNumber, setFormData]);

    // Initialize contract number suffix from existing contract number (only run once on mount or project change)
    useEffect(() => {
        if (formData.contractNumber && formData.contractNumber.startsWith(`CS-${projectAcronym}-`)) {
            const suffix = formData.contractNumber.split('-')[2];
            if (suffix && /^\d{3}$/.test(suffix) && suffix !== contractNumberSuffix) {
                setContractNumberSuffix(suffix);
            }
        }
        // Only run when projectAcronym changes, not when contractNumber changes
    }, [projectAcronym]);

    const handleFieldChange = (field: string, value: any) => {
        setFormData({ [field]: value });
    };

    const handleContractNumberSuffixChange = (newSuffix: string) => {
        // Only allow numeric input
        const numericValue = newSuffix.replace(/\D/g, '');
        setContractNumberSuffix(numericValue);
    };

    return (
        <ContractDetailsForm
            formData={formData}
            contracts={contracts}
            currencies={currencies}
            projectAcronym={projectAcronym}
            contractNumberSuffix={contractNumberSuffix}
            contractNumberPlaceholder="000"
            onContractNumberSuffixChange={handleContractNumberSuffixChange}
            onFieldChange={handleFieldChange}
        />
    );
};
