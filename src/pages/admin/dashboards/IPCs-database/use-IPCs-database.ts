import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useIPCsDatabase = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();
    const token = getToken();

    const columns = {
        projectName: "Contract",
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
            options: ["Provisoire / Interim", "Final / Final", "Rg / Retention"],
        },
    ];

    const formatCurrency = (amount: number) => {
        if (amount == null || isNaN(amount)) return "-";
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const getIPCs = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({
                endpoint: "Ipc/GetIpcsList",
                method: "GET",
                token: token ?? "",
            });
            if (data) {
                const VAT_RATE = 0.18; // 18% VAT rate, adjust as needed
                const formattedData = data.map((ipc: any) => ({
                    ...ipc,
                    totalAmount: formatCurrency(ipc.totalAmount),
                    totalAmountWithVAT: formatCurrency(ipc.totalAmount * (1 + VAT_RATE)),
                    retention: formatCurrency(ipc.retention),
                    type: ipc.type?.split(' / ')[0] || ipc.type,
                }));
                setTableData(formattedData);
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const previewIpc = async (ipcId: string) => {
        try {
            const response = await apiRequest({
                endpoint: `Ipc/ExportIpcPdf/${ipcId}`,
                method: "GET",
                token: token ?? "",
                responseType: "blob",
            });
            
            if (response instanceof Blob) {
                return { success: true, blob: response };
            }
            return { success: false, blob: null };
        } catch (error) {
            console.error("Error fetching IPC PDF:", error);
            return { success: false, blob: null };
        }
    };

    const downloadIpcExcel = async (ipcId: string) => {
        try {
            const response = await apiRequest({
                endpoint: `Ipc/ExportIpcExcel/${ipcId}`,
                method: "GET",
                token: token ?? "",
                responseType: "blob",
            });
            
            if (response instanceof Blob) {
                return { success: true, blob: response };
            }
            return { success: false, blob: null };
        } catch (error) {
            console.error("Error fetching IPC Excel:", error);
            return { success: false, blob: null };
        }
    };



    const exportIpcZip = async (ipcId: string) => {
        try {
            const response = await apiRequest({
                endpoint: `Ipc/ExportIpc/${ipcId}`,
                method: "GET",
                token: token ?? "",
                responseType: "blob",
            });
            
            if (response instanceof Blob) {
                return { success: true, blob: response };
            }
            return { success: false, blob: null };
        } catch (error) {
            console.error("Error fetching IPC ZIP:", error);
            return { success: false, blob: null };
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
