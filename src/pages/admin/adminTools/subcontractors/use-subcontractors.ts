import { useState, useCallback } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

export interface Subcontractor {
    id: number;
    name: string | null;
    siegeSocial: string | null;
    commerceRegistrar: string | null;
    commerceNumber: string | null;
    taxNumber: string | null;
    representedBy: string | null;
    qualityRepresentive: string | null;
    subcontractorTel: string | null;
    [key: string]: unknown; // Index signature for API compatibility
}

export interface SubcontractorFormData {
    name: string;
    siegeSocial: string;
    commerceRegistrar: string;
    commerceNumber: string;
    taxNumber: string;
    representedBy: string;
    qualityRepresentive: string;
    subcontractorTel: string;
    [key: string]: unknown; // Index signature for API compatibility
}

const useSubcontractors = () => {
    const [tableData, setTableData] = useState<Subcontractor[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const { getToken } = useAuth();
    const { toaster } = useToast();

    const getSubcontractors = useCallback(async () => {
        setLoading(true);
        const token = getToken();

        try {
            const data = await apiRequest({
                endpoint: "Subcontractors/GetSubcontractors",
                method: "GET",
                token: token ?? "",
            });
            if (data && Array.isArray(data)) {
                setTableData(data);
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error("useSubcontractors: Error during API request:", error);
            toaster.error("Failed to load subcontractors");
        } finally {
            setLoading(false);
        }
    }, [getToken, toaster]);

    const createSubcontractor = useCallback(async (subcontractor: SubcontractorFormData) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: "Subcontractors/CreateSubcontractor",
                method: "POST",
                token: token ?? "",
                body: subcontractor,
            });

            if (response) {
                toaster.success("Subcontractor created successfully");
                await getSubcontractors();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error("useSubcontractors: Error creating subcontractor:", error);
            toaster.error("Failed to create subcontractor");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getSubcontractors]);

    const updateSubcontractor = useCallback(async (subcontractor: Subcontractor) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: "Subcontractors/UpdateSubcontractor",
                method: "PUT",
                token: token ?? "",
                body: subcontractor,
            });

            if (response) {
                toaster.success("Subcontractor updated successfully");
                await getSubcontractors();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error("useSubcontractors: Error updating subcontractor:", error);
            toaster.error("Failed to update subcontractor");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getSubcontractors]);

    const deleteSubcontractor = useCallback(async (id: number) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: `Subcontractors/DeleteSubcontractor/${id}`,
                method: "DELETE",
                token: token ?? "",
            });

            if (response) {
                toaster.success("Subcontractor deleted successfully");
                await getSubcontractors();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error("useSubcontractors: Error deleting subcontractor:", error);
            toaster.error("Failed to delete subcontractor");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getSubcontractors]);

    return {
        tableData,
        loading,
        saving,
        getSubcontractors,
        createSubcontractor,
        updateSubcontractor,
        deleteSubcontractor,
    };
};

export default useSubcontractors;
