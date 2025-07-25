import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useSubcontractorsBOQs = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();
    const token = getToken();

    const columns = {
        contractNumber: "Number",
        projectName: "Project",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        contractDate: "Date of Signature",
        completionDate: "End Date",
        amount: "Amount",
        status: "Status",
    };

    const inputFields = [
        {
            name: "contractNb",
            label: "Number",
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
            label: "Amount",
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
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear().toString().slice(-2);
            return `${day}/${month}/${year}`;
        } catch (error) {
            return '-';
        }
    };

    const formatStatusBadge = (status: any) => {
        // Convert status to string and handle different types
        const statusStr = status?.toString() || '';
        const statusLower = statusStr.toLowerCase();
        let badgeClass = '';
        let displayText = statusStr;

        if (statusLower.includes('active')) {
            badgeClass = 'badge-contract-active';
            displayText = 'Active';
        } else if (statusLower.includes('terminated')) {
            badgeClass = 'badge-contract-terminated';
            displayText = 'Terminated';
        } else if (statusLower.includes('editable')) {
            badgeClass = 'badge-contract-editable';
            displayText = 'Editable';
        } else if (statusLower.includes('completed')) {
            badgeClass = 'badge-contract-completed';
            displayText = 'Completed';
        } else if (statusLower.includes('pending')) {
            badgeClass = 'badge-contract-pending';
            displayText = 'Pending';
        } else if (statusLower.includes('suspended')) {
            badgeClass = 'badge-contract-suspended';
            displayText = 'Suspended';
        } else {
            badgeClass = 'badge-contract-active';
            displayText = statusStr || 'Active';
        }

        return `<span class="badge badge-sm ${badgeClass} font-medium">${displayText}</span>`;
    };

    const getContractsDatasets = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({
                endpoint: "ContractsDatasets/GetContractsDatasetsList/0", // Status 0 = Editable contracts for BOQs
                method: "GET",
                token: token ?? "",
            });
            
            if (data && Array.isArray(data)) {
                // Data is already filtered by status from the API
                const editableData = data;
                
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
                    status: formatStatusBadge(contract.status),
                }));
                
                // Reverse the order to show newest first
                setTableData(processedData.reverse());
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error("API Error:", error);
            setTableData([]);
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
