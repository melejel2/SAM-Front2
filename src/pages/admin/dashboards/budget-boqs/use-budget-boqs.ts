import { useState, useEffect } from "react";
import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

interface Project {
    id: number;
    code: string;
    name: string;
    acronym: string;
    city: string;
    currencyId?: number;
    [key: string]: any;
}

interface Building {
    id: number;
    name: string;
    type: string;
    levels?: number;
    projectId: number;
}

const useBudgetBOQs = () => {
    const [tableData, setTableData] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [buildings, setBuildings] = useState<Building[]>([]);

    const { getToken } = useAuth();
    const token = getToken();

    const columns = {
        code: "Code",
        name: "Name",
        acronym: "Acronym",
        city: "City",
    };

    const inputFields = [
        {
            name: "code",
            label: "Code",
            type: "text",
            required: true,
        },
        {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
        },
        {
            name: "acronym",
            label: "Acronym",
            type: "text",
            required: true,
        },
        {
            name: "city",
            label: "City",
            type: "text",
            required: true,
        },
    ];

    const getProjectsList = async () => {
        setLoading(true);
        try {
            const data = await apiRequest<Project[]>({
                endpoint: "Project/GetProjectsList",
                method: "GET",
                token: token ?? "",
            });
            
            if (data && Array.isArray(data)) {
                setTableData(data);
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
            setTableData([]);
        } finally {
            setLoading(false);
        }
    };

    const getBuildingsList = async (projectId: number) => {
        try {
            const data = await apiRequest<Building[]>({
                endpoint: `Building/GetBuildingsList?projectId=${projectId}`,
                method: "GET",
                token: token ?? "",
            });
            
            if (data && Array.isArray(data)) {
                setBuildings(data);
            } else {
                setBuildings([]);
            }
        } catch (error) {
            console.error("Error fetching buildings:", error);
            setBuildings([]);
        }
    };

    const createProject = async (projectData: Omit<Project, "id">) => {
        try {
            const result = await apiRequest({
                endpoint: "Project/CreateProject",
                method: "POST",
                token: token ?? "",
                body: projectData,
            });
            
            if (result && (result as any).success !== false) {
                await getProjectsList();
                return { success: true };
            }
            return { success: false, message: "Failed to create project" };
        } catch (error) {
            console.error("Error creating project:", error);
            return { success: false, message: "Error creating project" };
        }
    };

    const updateProject = async (projectData: Project) => {
        try {
            const result = await apiRequest({
                endpoint: "Project/UpdateProject",
                method: "PUT",
                token: token ?? "",
                body: projectData,
            });
            
            if (result && (result as any).success !== false) {
                await getProjectsList();
                return { success: true };
            }
            return { success: false, message: "Failed to update project" };
        } catch (error) {
            console.error("Error updating project:", error);
            return { success: false, message: "Error updating project" };
        }
    };

    const deleteProject = async (projectId: number) => {
        try {
            const result = await apiRequest({
                endpoint: `Project/DeleteProject/${projectId}`,
                method: "DELETE",
                token: token ?? "",
            });
            
            if (result && (result as any).success !== false) {
                await getProjectsList();
                return { success: true };
            }
            return { success: false, message: "Failed to delete project" };
        } catch (error) {
            console.error("Error deleting project:", error);
            return { success: false, message: "Error deleting project" };
        }
    };

    const openProject = async (projectId: number) => {
        try {
            const data = await apiRequest({
                endpoint: `Project/OpenProject/${projectId}`,
                method: "GET",
                token: token ?? "",
            });
            
            return data;
        } catch (error) {
            console.error("Error opening project:", error);
            return null;
        }
    };

    // Remove automatic token-based fetch to prevent conflicts with location-based fetch
    // useEffect(() => {
    //     if (token) {
    //         getProjectsList();
    //     }
    // }, [token]);

    return {
        columns,
        tableData,
        inputFields,
        loading,
        selectedProject,
        buildings,
        setSelectedProject,
        getProjectsList,
        getBuildingsList,
        createProject,
        updateProject,
        deleteProject,
        openProject,
    };
};

export default useBudgetBOQs;
