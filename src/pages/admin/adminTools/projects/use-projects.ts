import { useState, useCallback } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

export interface Project {
    id: number;
    name: string; // Alias for projectName, used by some components
    projectName: string | null;
    projectCode: string | null;
    client: string | null;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    status: string | null;
    [key: string]: unknown; // Index signature for API compatibility
}

export interface ProjectFormData {
    projectName: string;
    projectCode: string;
    client: string;
    location: string;
    startDate: string;
    endDate: string;
    status: string;
    [key: string]: unknown; // Index signature for API compatibility
}

const STATUS_OPTIONS = ["Active", "Completed", "On Hold", "Cancelled"];

const useProjects = () => {
    const [tableData, setTableData] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [uploadLoading, setUploadLoading] = useState<boolean>(false);

    const { getToken } = useAuth();
    const { toaster } = useToast();

    const getProjects = useCallback(async () => {
        setLoading(true);
        const token = getToken();

        try {
            const data = await apiRequest({
                endpoint: "Project/GetProjects",
                method: "GET",
                token: token ?? "",
            });
            if (data && Array.isArray(data)) {
                // Map data to ensure 'name' field is populated for backward compatibility
                const mappedData: Project[] = data.map((item: any) => ({
                    ...item,
                    name: item.name || item.projectName || "",
                }));
                setTableData(mappedData);
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error("useProjects: Error during API request:", error);
            toaster.error("Failed to load projects");
        } finally {
            setLoading(false);
        }
    }, [getToken, toaster]);

    const createProject = useCallback(async (project: ProjectFormData) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: "Project/CreateProject",
                method: "POST",
                token: token ?? "",
                body: project,
            });

            if (response) {
                toaster.success("Project created successfully");
                await getProjects();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error("useProjects: Error creating project:", error);
            toaster.error("Failed to create project");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getProjects]);

    const updateProject = useCallback(async (project: Project) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: "Project/UpdateProject",
                method: "PUT",
                token: token ?? "",
                body: project,
            });

            if (response) {
                toaster.success("Project updated successfully");
                await getProjects();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error("useProjects: Error updating project:", error);
            toaster.error("Failed to update project");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getProjects]);

    const deleteProject = useCallback(async (id: number) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: `Project/DeleteProject/${id}`,
                method: "DELETE",
                token: token ?? "",
            });

            if (response) {
                toaster.success("Project deleted successfully");
                await getProjects();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error("useProjects: Error deleting project:", error);
            toaster.error("Failed to delete project");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getProjects]);

    const uploadBoq = useCallback(async (projectId: string, file: File) => {
        setUploadLoading(true);
        const token = getToken();

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
            console.error("useProjects: Error uploading BOQ:", error);
            toaster.error("Failed to upload BOQ");
        } finally {
            setUploadLoading(false);
        }
    }, [getToken, toaster, getProjects]);

    const openProject = useCallback(async (projectId: string) => {
        const token = getToken();

        try {
            const data = await apiRequest({
                endpoint: `Project/OpenProject/${projectId}`,
                method: "GET",
                token: token ?? "",
            });
            return data;
        } catch (error) {
            console.error("useProjects: Error opening project:", error);
            toaster.error("Failed to open project");
            return null;
        }
    }, [getToken, toaster]);

    return {
        tableData,
        loading,
        saving,
        uploadLoading,
        statusOptions: STATUS_OPTIONS,
        getProjects,
        createProject,
        updateProject,
        deleteProject,
        uploadBoq,
        openProject,
    };
};

export default useProjects;
