import { useState, useMemo } from "react";

import { useAuth } from "@/contexts/auth";
import { ipcApiService } from "@/api/services/ipc-api";
import type { IpcListItem } from "@/types/ipc";

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
        amountHT: "Amount HT",
        totalAmount: "Total Amount",
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

                    // Use server-calculated HT amount (uses contract/database VAT rate)
                    amountHT: ipc.totalAmountHT,
                    totalAmount: ipc.totalAmount,
                    retention: ipc.retention,

                    // Store plain text for badges (React components will render them)
                    status: getStatusText(ipc.status) as any,
                    type: getTypeText(ipc.type || "") as any,
                }));

                // Compute which IPC is the last (highest number) for each contract
                // This is used to restrict delete action to only the last IPC
                const maxNumberByContract = new Map<number, number>();
                formattedData.forEach((ipc: any) => {
                    const contractId = ipc.contractsDatasetId;
                    const currentMax = maxNumberByContract.get(contractId) ?? 0;
                    if (ipc.number > currentMax) {
                        maxNumberByContract.set(contractId, ipc.number);
                    }
                });

                // Mark each IPC with isLastForContract flag
                const dataWithLastFlag = formattedData.map((ipc: any) => ({
                    ...ipc,
                    isLastForContract: ipc.number === maxNumberByContract.get(ipc.contractsDatasetId),
                }));

                // Reverse the order to show newest first
                setTableData(dataWithLastFlag.reverse() as any);
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

    /**
     * Smart IPC preview that chooses the correct method based on IPC status:
     * - Issued IPCs: Use saved file from database (exportIpcPdf)
     * - Editable IPCs: Generate live preview (livePreviewIpcPdf)
     */
    const smartPreviewIpc = async (ipcId: string, status: string, isGenerated: boolean) => {
        try {
            const statusLower = status?.toLowerCase() || '';
            const isIssued = statusLower.includes('issued') || isGenerated;

            if (isIssued) {
                // IPC is already generated - load saved file from database
                console.log(`[IPC Preview] Loading saved PDF for issued IPC ${ipcId}`);
                const response = await ipcApiService.exportIpcPdf(parseInt(ipcId), token ?? "");
                return response;
            } else {
                // IPC is editable - generate live preview
                console.log(`[IPC Preview] Generating live preview for editable IPC ${ipcId}`);

                // First, load the full IPC data
                const ipcDataResponse = await ipcApiService.getIpcForEdit(parseInt(ipcId), token ?? "");

                if (!ipcDataResponse.success || !ipcDataResponse.data) {
                    return { success: false, error: "Failed to load IPC data for preview" };
                }

                // Generate live preview using the loaded data
                const response = await ipcApiService.livePreviewIpcPdf(ipcDataResponse.data, token ?? "");
                return response;
            }
        } catch (error) {
            console.error("Error previewing IPC:", error);
            return { success: false, error: "Failed to preview IPC" };
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

    /**
     * Smart IPC Excel download that chooses the correct method based on IPC status:
     * - Issued IPCs: Use saved file from database (exportIpcExcel)
     * - Editable IPCs: Generate live preview (livePreviewIpcExcel)
     */
    const smartDownloadIpcExcel = async (ipcId: string, status: string, isGenerated: boolean) => {
        try {
            const statusLower = status?.toLowerCase() || '';
            const isIssued = statusLower.includes('issued') || isGenerated;

            if (isIssued) {
                // IPC is already generated - load saved file from database
                console.log(`[IPC Excel] Loading saved Excel for issued IPC ${ipcId}`);
                const response = await ipcApiService.exportIpcExcel(parseInt(ipcId), token ?? "");
                return response;
            } else {
                // IPC is editable - generate live preview
                console.log(`[IPC Excel] Generating live Excel preview for editable IPC ${ipcId}`);

                // First, load the full IPC data
                const ipcDataResponse = await ipcApiService.getIpcForEdit(parseInt(ipcId), token ?? "");

                if (!ipcDataResponse.success || !ipcDataResponse.data) {
                    return { success: false, error: "Failed to load IPC data for Excel preview" };
                }

                // Generate live preview using the loaded data
                const response = await ipcApiService.livePreviewIpcExcel(ipcDataResponse.data, token ?? "");
                return response;
            }
        } catch (error) {
            console.error("Error downloading IPC Excel:", error);
            return { success: false, error: "Failed to download IPC Excel" };
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
        smartPreviewIpc,
        downloadIpcExcel,
        smartDownloadIpcExcel,
        exportIpcZip,
    };
};

export default useIPCsDatabase;
