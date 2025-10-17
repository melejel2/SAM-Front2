import { useState, useMemo } from "react";

import { useAuth } from "@/contexts/auth";
import { ipcApiService } from "@/api/services/ipc-api";
import type { IpcListItem } from "@/types/ipc";

// Memoized formatter functions (created once, reused forever)
const formatCurrency = (amount: number): string => {
    if (amount == null || isNaN(amount) || amount === 0) return "-";
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Math.round(amount));
};

const getStatusText = (status: string): string => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('editable')) return 'Editable';
    if (statusLower.includes('issued')) return 'Issued';
    if (statusLower.includes('pending')) return 'Pending Approval';
    return status;
};

const getTypeText = (type: string): string => {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('provisoire') || typeLower.includes('interim')) return 'Provisoire';
    if (typeLower.includes('final')) return 'Final';
    if (typeLower.includes('rg') || typeLower.includes('retention')) return 'Retention';
    if (typeLower.includes('avance') || typeLower.includes('advance')) return 'Avance';
    return type;
};

const useIPCsDatabase = () => {
    const [tableData, setTableData] = useState<IpcListItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();
    const token = getToken();

    // Memoize static data to prevent recreation on every render
    const columns = useMemo(() => ({
        contract: "Contract",
        number: "IPC Ref",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        totalAmount: "Amount HT",
        totalAmountWithVAT: "Total Amount",
        status: "Status",
        type: "Type",
        retention: "Paid TTC",
    }), []);

    const inputFields = useMemo(() => [
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
    ], []);

    const getIPCs = async () => {
        setLoading(true);

        try {
            const response = await ipcApiService.getIpcsList(token ?? "");
            if (response.success && response.data) {
                const VAT_RATE = 0.18; // 18% VAT rate

                // Format data ONCE during fetch - store formatted values directly
                const formattedData = response.data.map((ipc: IpcListItem) => ({
                    ...ipc,
                    // Store original numeric values for sorting/filtering
                    _totalAmountRaw: ipc.totalAmount,
                    _retentionRaw: ipc.retention,
                    _statusRaw: ipc.status,
                    _typeRaw: ipc.type || "",

                    // Handle empty contract field
                    contract: (ipc.contract && ipc.contract.trim() !== "")
                        ? ipc.contract
                        : ipc.contractsDatasetId
                            ? `Contract-${ipc.contractsDatasetId}`
                            : "-",

                    // Pre-formatted display values (no recalculation needed on render)
                    totalAmount: formatCurrency(ipc.totalAmount) as any,
                    totalAmountWithVAT: formatCurrency(ipc.totalAmount * (1 + VAT_RATE)) as any,
                    retention: formatCurrency(ipc.retention) as any,

                    // Store plain text for badges (React components will render them)
                    status: getStatusText(ipc.status) as any,
                    type: getTypeText(ipc.type || "") as any,
                }));

                // Reverse the order to show newest first
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
