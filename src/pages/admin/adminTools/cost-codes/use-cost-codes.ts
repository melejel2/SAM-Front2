import { useState, useCallback } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

export interface CostCode {
    id: number;
    code: string;
    en?: string;
    fr?: string;
    bold?: boolean;
    color?: string;
    created?: string;
}

const useCostCodes = () => {
    const [tableData, setTableData] = useState<CostCode[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [uploadLoading, setUploadLoading] = useState<boolean>(false);

    const { getToken } = useAuth();
    const { toaster } = useToast();

    const normalizeCostCode = useCallback((item: any): CostCode => ({
        id: item?.id ?? item?.Id ?? 0,
        code: item?.code ?? item?.Code ?? "",
        en: item?.en ?? item?.En ?? "",
        fr: item?.fr ?? item?.Fr ?? "",
        bold: item?.bold ?? item?.Bold,
        color: item?.color ?? item?.Color,
        created: item?.created ?? item?.Created,
    }), []);

    const getCostCodes = useCallback(async () => {
        setLoading(true);
        const token = getToken();

        try {
            const data = await apiRequest({
                endpoint: "CostCode/GetCodeCostLibrary",
                method: "GET",
                token: token ?? "",
            });
            if (data && typeof data === "object" && "isSuccess" in data && data.isSuccess === false) {
                setTableData([]);
                toaster.error(data.message || "Failed to load cost codes");
                return;
            }
            if (data && Array.isArray(data)) {
                setTableData(data.map(normalizeCostCode));
            } else if (data && typeof data === "object" && "data" in data && Array.isArray((data as any).data)) {
                setTableData((data as any).data.map(normalizeCostCode));
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error(error);
            toaster.error("Failed to load cost codes");
        } finally {
            setLoading(false);
        }
    }, [getToken, toaster, normalizeCostCode]);

    const createCostCode = useCallback(async (costCode: Omit<CostCode, 'id'>) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: "CostCode/AddCostCode",
                method: "POST",
                token: token ?? "",
                body: {
                    code: costCode.code,
                    en: costCode.en,
                    fr: costCode.fr,
                },
            });

            if (response) {
                toaster.success("Cost code created successfully");
                await getCostCodes();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error(error);
            toaster.error("Failed to create cost code");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getCostCodes]);

    const updateCostCode = useCallback(async (costCode: CostCode) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: "CostCode/UpdateCostCode",
                method: "PUT",
                token: token ?? "",
                body: {
                    id: costCode.id,
                    code: costCode.code,
                    en: costCode.en,
                    fr: costCode.fr,
                },
            });

            if (response) {
                toaster.success("Cost code updated successfully");
                await getCostCodes();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error(error);
            toaster.error("Failed to update cost code");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getCostCodes]);

    const deleteCostCode = useCallback(async (id: number) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: `CostCode/DeleteCostCode?id=${id}`,
                method: "DELETE",
                token: token ?? "",
            });

            if (response) {
                toaster.success("Cost code deleted successfully");
                await getCostCodes();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error(error);
            toaster.error("Failed to delete cost code");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getCostCodes]);

    const uploadCostCodes = useCallback(async (file: File) => {
        setUploadLoading(true);
        const token = getToken();

        try {
            const formData = new FormData();
            formData.append("file", file);

            const result = await apiRequest({
                endpoint: "CostCode/UploadCostCode",
                method: "POST",
                token: token ?? "",
                body: formData,
            });

            if (result && typeof result === "object" && "success" in result) {
                if (result.success) {
                    toaster.success("Cost codes uploaded successfully");
                    await getCostCodes();
                } else {
                    toaster.error(result.message || "Upload failed");
                }
            } else {
                toaster.success("Cost codes uploaded successfully");
                await getCostCodes();
            }
        } catch (error) {
            console.error(error);
            toaster.error("Failed to upload cost codes");
        } finally {
            setUploadLoading(false);
        }
    }, [getToken, toaster, getCostCodes]);

    return {
        tableData,
        loading,
        saving,
        uploadLoading,
        getCostCodes,
        createCostCode,
        updateCostCode,
        deleteCostCode,
        uploadCostCodes,
    };
};

export default useCostCodes;
