import { useState, useRef, useMemo, useCallback } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import { formatCurrency, formatDate } from "@/utils/formatters";

const useContractsDatabase = () => {
    const [activeContractsData, setActiveContractsData] = useState<any[]>([]);
    const [terminatedContractsData, setTerminatedContractsData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const isApiCallInProgress = useRef(false);

    const { getToken } = useAuth();
    const token = getToken();

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



    // Memoize column definitions to prevent recreation
    const contractsColumns = useMemo(() => ({
        contractNumber: "Number",
        projectName: "Project",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        contractType: "Type",
        contractDate: "Date of Signature",
        completionDate: "End Date",
        amount: "Amount",
        status: "Status",
    }), []);

    const vosColumns = useMemo(() => ({
        contractNumber: "Number",
        projectName: "Project",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        contractType: "Type",
        contractDate: "Date of Signature",
        completionDate: "End Date",
        amount: "Amount",
        status: "Status",
    }), []);

    const terminatedColumns = useMemo(() => ({
        contractNumber: "Number",
        projectName: "Project",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        contractType: "Type",
        contractDate: "Date of Signature",
        completionDate: "End Date",
        amount: "Amount",
        status: "Status",
    }), []);

    const getContractsDatasets = useCallback(async (status: number = 2) => {
        if (isApiCallInProgress.current) {
            return;
        }

        isApiCallInProgress.current = true;
        setLoading(true);
        try {
            const data = await apiRequest({
                endpoint: `ContractsDatasets/GetContractsDatasetsList/${status}`, // Status: 0=Editable, 1=Terminated, 2=Active
                method: "GET",
                token: token ?? "",
            });

            // Handle different response structures
            let contractsArray = [];

            if (Array.isArray(data)) {
                contractsArray = data;
            } else if (data && typeof data === 'object') {
                // Check common response wrapper patterns
                if (data.data && Array.isArray(data.data)) {
                    contractsArray = data.data;
                } else if (data.result && Array.isArray(data.result)) {
                    contractsArray = data.result;
                } else if (data.items && Array.isArray(data.items)) {
                    contractsArray = data.items;
                } else {
                    contractsArray = [data];
                }
            } else if (data) {
                contractsArray = [data];
            } else {
                contractsArray = [];
            }


            // Process the data to format currency and dates
            const processedData = contractsArray.map((contract: any) => ({
                ...contract,
                projectName: contract.projectName || '-',
                tradeName: contract.tradeName || '-',
                contractDate: contract.contractDate ? formatDate(contract.contractDate) : '-',
                completionDate: contract.completionDate ? formatDate(contract.completionDate) : '-',
                // Raw numeric value - Table component handles formatting
                amount: contract.amount ?? 0,
                originalStatus: contract.status || '', // Preserve original status for filtering
                status: formatStatusBadge(contract.status),
            }));

            // Reverse the order to show newest first and set to appropriate state based on status
            const reversedData = processedData.reverse();
            if (status === 2) {
                // Active contracts
                setActiveContractsData(reversedData);
            } else if (status === 1) {
                // Terminated contracts
                setTerminatedContractsData(reversedData);
            }
        } catch (error) {
            console.error("API Error:", error);
            if (status === 2) {
                setActiveContractsData([]);
            } else if (status === 1) {
                setTerminatedContractsData([]);
            }
        } finally {
            setLoading(false);
            isApiCallInProgress.current = false;
        }
    }, [token, formatStatusBadge]);

    const previewContract = useCallback(async (contractId: string) => {
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
    }, [token]);

    const terminateContract = useCallback(async (contractId: string) => {
        try {
            const response = await apiRequest({
                endpoint: `ContractsDatasets/TerminateContract/${contractId}`,
                method: "POST",
                token: token ?? "",
            });

            if (response && response.success !== false) {
                // Refresh the active and terminated contracts
                await getActiveContracts();
                await getTerminatedContracts();
                return { success: true };
            }
            return { success: false, error: response?.error || "Failed to terminate contract" };
        } catch (error) {
            console.error("Error terminating contract:", error);
            return { success: false, error: "An error occurred while terminating the contract" };
        }
    }, [token]);

    const generateFinalContract = useCallback(async (contractId: string) => {
        try {
            const response = await apiRequest({
                endpoint: `ContractsDatasets/GenerateFinalContract/${contractId}`,
                method: "POST",
                token: token ?? "",
            });

            if (response && response.success !== false) {
                // Refresh terminated contracts to update status
                await getTerminatedContracts();
                return { success: true };
            }
            return { success: false, error: response?.error || "Failed to generate final discharge document" };
        } catch (error) {
            console.error("Error generating final contract:", error);
            return { success: false, error: "An error occurred while generating the final discharge document" };
        }
    }, [token]);

    // VOs data placeholder (VOs are loaded per-contract in details page)
    const vosData: any[] = [];

    const getActiveContracts = useCallback(async () => {
        try {
            const data = await apiRequest({
                endpoint: `ContractsDatasets/GetContractsDatasetsList/2`, // Status 2 = Active
                method: "GET",
                token: token ?? "",
            });

            let contractsArray = [];
            if (Array.isArray(data)) {
                contractsArray = data;
            } else if (data && typeof data === 'object') {
                if (data.data && Array.isArray(data.data)) {
                    contractsArray = data.data;
                } else if (data.result && Array.isArray(data.result)) {
                    contractsArray = data.result;
                } else if (data.items && Array.isArray(data.items)) {
                    contractsArray = data.items;
                } else {
                    contractsArray = [data];
                }
            } else if (data) {
                contractsArray = [data];
            } else {
                contractsArray = [];
            }

            const processedData = contractsArray.map((contract: any) => ({
                ...contract,
                projectName: contract.projectName || '-',
                tradeName: contract.tradeName || '-',
                contractDate: contract.contractDate ? formatDate(contract.contractDate) : '-',
                completionDate: contract.completionDate ? formatDate(contract.completionDate) : '-',
                // Raw numeric value - Table component handles formatting
                amount: contract.amount ?? 0,
                originalStatus: contract.status || '',
                status: formatStatusBadge(contract.status),
            }));

            setActiveContractsData(processedData.reverse());
        } catch (error) {
            console.error("API Error loading active contracts:", error);
            setActiveContractsData([]);
        }
    }, [token, formatStatusBadge]);

    const getTerminatedContracts = useCallback(async () => {
        try {
            const data = await apiRequest({
                endpoint: `ContractsDatasets/GetContractsDatasetsList/1`, // Status 1 = Terminated
                method: "GET",
                token: token ?? "",
            });

            let contractsArray = [];
            if (Array.isArray(data)) {
                contractsArray = data;
            } else if (data && typeof data === 'object') {
                if (data.data && Array.isArray(data.data)) {
                    contractsArray = data.data;
                } else if (data.result && Array.isArray(data.result)) {
                    contractsArray = data.result;
                } else if (data.items && Array.isArray(data.items)) {
                    contractsArray = data.items;
                } else {
                    contractsArray = [data];
                }
            } else if (data) {
                contractsArray = [data];
            } else {
                contractsArray = [];
            }

            const processedData = contractsArray.map((contract: any) => ({
                ...contract,
                projectName: contract.projectName || '-',
                tradeName: contract.tradeName || '-',
                contractDate: contract.contractDate ? formatDate(contract.contractDate) : '-',
                completionDate: contract.completionDate ? formatDate(contract.completionDate) : '-',
                // Raw numeric value - Table component handles formatting
                amount: contract.amount ?? 0,
                originalStatus: contract.status || '',
                status: formatStatusBadge(contract.status),
            }));

            setTerminatedContractsData(processedData.reverse());
        } catch (error) {
            console.error("API Error loading terminated contracts:", error);
            setTerminatedContractsData([]);
        }
    }, [token, formatStatusBadge]);

    return {
        contractsColumns,
        vosColumns,
        terminatedColumns,
        // Use state directly to avoid duplicate references
        contractsData: activeContractsData,
        vosData,
        terminatedData: terminatedContractsData,
        loading,
        getContractsDatasets,
        getActiveContracts,
        getTerminatedContracts,
        previewContract,
        terminateContract,
        generateFinalContract,
    };
};

export default useContractsDatabase;
