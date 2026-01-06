
import { useState, useMemo, useCallback } from "react";
import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import { formatCurrency, formatDate } from "@/utils/formatters";

const useTerminatedContracts = () => {
    const [terminatedContractsData, setTerminatedContractsData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const { getToken } = useAuth();
    const token = getToken();

    const formatStatusBadge = useCallback((status: any) => {
        const statusStr = status?.toString() || '';
        const statusLower = statusStr.toLowerCase();
        let badgeClass = '';
        let displayText = statusStr;

        if (statusLower.includes('terminated')) {
            badgeClass = 'badge-contract-terminated';
            displayText = 'Terminated';
        } else {
            badgeClass = 'badge-contract-active';
            displayText = statusStr || 'Active';
        }

        return `<span class="badge badge-sm ${badgeClass} font-medium">${displayText}</span>`;
    }, []);

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

    const getTerminatedContracts = useCallback(async () => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    }, [token, formatDate, formatCurrency, formatStatusBadge]);

    return {
        terminatedColumns,
        terminatedContractsData,
        loading,
        getTerminatedContracts,
    };
};

export default useTerminatedContracts;
