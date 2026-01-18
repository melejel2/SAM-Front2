import { useState, useCallback } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

export interface Trade {
    id: number;
    name: string;
    nameFr: string;
    costCode: string;
    costCodeId?: number;
    [key: string]: unknown; // Index signature for API compatibility
}

export interface CostCode {
    id: number;
    code: string;
    name?: string;
}

const useTrades = () => {
    const [tableData, setTableData] = useState<Trade[]>([]);
    const [costCodes, setCostCodes] = useState<CostCode[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const { getToken } = useAuth();
    const { toaster } = useToast();

    const getTrades = useCallback(async () => {
        setLoading(true);
        const token = getToken();

        try {
            const data = await apiRequest({ endpoint: "Sheets/GetSheets", method: "GET", token: token ?? "" });
            if (data && Array.isArray(data)) {
                setTableData(data);
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error(error);
            toaster.error("Failed to load trades");
        } finally {
            setLoading(false);
        }
    }, [getToken, toaster]);

    const normalizeCostCode = useCallback((item: any): CostCode => ({
        id: item?.id ?? item?.Id ?? 0,
        code: item?.code ?? item?.Code ?? "",
        name: item?.name ?? item?.Name ?? item?.en ?? item?.En ?? "",
    }), []);

    const getCostCodes = useCallback(async () => {
        const token = getToken();

        try {
            const data = await apiRequest({ endpoint: "CostCode/GetCodeCostLibrary", method: "GET", token: token ?? "" });
            if (data && Array.isArray(data)) {
                setCostCodes(data.map(normalizeCostCode));
            } else if (data && typeof data === "object" && "data" in data && Array.isArray((data as any).data)) {
                setCostCodes((data as any).data.map(normalizeCostCode));
            } else {
                setCostCodes([]);
            }
        } catch (error) {
            console.error(error);
        }
    }, [getToken, normalizeCostCode]);

    const createTrade = useCallback(async (trade: Omit<Trade, 'id'>) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: "Sheets/AddSheet",
                method: "POST",
                token: token ?? "",
                body: trade,
            });

            if (response) {
                toaster.success("Trade created successfully");
                await getTrades();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error(error);
            toaster.error("Failed to create trade");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getTrades]);

    const updateTrade = useCallback(async (trade: Trade) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: "Sheets/UpdateSheet",
                method: "PUT",
                token: token ?? "",
                body: trade,
            });

            if (response) {
                toaster.success("Trade updated successfully");
                await getTrades();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error(error);
            toaster.error("Failed to update trade");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getTrades]);

    const deleteTrade = useCallback(async (id: number) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: `Sheets/DeleteSheet?id=${id}`,
                method: "DELETE",
                token: token ?? "",
            });

            if (response) {
                toaster.success("Trade deleted successfully");
                await getTrades();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error(error);
            toaster.error("Failed to delete trade");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getTrades]);

    // Backward-compatible columns for SAMTable
    const columns: Record<string, string> = {
        name: "EN",
        nameFr: "FR",
        costCode: "Code",
    };

    return {
        tableData,
        sheets: tableData, // Backward-compatible alias for other components
        columns, // Backward-compatible for SAMTable
        costCodes,
        loading,
        saving,
        getTrades,
        getCostCodes,
        createTrade,
        updateTrade,
        deleteTrade,
    };
};

export default useTrades;
