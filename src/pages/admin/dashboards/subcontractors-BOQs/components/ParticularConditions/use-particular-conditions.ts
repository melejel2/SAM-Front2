interface InputField {
    name: string;
    label: string;
    type: string;
    value?: any;
    required?: boolean;
    options?: any[];
    prefix?: string;
}

const useParticularConditions = () => {
    const inputFields: InputField[] = [
        {
            name: "contractType",
            label: "Type of contract",
            type: "select",
            required: true,
            options: ["Lump Sum", "Remeasured", "Cost Plus"],
        },
        {
            name: "contractNumber",
            label: "Contract Number",
            type: "text",
            required: true,
        },
        {
            name: "contractDate",
            label: "Contract Date (mm/dd/yyyy)",
            type: "date",
            required: true,
        },
        {
            name: "completionDate",
            label: "Completion Date (mm/dd/yyyy)",
            type: "date",
            required: true,
        },
        {
            name: "retention",
            label: "Retention (%)",
            type: "number",
        },
        {
            name: "latePenalty",
            label: "Late penalty (‰)",
            type: "number",
        },
        {
            name: "maxPenalty",
            label: "Maximum penalty (%)",
            type: "number",
        },
        {
            name: "vat",
            label: "VAT (%)",
            type: "number",
        },
        {
            name: "contract",
            label: "Contract",
            type: "select",
            required: true,
            options: ["Mesure Lab - NLOGO (Supply Apply)", "Mesure N (Supply Apply)", "Remesure - New (Supply Apply)"],
        },
        {
            name: "paymentsTerms",
            label: "Payments Terms",
            type: "select",
            required: true,
            options: [
                "Effet / Trade Bill",
                "Chèque ou effet / Check or Bill",
                "Chèque ou virement / Check or Transfer",
                "Paiement en Espèces / Cash Payment",
            ],
        },
        {
            name: "maintenancePeriod",
            label: "Maintenance period (months)",
            type: "number",
        },
        {
            name: "warranty",
            label: "Warranty (months)",
            type: "number",
        },
        {
            name: "performanceBond",
            label: "Performance bond (%)",
            type: "number",
        },
        {
            name: "ipcPaymentDue",
            label: "IPC Payment due in (Days)",
            type: "number",
        },
        {
            name: "maxDeductions",
            label: "Max. deductions over progress (%)",
            type: "number",
        },
        {
            name: "contractNumber",
            label: "Number",
            type: "text",
            prefix: "CS-RIV-",
        },
        {
            name: "advancePayment",
            label: "Advance payment (%)",
            type: "number",
        },
        {
            name: "advanceRecovery",
            label: "Advance recovery per progress (%)",
            type: "number",
        },
        {
            name: "maxMaterialSupply",
            label: "Max. Material Supply (%)",
            type: "number",
        },
        {
            name: "prorata",
            label: "Prorata (%)",
            type: "number",
        },
        {
            name: "managementFees",
            label: "Management fees (%)",
            type: "number",
        },
        {
            name: "executionPlans",
            label: "Plans Execution (%)",
            type: "number",
        },
    ];

    return {
        inputFields,
    };
};

export default useParticularConditions;
