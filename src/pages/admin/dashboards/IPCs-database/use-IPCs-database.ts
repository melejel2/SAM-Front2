const useIPCsDatabase = () => {
    const columns = {
        contract: "Contract",
        ipcRef: "IPC Ref",
        subcontractor: "Subcontractor",
        trade: "Trade",
        amountHT: "Amount HT",
        totalAmount: "Total Amount",
        status: "Status",
        type: "Type",
        paidTTC: "Paid TTC",
    };
    const tableData = [
        {
            id: "1",
            contract: "Contract 1",
            ipcRef: "1",
            subcontractor: "Subcontractor 1",
            trade: "Trade 1",
            amountHT: "1",
            totalAmount: "1",
            status: "Editable",
            type: "Provisoire / Interim",
            paidTTC: "0",
        },
        {
            id: "2",
            contract: "Contract 2",
            ipcRef: "2",
            subcontractor: "Subcontractor 2",
            trade: "Trade 2",
            amountHT: "2",
            totalAmount: "2",
            status: "Pending Approval",
            type: "Final / Final",
            paidTTC: "0",
        },
        {
            id: "3",
            contract: "Contract 3",
            ipcRef: "3",
            subcontractor: "Subcontractor 3",
            trade: "Trade 3",
            amountHT: "3",
            totalAmount: "3",
            status: "Issued",
            type: "Rg / Retention",
            paidTTC: "0",
        },
    ];

    const inputFields = [
        {
            name: "contract",
            label: "Contract",
            type: "text",
            required: true,
        },
        {
            name: "ipcRef",
            label: "IPC Ref",
            type: "text",
            required: true,
        },
        {
            name: "Subcontractor",
            label: "Subcontractor",
            type: "text",
            required: true,
        },
        {
            name: "trade",
            label: "Trade",
            type: "text",
            required: true,
        },
        {
            name: "amountHT",
            label: "Amount HT",
            type: "number",
            required: true,
        },
        {
            name: "totalAmount",
            label: "Total Amount",
            type: "number",
            required: true,
        },

        {
            name: "status",
            label: "status",
            type: "text",
            required: true,
        },
    ];

    return {
        columns,
        tableData,
        inputFields,
    };
};

export default useIPCsDatabase;
