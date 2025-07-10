import { useState, useEffect, useRef } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useContractsDatabase = () => {
    const [contractsData, setContractsData] = useState<any[]>([]);
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
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return '-';
        }
    };



    const contractsColumns = {
        contractNumber: "Contract Number",
        projectName: "Project",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        contractType: "Contract Type",
        contractDate: "Date of Signature", 
        completionDate: "End Date",
        amount: "Contract Amount",
        status: "Status",
    };

    const vosColumns = {
        contractNumber: "Contract Number",
        projectName: "Project",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        contractType: "Contract Type",
        contractDate: "Date of Signature",
        completionDate: "End Date",
        amount: "Contract Amount",
        status: "Status",
    };

    const terminatedColumns = {
        contractNumber: "Contract Number",
        projectName: "Project",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        contractType: "Contract Type",
        contractDate: "Date of Signature",
        completionDate: "End Date",
        amount: "Contract Amount",
        status: "Status",
    };

    const getContractsDatasets = async () => {
        if (isApiCallInProgress.current) {
            return;
        }
        
        isApiCallInProgress.current = true;
        setLoading(true);
        try {
            const data = await apiRequest({
                endpoint: "ContractsDatasets/GetContractsDatasetsList",
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
                tradeName: contract.tradeName || '-',
                contractDate: contract.contractDate ? formatDate(contract.contractDate) : '-',
                completionDate: contract.completionDate ? formatDate(contract.completionDate) : '-',
                amount: contract.amount ? formatCurrency(contract.amount) : '-',
            }));
            
            // Reverse the order to show newest first
            setContractsData(processedData.reverse());
        } catch (error) {
            console.error("API Error:", error);
            setContractsData([]);
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

    // Filter data based on status for different tabs
    const vosData: any[] = []; // Keep VOs empty for now
    const terminatedData = contractsData.filter(contract => contract.status === "Terminated");
    const activeContractsData = contractsData.filter(contract => contract.status === "Active");
    
    // If no active contracts, show all contracts in the first tab for now
    const contractsTabData = activeContractsData.length > 0 ? activeContractsData : contractsData;

    return {
        contractsColumns,
        vosColumns,
        terminatedColumns,
        contractsData: contractsTabData,
        vosData,
        terminatedData,
        loading,
        getContractsDatasets,
        previewContract,
    };
};

export default useContractsDatabase;
