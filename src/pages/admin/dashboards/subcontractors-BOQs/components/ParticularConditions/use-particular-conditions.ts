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
            name: "holdWarranty",
            label: "Retention (%)",
            type: "text",
        },
        {
            name: "latePenalties",
            label: "Late Penalty (‰)",
            type: "text",
        },
        {
            name: "latePenalityCeiling",
            label: "Max Penalty (%)",
            type: "text",
        },
        {
            name: "purchaseIncrease",
            label: "Interest (%)",
            type: "text",
        },
        {
            name: "holdBack",
            label: "Hold Back (%)",
            type: "text",
        },
        {
            name: "paymentsTerm",
            label: "Payment Terms",
            type: "text",
        },
        {
            name: "mintenancePeriod",
            label: "Maintenance (months)",
            type: "text",
        },
        {
            name: "workWarranty",
            label: "Warranty (months)",
            type: "text",
        },
        {
            name: "termination",
            label: "Performance Bond (%)",
            type: "text",
        },
        {
            name: "daysNumber",
            label: "Payment Due (days)",
            type: "text",
        },
        {
            name: "progress",
            label: "Max Progress (%)",
            type: "text",
        },
        {
            name: "subcontractorAdvancePayee",
            label: "Advance Payment Eligible (%)",
            type: "number",
        },
        {
            name: "recoverAdvance",
            label: "Advance recovery per progress (%)",
            type: "text",
        },
        {
            name: "materialSupply",
            label: "Material Supply (%)",
            type: "number",
        },
        {
            name: "prorataAccount",
            label: "Prorata (%)",
            type: "text",
        },
        {
            name: "managementFees",
            label: "Management Fees (%)",
            type: "text",
        },
        {
            name: "plansExecution",
            label: "Plans Execution (%)",
            type: "text",
        },
    ];

    return {
        inputFields,
    };
};

export default useParticularConditions;
