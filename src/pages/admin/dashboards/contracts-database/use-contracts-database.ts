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

    const contractsData = [
        {
            id: "1",
            contractNb: "C-001",
            project: "Project A",
            subcontractor: "SubCo Ltd",
            trade: "Plumbing",
            dateOfSignature: "2024-01-15",
            endDate: "2024-12-15",
            contractAmount: "$100,000",
            totalAmount: "$120,000",
            status: "Active",
        },
        {
            id: "2",
            contractNb: "C-002",
            project: "Project B",
            subcontractor: "BuildPro Inc",
            trade: "Electrical",
            dateOfSignature: "2024-03-10",
            endDate: "2025-03-10",
            contractAmount: "$150,000",
            totalAmount: "$170,000",
            status: "Active",
        },
        {
            id: "3",
            contractNb: "C-003",
            project: "Project C",
            subcontractor: "Alpha Constructions",
            trade: "Masonry",
            dateOfSignature: "2023-11-01",
            endDate: "2024-10-31",
            contractAmount: "$90,000",
            totalAmount: "$95,000",
            status: "Active",
        },
    ];

    const vosData = [
        {
            id: "1",
            contractNb: "C-001",
            voNumber: "VO-101",
            subcontractor: "SubCo Ltd",
            trade: "Plumbing",
            type: "Addition",
            date: "2024-04-01",
            totalAmount: "$5,000",
            status: "Active",
        },
        {
            id: "2",
            contractNb: "C-002",
            voNumber: "VO-102",
            subcontractor: "BuildPro Inc",
            trade: "Electrical",
            type: "Deduction",
            date: "2024-06-20",
            totalAmount: "-$3,000",
            status: "Active",
        },
        {
            id: "3",
            contractNb: "C-003",
            voNumber: "VO-103",
            subcontractor: "Alpha Constructions",
            trade: "Masonry",
            type: "Addition",
            date: "2024-02-15",
            totalAmount: "$2,500",
            status: "Active",
        },
    ];

    const terminatedData = [
        {
            id: "1",
            contractNb: "C-004",
            project: "Project D",
            subcontractor: "Omega Builders",
            trade: "Painting",
            dateOfSignature: "2023-06-10",
            endDate: "2023-12-10",
            contractAmount: "$50,000",
            status: "Active",
        },
        {
            id: "2",
            contractNb: "C-005",
            project: "Project E",
            subcontractor: "Skyline Works",
            trade: "Roofing",
            dateOfSignature: "2022-08-20",
            endDate: "2023-08-20",
            contractAmount: "$80,000",
            status: "Active",
        },
        {
            id: "3",
            contractNb: "C-006",
            project: "Project F",
            subcontractor: "Prime Co",
            trade: "HVAC",
            dateOfSignature: "2023-01-01",
            endDate: "2023-09-01",
            contractAmount: "$70,000",
            status: "Active",
        },
    ];

    return {
        contractsColumns,
        vosColumns,
        terminatedColumns,
        contractsData,
        vosData,
        terminatedData,
    };
};

export default useContractsDatabase;
