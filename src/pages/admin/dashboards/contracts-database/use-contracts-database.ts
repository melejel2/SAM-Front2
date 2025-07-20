import { useState, useRef } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useContractsDatabase = () => {
    const [activeContractsData, setActiveContractsData] = useState<any[]>([]);
    const [terminatedContractsData, setTerminatedContractsData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const isApiCallInProgress = useRef(false);

    const { getToken } = useAuth();
    const token = getToken();

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



    const contractsColumns = {
        contractNumber: "Number",
        projectName: "Project",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        contractType: "Type",
        contractDate: "Date of Signature", 
        completionDate: "End Date",
        amount: "Amount",
        status: "Status",
    };

    const vosColumns = {
        contractNumber: "Number",
        projectName: "Project",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        contractType: "Type",
        contractDate: "Date of Signature",
        completionDate: "End Date",
        amount: "Amount",
        status: "Status",
    };

    const terminatedColumns = {
        contractNumber: "Number",
        projectName: "Project",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        contractType: "Type",
        contractDate: "Date of Signature",
        completionDate: "End Date",
        amount: "Amount",
        status: "Status",
    };

    const getContractsDatasets = async (status: number = 2) => {
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
                amount: contract.amount ? formatCurrency(contract.amount) : '-',
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

    // Each tab has its own data state
    const vosData: any[] = []; // Keep VOs empty for now
    const terminatedData = terminatedContractsData; // Terminated contracts data
    const contractsData = activeContractsData; // Active contracts data for compatibility
    
    // Use activeContractsData for the contracts tab
    const contractsTabData = activeContractsData;

    const getActiveContracts = async () => {
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
                amount: contract.amount ? formatCurrency(contract.amount) : '-',
                originalStatus: contract.status || '',
                status: formatStatusBadge(contract.status),
            }));
            
            setActiveContractsData(processedData.reverse());
        } catch (error) {
            console.error("API Error loading active contracts:", error);
            setActiveContractsData([]);
        }
    };

    const getTerminatedContracts = async () => {
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
                amount: contract.amount ? formatCurrency(contract.amount) : '-',
                originalStatus: contract.status || '',
                status: formatStatusBadge(contract.status),
            }));
            
            setTerminatedContractsData(processedData.reverse());
        } catch (error) {
            console.error("API Error loading terminated contracts:", error);
            setTerminatedContractsData([]);
        }
    };

    return {
        contractsColumns,
        vosColumns,
        terminatedColumns,
        contractsData: contractsTabData,
        vosData,
        terminatedData,
        loading,
        getContractsDatasets,
        getActiveContracts,
        getTerminatedContracts,
        previewContract,
    };
};

export default useContractsDatabase;
