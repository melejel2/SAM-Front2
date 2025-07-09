import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useBuildings = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");

    const { getToken } = useAuth();

    const token = getToken();

    const columns = {
        buildingName: "Building Name",
        buildingCode: "Building Code",
        projectName: "Project",
        floors: "Floors",
        area: "Area (m²)",
        status: "Status",
    };

    const inputFields = [
        {
            name: "buildingName",
            label: "Building Name",
            type: "text",
            required: true,
        },
        {
            name: "buildingCode",
            label: "Building Code",
            type: "text",
            required: true,
        },
        {
            name: "projectId",
            label: "Project",
            type: "select",
            required: true,
            options: [], // Will be populated dynamically
        },
        {
            name: "floors",
            label: "Number of Floors",
            type: "number",
            required: true,
        },
        {
            name: "area",
            label: "Area (m²)",
            type: "number",
            required: true,
        },
        {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: ["Active", "Under Construction", "Completed"],
        },
    ];

    const getBuildings = async (projectId?: string) => {
        setLoading(true);

        try {
            const endpoint = projectId 
                ? `Building/GetBuildingsList?projectId=${projectId}`
                : "Building/GetBuildingsList";
                
            const data = await apiRequest({
                endpoint,
                method: "GET",
                token: token ?? "",
            });
            if (data) {
                setTableData(data);
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getProjectNames = async () => {
        try {
            const data = await apiRequest({
                endpoint: "Project/GetProjectNames",
                method: "GET",
                token: token ?? "",
            });
            return data || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    return {
        columns,
        tableData,
        inputFields,
        loading,
        selectedProjectId,
        setSelectedProjectId,
        getBuildings,
        getProjectNames,
    };
};

export default useBuildings; 