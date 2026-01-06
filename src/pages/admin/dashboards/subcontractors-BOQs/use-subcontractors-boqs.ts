import { useState, useCallback, useMemo } from "react";
import { useContractsApi } from "./hooks/use-contracts-api";
import { ContractDatasetStatus } from "@/api/services/contracts-api";
import { formatCurrency, formatDate } from "@/utils/formatters";

const useSubcontractorsBOQs = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const contractsApi = useContractsApi();

    // Memoize columns to prevent unnecessary recreations
    const columns = useMemo(() => ({
        contractNumber: "Number",
        projectName: "Project",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        contractDate: "Date of Signature",
        completionDate: "End Date",
        amount: "Amount",
        status: "Status",
    }), []);

    const inputFields = useMemo(() => [
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
    ], []);

    // Memoize formatStatusBadge to prevent recreation on every render
    const formatStatusBadge = useCallback((status: any) => {
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
    }, []);

    // Define getContractsDatasets first since generateContract depends on it
    const getContractsDatasets = useCallback(async () => {
        const result = await contractsApi.fetchContractsDatasets(ContractDatasetStatus.Active);
        
        if (result.success && result.data) {
            // Process the data to format currency and dates
            const processedData = result.data.map((contract: any) => ({
                ...contract,
                id: contract.id || contract.contractId || Math.random().toString(), // Ensure we have an ID
                contractNumber: contract.contractNumber || contract.contractNb || '-',
                projectName: contract.projectName || '-',
                subcontractorName: contract.subcontractorName || '-',
                tradeName: contract.tradeName || '-',
                contractDate: contract.contractDate ? formatDate(contract.contractDate) : '-',
                completionDate: contract.completionDate ? formatDate(contract.completionDate) : '-',
                // Raw numeric value - Table component handles formatting
                amount: contract.amount ?? 0,
                status: formatStatusBadge(contract.status),
            }));
            
            // Reverse the order to show newest first
            setTableData(processedData.reverse());
        } else {
            setTableData([]);
        }
    }, [contractsApi, formatStatusBadge]);

    // Generate contract and refresh data
    const generateContract = useCallback(async (contractId: string | number) => {
        const result = await contractsApi.generateContractBOQ(Number(contractId));
        if (result.success) {
            await getContractsDatasets();
        }
        return result;
    }, [contractsApi, getContractsDatasets]);

    const previewContract = useCallback(async (contractData: any) => {
        // For editable contracts, use live preview instead of export
        // This generates a temporary preview without changing the contract status
        return await contractsApi.livePreviewPdfDocument(contractData);
    }, [contractsApi]);

    const DeleteContract = useCallback(async (contractId: number | string) => {
        const result = await contractsApi.deleteContract(Number(contractId));
        if (result.success) {
            setTableData(prevData => prevData.filter(contract => contract.id !== contractId));
        }
        return result;
    }, [contractsApi]);

    return {
        columns,
        tableData,
        inputFields,
        loading: contractsApi.loading,
        getContractsDatasets,
        previewContract,
        DeleteContract,
        generateContract,
    };
};

export default useSubcontractorsBOQs;
