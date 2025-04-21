const useContractsDatabase = () => {
    const contractsColumns = {
        contractNb: "Contract Number",
        project: "Project",
        subcontractor: "Subcontractor",
        trade: "Trade",
        dateOfSignature: "Date of Signature",
        endDate: "End Date",
        contractAmount: "Contract Amount",
        totalAmount: "Total Amount",
        status: "Status",
    };

    const vosColumns = {
        contractNb: "Contract Number",
        voNumber: "VO Number",
        subcontractor: "Subcontractor",
        trade: "Trade",
        type: "Type",
        date: "Date",
        totalAmount: "Total Amount",
        status: "Status",
    };

    const terminatedColumns = {
        contractNb: "Contract Number",
        project: "Project",
        subcontractor: "Subcontractor",
        trade: "Trade",
        dateOfSignature: "Date of Signature",
        endDate: "End Date",
        contractAmount: "Contract Amount",
        status: "Status",
    };

    const tableData = [
        {
            id: "1",
            contractNb: "Contract Number 1",
            project: "Last Name 1",
            subcontractor: "subcontractor 1",
            trade: "Username 1",
            dateOfSignature: "dateOfSignature 1",
            endDate: "endDate 1",
            contractAmount: "endDate 1",
            totalAmount: "endDate 1",
            status: "endDate 1",
        },
        {
            id: "2",
            contractNb: "First Name 2",
            project: "Last Name 2",
            subcontractor: "subcontractor 2",
            trade: "Username 2",
            dateOfSignature: "dateOfSignature 2",
            endDate: "endDate 2",
            contractAmount: "endDate 2",
            totalAmount: "endDate 2",
            status: "endDate 2",
        },
        {
            id: "3",
            contractNb: "First Name 3",
            project: "Last Name 3",
            subcontractor: "subcontractor 3",
            trade: "Username 3",
            dateOfSignature: "dateOfSignature 3",
            endDate: "endDate 3",
            contractAmount: "endDate 3",
            totalAmount: "endDate 3",
            status: "endDate 3",
        },
    ];

    const inputFields = [
        {
            name: "contractNb",
            label: "First Name",
            type: "text",
            required: true,
        },
        {
            name: "project",
            label: "Last Name",
            type: "text",
            required: true,
        },
        {
            name: "subcontractor",
            label: "subcontractor",
            type: "text",
            required: true,
        },
        {
            name: "email",
            label: "Email",
            type: "email",
            required: true,
        },
        {
            name: "trade",
            label: "Username",
            type: "text",
            required: true,
        },
        {
            name: "dateOfSignature",
            label: "dateOfSignature",
            type: "text",
            required: true,
        },

        {
            name: "endDate",
            label: "endDate",
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
        contractsColumns,
        vosColumns,
        terminatedColumns,
        tableData,
        inputFields,
    };
};

export default useContractsDatabase;
