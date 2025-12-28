import { useState, useMemo, useCallback } from "react";

import { useAuth } from "@/contexts/auth";
import { ipcApiService } from "@/api/services/ipc-api";
import { FINANCIAL_CONSTANTS, type IpcListItem } from "@/types/ipc";
import { formatCurrency } from "@/utils/formatters";

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

interface UseContractIPCsProps {
    contractId: number | null;
}

const useContractIPCs = ({ contractId }: UseContractIPCsProps) => {
    const [ipcs, setIpcs] = useState<IpcListItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();

    // Column definitions for IPC table
    const columns = useMemo(() => ({
        number: "IPC #",
        type: "Type",
        totalAmount: "Amount HT",
        totalAmountWithVAT: "Total TTC",
        status: "Status",
    }), []);

    // Fetch IPCs for the specific contract
    const fetchIPCs = useCallback(async () => {
        if (!contractId) {
            setIpcs([]);
            return;
        }

        setLoading(true);

        try {
            const currentToken = getToken() ?? "";
            // Use the contract-specific endpoint for better performance
            const response = await ipcApiService.getIpcsByContract(contractId, currentToken);
            if (response.success && response.data) {
                // IPCs are already filtered by contract on the backend
                const contractIpcs = response.data;

                // Format data for display
                const formattedData = contractIpcs.map((ipc: IpcListItem) => ({
                    ...ipc,
                    // Store original values
                    _totalAmountRaw: ipc.totalAmount,
                    _statusRaw: ipc.status,
                    _typeRaw: ipc.type || "",

                    // Pre-formatted display values
                    totalAmount: formatCurrency(ipc.totalAmount) as string,
                    totalAmountWithVAT: formatCurrency(ipc.totalAmount * (1 + FINANCIAL_CONSTANTS.DEFAULT_VAT_RATE)) as string,

                    // Normalized status and type text
                    status: getStatusText(ipc.status) as string,
                    type: getTypeText(ipc.type || "") as string,
                }));

                // Compute which IPC is the last (highest number) for delete restriction
                const maxNumber = formattedData.reduce((max: number, ipc) =>
                    Math.max(max, ipc.number || 0), 0
                );

                // Mark the last IPC
                const dataWithLastFlag = formattedData.map((ipc) => ({
                    ...ipc,
                    isLastForContract: ipc.number === maxNumber,
                }));

                // Sort by number descending (newest first)
                dataWithLastFlag.sort((a, b) => (b.number || 0) - (a.number || 0));

                setIpcs(dataWithLastFlag as unknown as IpcListItem[]);
            } else {
                setIpcs([]);
            }
        } catch (error) {
            setIpcs([]);
        } finally {
            setLoading(false);
        }
    }, [contractId, getToken]);

    // Preview IPC - smart method based on status
    const smartPreviewIpc = useCallback(async (ipcId: number, status: string, isGenerated: boolean) => {
        try {
            const currentToken = getToken() ?? "";
            const statusLower = status?.toLowerCase() || '';
            const isIssued = statusLower.includes('issued') || isGenerated;

            if (isIssued) {
                // IPC is already generated - load saved file from database
                const response = await ipcApiService.exportIpcPdf(ipcId, currentToken);
                return response;
            } else {
                // IPC is editable - generate live preview
                const ipcDataResponse = await ipcApiService.getIpcForEdit(ipcId, currentToken);

                if (!ipcDataResponse.success || !ipcDataResponse.data) {
                    return { success: false, error: "Failed to load IPC data for preview" };
                }

                // Generate live preview using the loaded data
                const response = await ipcApiService.livePreviewIpcPdf(ipcDataResponse.data, currentToken);
                return response;
            }
        } catch (error) {
            return { success: false, error: "Failed to preview IPC" };
        }
    }, [getToken]);

    // Download IPC Excel - smart method based on status
    const smartDownloadIpcExcel = useCallback(async (ipcId: number, status: string, isGenerated: boolean) => {
        try {
            const currentToken = getToken() ?? "";
            const statusLower = status?.toLowerCase() || '';
            const isIssued = statusLower.includes('issued') || isGenerated;

            if (isIssued) {
                const response = await ipcApiService.exportIpcExcel(ipcId, currentToken);
                return response;
            } else {
                const ipcDataResponse = await ipcApiService.getIpcForEdit(ipcId, currentToken);

                if (!ipcDataResponse.success || !ipcDataResponse.data) {
                    return { success: false, error: "Failed to load IPC data for Excel preview" };
                }

                const response = await ipcApiService.livePreviewIpcExcel(ipcDataResponse.data, currentToken);
                return response;
            }
        } catch (error) {
            return { success: false, error: "Failed to download IPC Excel" };
        }
    }, [getToken]);

    // Export IPC as ZIP
    const exportIpcZip = useCallback(async (ipcId: number) => {
        try {
            const currentToken = getToken() ?? "";
            const response = await ipcApiService.exportIpcZip(ipcId, currentToken);
            return response;
        } catch (error) {
            return { success: false, error: "Failed to fetch IPC ZIP" };
        }
    }, [getToken]);

    // Delete IPC
    const deleteIpc = useCallback(async (ipcId: number) => {
        try {
            const currentToken = getToken() ?? "";
            const response = await ipcApiService.deleteIpc(ipcId, currentToken);
            if (response.success) {
                // Refresh the list after deletion
                await fetchIPCs();
            }
            return response;
        } catch (error) {
            return { success: false, error: "Failed to delete IPC" };
        }
    }, [getToken, fetchIPCs]);

    // Generate IPC
    const generateIpc = useCallback(async (ipcId: number) => {
        try {
            const currentToken = getToken() ?? "";
            const response = await ipcApiService.generateIpc(ipcId, currentToken);
            if (response.success) {
                // Refresh the list after generation
                await fetchIPCs();
            }
            return response;
        } catch (error) {
            return { success: false, error: "Failed to generate IPC" };
        }
    }, [getToken, fetchIPCs]);

    return {
        ipcs,
        columns,
        loading,
        fetchIPCs,
        smartPreviewIpc,
        smartDownloadIpcExcel,
        exportIpcZip,
        deleteIpc,
        generateIpc,
    };
};

export default useContractIPCs;
