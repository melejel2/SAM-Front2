import { useState, useCallback, useMemo } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

const useProjects = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [uploadLoading, setUploadLoading] = useState<boolean>(false);

    const { getToken } = useAuth();
    const { toaster } = useToast();

    const token = getToken();

    // Memoize columns to prevent unnecessary re-renders
    const columns = useMemo(() => ({
        projectName: "Project Name",
        projectCode: "Project Code",
        client: "Client",
        location: "Location",
        startDate: "Start Date",
        endDate: "End Date",
        status: "Status",
    }), []);

    // Memoize inputFields to prevent unnecessary re-renders
    const inputFields = useMemo(() => [
        {
            name: "projectName",
            label: "Project Name",
            type: "text",
            required: true,
        },
        {
            name: "projectCode",
            label: "Project Code",
            type: "text",
            required: true,
        },
        {
            name: "client",
            label: "Client",
            type: "text",
            required: true,
        },
        {
            name: "location",
            label: "Location",
            type: "text",
            required: true,
        },
        {
            name: "startDate",
            label: "Start Date",
            type: "date",
            required: true,
        },
        {
            name: "endDate",
            label: "End Date",
            type: "date",
            required: true,
        },
        {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: ["Active", "Completed", "On Hold", "Cancelled"],
        },
    ], []);

    const getProjects = useCallback(async () => {
        setLoading(true);

        try {
            const data = await apiRequest({
                endpoint: "Project/GetProjectsList",
                method: "GET",
                token: token ?? "",
            });
            if (data) {
                setTableData(data);
                return data;
            } else {
                setTableData([]);
                return [];
            }
        } catch (error) {
            console.error(error);
            return []; // Return empty array on error
        } finally {
            setLoading(false);
        }
    }, [token]);

    const uploadBoq = async (projectId: string, file: File) => {
        setUploadLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("projectId", projectId);

            const result = await apiRequest({
                endpoint: "Project/UploadBoq",
                method: "POST",
                token: token ?? "",
                body: formData,
            });

            if (result && typeof result === "object" && "success" in result) {
                if (result.success) {
                    toaster.success("BOQ uploaded successfully");
                    await getProjects();
                } else {
                    toaster.error(result.message || "Upload failed");
                }
            } else {
                toaster.success("BOQ uploaded successfully");
                await getProjects();
            }
        } catch (error) {
            console.error(error);
            toaster.error("Failed to upload BOQ");
        } finally {
            setUploadLoading(false);
        }
    };

    const openProject = async (projectId: string) => {
        try {
            const data = await apiRequest({
                endpoint: `Project/OpenProject/${projectId}`,
                method: "GET",
                token: token ?? "",
            });
            return data;
        } catch (error) {
            console.error(error);
            toaster.error("Failed to open project");
            return null;
        }
    };

    const saveProject = async (projectData: any) => {
        try {
            const result = await apiRequest({
                endpoint: "Project/SaveProject",
                method: "POST",
                token: token ?? "",
                body: projectData,
            });

            if (result && typeof result === "object" && "success" in result) {
                if (result.success) {
                    toaster.success("Project saved successfully");
                    await getProjects();
                } else {
                    toaster.error(result.message || "Save failed");
                }
            } else {
                toaster.success("Project saved successfully");
                await getProjects();
            }
        } catch (error) {
            console.error(error);
            toaster.error("Failed to save project");
        }
    };

    return {
        columns,
        tableData,
        inputFields,
        loading,
        uploadLoading,
        getProjects,
        uploadBoq,
        openProject,
        saveProject,
    };
};

export default useProjects; 