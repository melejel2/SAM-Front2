import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useContractsDatabase = () => {
    const [contractsData, setContractsData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();
    const token = getToken();

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

    const getContractsDatasets = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({
                endpoint: "ContractsDatasets/GetContractsDatasetsList",
                method: "GET",
                token: token ?? "",
            });
            if (data) {
                setContractsData(data);
            } else {
                setContractsData([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const previewContract = async (contractId: string) => {
        try {
            const response = await apiRequest({
                endpoint: `ContractsDatasets/PreviewContract/${contractId}`,
                method: "GET",
                token: token ?? "",
                responseType: "blob",
            });

            if (response instanceof Blob) {
                const url = window.URL.createObjectURL(response);
                const a = document.createElement("a");
                a.href = url;
                a.download = `contract-${contractId}.docx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                return true;
            }
            return false;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    // For now, using mock data for VOs and terminated contracts
    // These would need their own endpoints from the backend
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
            status: "Terminated",
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
            status: "Terminated",
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
            status: "Terminated",
        },
    ];

    return {
        contractsColumns,
        vosColumns,
        terminatedColumns,
        contractsData,
        vosData,
        terminatedData,
        loading,
        getContractsDatasets,
        previewContract,
    };
};

export default useContractsDatabase;
