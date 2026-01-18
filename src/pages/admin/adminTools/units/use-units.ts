import { useState, useCallback } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

export interface Unit {
    id: number;
    name: string;
    symbol: string;
    [key: string]: unknown; // Index signature for API compatibility
}

const useUnits = () => {
    const [tableData, setTableData] = useState<Unit[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const { getToken } = useAuth();
    const { toaster } = useToast();

    const getUnits = useCallback(async () => {
        setLoading(true);
        const token = getToken();

        try {
            const data = await apiRequest({
                endpoint: "Unit/GetUnits",
                method: "GET",
                token: token ?? "",
            });
            if (data && Array.isArray(data)) {
                setTableData(data);
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error(error);
            toaster.error("Failed to load units");
        } finally {
            setLoading(false);
        }
    }, [getToken, toaster]);

    const createUnit = useCallback(async (unit: Omit<Unit, 'id'>) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: "Unit/AddUnit",
                method: "POST",
                token: token ?? "",
                body: unit,
            });

            if (response) {
                toaster.success("Unit created successfully");
                await getUnits();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error(error);
            toaster.error("Failed to create unit");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getUnits]);

    const updateUnit = useCallback(async (unit: Unit) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: "Unit/UpdateUnit",
                method: "PUT",
                token: token ?? "",
                body: unit,
            });

            if (response) {
                toaster.success("Unit updated successfully");
                await getUnits();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error(error);
            toaster.error("Failed to update unit");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getUnits]);

    const deleteUnit = useCallback(async (id: number) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: `Unit/DeleteUnit?id=${id}`,
                method: "DELETE",
                token: token ?? "",
            });

            if (response) {
                toaster.success("Unit deleted successfully");
                await getUnits();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error(error);
            toaster.error("Failed to delete unit");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getUnits]);

    return {
        tableData,
        loading,
        saving,
        getUnits,
        createUnit,
        updateUnit,
        deleteUnit,
    };
};

export default useUnits;
