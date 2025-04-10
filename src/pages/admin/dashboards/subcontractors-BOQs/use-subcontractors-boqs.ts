const useSubcontractorsBOQs = () => {
    const columns = {
        contract_nb: "Contract Number",
        subcontractor: "Subcontractor",
        trade: "Trade",
        contract_amount: "Contract Amount",
        status: "Status",
    };
    const tableData = [
        {
            id: "1",
            contract_nb: "Contract Number 1",
            subcontractor: "Subcontractor 1",
            trade: "Trade 1",
            contract_amount: "Contract Amount 1",
            status: "Status 1",
        },
        {
            id: "2",
            contract_nb: "Contract Number 2",
            subcontractor: "Subcontractor 2",
            trade: "Trade 2",
            contract_amount: "Contract Amount 2",
            status: "Status 2",
        },
        {
            id: "3",
            contract_nb: "Contract Number 3",
            subcontractor: "Subcontractor 3",
            trade: "Trade 3",
            contract_amount: "Contract Amount 3",
            status: "Status 3",
        },
    ];

    const inputFields = [
        {
            name: "contract_nb",
            label: "Contract Number",
            type: "text",
            required: true,
        },
        {
            name: "subcontractor",
            label: "Subcontractor",
            type: "text",
            required: true,
        },
        {
            name: "Trade",
            label: "Trade",
            type: "text",
            required: true,
        },
        {
            name: "Contract Amount",
            label: "Contract Amount",
            type: "Contract Amount",
            required: true,
        },
        {
            name: "Status",
            label: "Status",
            type: "text",
            required: true,
        },
        {
            name: "password",
            label: "Password",
            type: "text",
            required: true,
        },

        {
            name: "role",
            label: "Role",
            type: "select",
            required: true,
            options: [
                "Regional Operations Manager",
                "General Manager",
                "Operations Manager",
                "Contracts Manager",
                "Accountant",
                "Admin",
            ],
        },
    ];

    return {
        columns,
        tableData,
        inputFields,
    };
};

export default useSubcontractorsBOQs;
