import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useSubcontractorsBOQs = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();
    const token = getToken();

    const columns = {
        contractNumber: "Contract Number",
        projectName: "Project",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        contractDate: "Date of Signature",
        completionDate: "End Date",
        amount: "Contract Amount",
        status: "Status",
    };

    const inputFields = [
        {
            name: "contractNb",
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
            name: "trade",
            label: "Trade",
            type: "text",
            required: true,
        },
        {
            name: "contractAmount",
            label: "Contract Amount",
            type: "text",
            required: true,
        },
        {
            name: "status",
            label: "Status",
            type: "text",
            required: true,
        },
    ];

    const formatCurrency = (amount: number) => {
        if (!amount || isNaN(amount)) return '-';
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            // Handle ISO datetime format like "2020-01-27T00:00:00"
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return '-';
        }
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
                // Try both status values to see what works
                let editableData = data.filter((contract: any) => contract.status === "1");
                if (editableData.length === 0) {
                    editableData = data.filter((contract: any) => contract.status === "Editable");
                }
                if (editableData.length === 0) {
                    editableData = data; // Show all if no filtering works
                }
                
                // Process the data to format currency and dates
                const processedData = editableData.map((contract: any) => ({
                    ...contract,
                    id: contract.id || contract.contractId || Math.random().toString(), // Ensure we have an ID
                    contractNumber: contract.contractNumber || contract.contractNb || '-',
                    projectName: contract.projectName || '-',
                    subcontractorName: contract.subcontractorName || '-',
                    tradeName: contract.tradeName || '-',
                    contractDate: contract.contractDate ? formatDate(contract.contractDate) : '-',
                    completionDate: contract.completionDate ? formatDate(contract.completionDate) : '-',
                    amount: contract.amount ? formatCurrency(contract.amount) : '-',
                    status: contract.status || '-',
                }));
                
                // Reverse the order to show newest first
                setTableData(processedData.reverse());
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const previewContract = async (contractId: string) => {
        try {
            // Use the PDF export endpoint for preview since PreviewContract doesn't exist
            const response = await apiRequest({
                endpoint: `ContractsDatasets/ExportContractPdf/${contractId}`,
                method: "GET",
                token: token ?? "",
                responseType: "blob",
            });

            if (response instanceof Blob) {
                return { success: true, blob: response };
            }
            return { success: false, blob: null };
        } catch (error) {
            console.error(error);
            return { success: false, blob: null };
        }
    };

    return {
        columns,
        tableData,
        inputFields,
        loading,
        getContractsDatasets,
        previewContract,
    };
};

export default useSubcontractorsBOQs;
