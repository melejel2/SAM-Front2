import { useState, useCallback, useRef, useMemo } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

// Cache duration constant - defined outside hook for stable reference
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

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

    // Cache for projects and buildings to avoid redundant API calls
    // Separate cache for archived and non-archived projects
    const projectsCacheRef = useRef<{ 
        normal: { data: Project[] | null; timestamp: number };
        archived: { data: Project[] | null; timestamp: number };
    }>({ 
        normal: { data: null, timestamp: 0 },
        archived: { data: null, timestamp: 0 }
    });
    const buildingsCacheRef = useRef<Map<number, { data: Building[]; timestamp: number }>>(new Map());

    // Memoize static column definitions to prevent recreation on every render
    const columns = useMemo(() => ({
        code: "Code",
        name: "Name",
        acronym: "Acronym",
        city: "City",
    }), []);

    const inputFields = useMemo(() => [
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
    ], []);

    const getProjectsList = useCallback(async (forceRefresh = false) => {
        // Determine if we're in archive mode
        const isArchiveMode = localStorage.getItem("__SAM_ARCHIVE_MODE__") === "true";
        const cacheKey = isArchiveMode ? "archived" : "normal";
        
        console.log("🔍 getProjectsList called:", { isArchiveMode, cacheKey, forceRefresh });
        
        // Check cache first
        const now = Date.now();
        const cache = projectsCacheRef.current[cacheKey];

        if (!forceRefresh && cache.data && (now - cache.timestamp) < CACHE_DURATION) {
            console.log("📦 Using cached data for:", cacheKey);
            setTableData(cache.data);
            return;
        }

        console.log("🌐 Fetching fresh data for:", cacheKey);
        setLoading(true);
        try {
            // The isArchive parameter will be automatically added by the API interceptor
            const data = await apiRequest<Project[]>({
                endpoint: "Project/GetProjectsList",
                method: "GET",
                token: token ?? "",
            });

            console.log("✅ Fetched projects:", { count: Array.isArray(data) ? data.length : 0, mode: cacheKey });

            if (data && Array.isArray(data)) {
                // Sort by ID descending (latest first)
                const sortedData = [...data].sort((a, b) => b.id - a.id);
                setTableData(sortedData);
                // Update cache for the current mode
                projectsCacheRef.current[cacheKey] = { data: sortedData, timestamp: now };
            } else {
                setTableData([]);
                projectsCacheRef.current[cacheKey] = { data: [], timestamp: now };
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
            setTableData([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const getBuildingsList = useCallback(async (projectId: number, forceRefresh = false) => {
        // Check cache first
        const now = Date.now();
        const cache = buildingsCacheRef.current.get(projectId);

        if (!forceRefresh && cache && (now - cache.timestamp) < CACHE_DURATION) {
            setBuildings(cache.data);
            return;
        }

        try {
            const data = await apiRequest<Building[]>({
                endpoint: `Building/GetBuildingsList?projectId=${projectId}`,
                method: "GET",
                token: token ?? "",
            });

            if (data && Array.isArray(data)) {
                setBuildings(data);
                // Update cache
                buildingsCacheRef.current.set(projectId, { data, timestamp: now });
            } else {
                setBuildings([]);
                buildingsCacheRef.current.set(projectId, { data: [], timestamp: now });
            }
        } catch (error) {
            console.error("Error fetching buildings:", error);
            setBuildings([]);
        }
    }, [token]);

    const createProject = useCallback(async (projectData: Omit<Project, "id">) => {
        try {
            const result = await apiRequest({
                endpoint: "Project/CreateProject",
                method: "POST",
                token: token ?? "",
                body: projectData,
            });

            if (result && (result as any).success !== false) {
                // Invalidate both caches
                projectsCacheRef.current.normal = { data: null, timestamp: 0 };
                projectsCacheRef.current.archived = { data: null, timestamp: 0 };
                await getProjectsList(true);
                return { success: true };
            }
            return { success: false, message: "Failed to create project" };
        } catch (error) {
            console.error("Error creating project:", error);
            return { success: false, message: "Error creating project" };
        }
    }, [token, getProjectsList]);

    const updateProject = useCallback(async (projectData: Project) => {
        try {
            const result = await apiRequest({
                endpoint: "Project/UpdateProject",
                method: "PUT",
                token: token ?? "",
                body: projectData,
            });

            if (result && (result as any).success !== false) {
                // Invalidate both caches
                projectsCacheRef.current.normal = { data: null, timestamp: 0 };
                projectsCacheRef.current.archived = { data: null, timestamp: 0 };
                await getProjectsList(true);
                return { success: true };
            }
            return { success: false, message: "Failed to update project" };
        } catch (error) {
            console.error("Error updating project:", error);
            return { success: false, message: "Error updating project" };
        }
    }, [token, getProjectsList]);

    const deleteProject = useCallback(async (projectId: number) => {
        try {
            const result = await apiRequest({
                endpoint: `Project/DeleteProject/${projectId}`,
                method: "DELETE",
                token: token ?? "",
            });

            if (result && (result as any).success !== false) {
                // Invalidate both caches
                projectsCacheRef.current.normal = { data: null, timestamp: 0 };
                projectsCacheRef.current.archived = { data: null, timestamp: 0 };
                buildingsCacheRef.current.delete(projectId);
                await getProjectsList(true);
                return { success: true };
            }

            return { success: false, message: (result as any)?.message || "Failed to delete project" };
        } catch (error) {
            console.error("Error deleting project:", error);
            return { success: false, message: "Error deleting project" };
        }
    }, [token, getProjectsList]);

    const openProject = useCallback(async (projectId: number) => {
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
    }, [token]);

    const archiveProject = useCallback(async (projectId: number) => {
        try {
            const result = await apiRequest({
                endpoint: `Project/ArchiveProject/${projectId}`,
                method: "POST",
                token: token ?? "",
            });

            if (result && (result as any).success !== false) {
                // Invalidate both caches (archiving moves project between databases)
                projectsCacheRef.current.normal = { data: null, timestamp: 0 };
                projectsCacheRef.current.archived = { data: null, timestamp: 0 };
                buildingsCacheRef.current.delete(projectId);
                await getProjectsList(true);
                return { success: true, message: "Project archived successfully" };
            }

            return { success: false, message: (result as any)?.message || "Failed to archive project" };
        } catch (error) {
            console.error("Error archiving project:", error);
            return { success: false, message: "Error archiving project" };
        }
    }, [token, getProjectsList]);

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
        archiveProject,
    };
};

export default useBudgetBOQs;
