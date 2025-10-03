import { useState } from "react";

import { useAuth } from "@/contexts/auth";
import { ipcApiService } from "@/api/services/ipc-api";
import type { IpcListItem } from "@/types/ipc";

const useIPCsDatabase = () => {
    const [tableData, setTableData] = useState<IpcListItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();
    const token = getToken();

    const columns = {
        contract: "Contract",
        number: "IPC Ref",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        totalAmount: "Amount HT",
        totalAmountWithVAT: "Total Amount",
        status: "Status",
        type: "Type",
        retention: "Paid TTC",
    };

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
            label: "Status",
            type: "select",
            required: true,
            options: ["Editable", "Pending Approval", "Issued"],
        },
        {
            name: "type",
            label: "Type",
            type: "select",
            required: true,
            options: ["Provisoire / Interim", "Final / Final", "Rg / Retention", "Avance / Advance Payment"],
        },
    ];

    const formatCurrency = (amount: number) => {
        if (amount == null || isNaN(amount) || amount === 0) return "-";
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Math.round(amount));
    };

    const formatStatusBadge = (status: string) => {
        const statusLower = status?.toLowerCase() || '';
        let badgeClass = '';
        let displayText = status;

        if (statusLower.includes('editable')) {
            badgeClass = 'badge-status-editable';
            displayText = 'Editable';
        } else if (statusLower.includes('issued')) {
            badgeClass = 'badge-status-issued';
            displayText = 'Issued';
        } else if (statusLower.includes('pending')) {
            badgeClass = 'badge-status-pending';
            displayText = 'Pending Approval';
        } else {
            badgeClass = 'badge-status-editable';
        }

        return `<span class="badge badge-sm ${badgeClass} font-medium">${displayText}</span>`;
    };

    const formatTypeBadge = (type: string) => {
        const typeLower = type?.toLowerCase() || '';
        let badgeClass = '';
        let displayText = type;

        if (typeLower.includes('provisoire') || typeLower.includes('interim')) {
            badgeClass = 'badge-type-provisoire';
            displayText = 'Provisoire';
        } else if (typeLower.includes('final')) {
            badgeClass = 'badge-type-final';
            displayText = 'Final';
        } else if (typeLower.includes('rg') || typeLower.includes('retention')) {
            badgeClass = 'badge-type-rg';
            displayText = 'Retention';
        } else if (typeLower.includes('avance') || typeLower.includes('advance')) {
            badgeClass = 'badge-type-avance';
            displayText = 'Avance';
        } else {
            badgeClass = 'badge-type-provisoire';
        }

        return `<span class="badge badge-sm ${badgeClass} font-medium">${displayText}</span>`;
    };

    const getIPCs = async () => {
        setLoading(true);

        try {
            const response = await ipcApiService.getIpcsList(token ?? "");
            if (response.success && response.data) {
                const VAT_RATE = 0.18; // 18% VAT rate, adjust as needed
                const formattedData = response.data.map((ipc: IpcListItem) => ({
                    ...ipc,
                    // Handle empty contract field - use contractsDatasetId as fallback for now
                    contract: (ipc.contract && ipc.contract.trim() !== "")
                        ? ipc.contract
                        : ipc.contractsDatasetId
                            ? `Contract-${ipc.contractsDatasetId}`
                            : "-",
                    totalAmount: formatCurrency(ipc.totalAmount) as any,
                    totalAmountWithVAT: formatCurrency(ipc.totalAmount * (1 + VAT_RATE)),
                    retention: formatCurrency(ipc.retention) as any,
                    status: formatStatusBadge(ipc.status) as any,
                    type: formatTypeBadge(ipc.type || "") as any,
                }));
                // Reverse the order to show newest first (inverse order from backend)
                setTableData(formattedData.reverse() as any);
            } else {
                console.error("Failed to fetch IPCs:", response.error);
                setTableData([]);
            }
        } catch (error) {
            console.error("Error fetching IPCs:", error);
            setTableData([]);
        } finally {
            setLoading(false);
        }
    };

    const previewIpc = async (ipcId: string) => {
        try {
            const response = await ipcApiService.exportIpcPdf(parseInt(ipcId), token ?? "");
            return response;
        } catch (error) {
            console.error("Error fetching IPC PDF:", error);
            return { success: false, error: "Failed to fetch IPC PDF" };
        }
    };

    const downloadIpcExcel = async (ipcId: string) => {
        try {
            const response = await ipcApiService.exportIpcExcel(parseInt(ipcId), token ?? "");
            return response;
        } catch (error) {
            console.error("Error fetching IPC Excel:", error);
            return { success: false, error: "Failed to fetch IPC Excel" };
        }
    };



    const exportIpcZip = async (ipcId: string) => {
        try {
            const response = await ipcApiService.exportIpcZip(parseInt(ipcId), token ?? "");
            return response;
        } catch (error) {
            console.error("Error fetching IPC ZIP:", error);
            return { success: false, error: "Failed to fetch IPC ZIP" };
        }
    };

    return {
        columns,
        tableData,
        inputFields,
        loading,
        getIPCs,
        previewIpc,
        downloadIpcExcel,
        exportIpcZip,
    };
};

export default useIPCsDatabase;
