import { useState } from "react";
import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

interface Building {
    id: number;
    name: string;
    type: string;
    levels?: number;
    projectId: number;
}

interface BOQItem {
    id: number;
    no: string;
    key: string;
    unite: string;
    qte: number;
    pu: number;
    costCodeId?: number;
    costCode?: string;
}

interface BOQSheet {
    id: number;
    name: string;
    boqItems: BOQItem[];
    replaceAllItems?: boolean;
}

interface BuildingRequestModel {
    projectId: number;
    name: string;
    buildingNumber: number;
    [key: string]: any;
}

interface ImportBoqRequest {
    projectId: number;
    buildingId: number;
    name?: string;
    excelFile: File;
}

interface ProjectSaveModel {
    id: number;
    currencyId: number;
    buildings: {
        id: number;
        name: string;
        type: string;
        boqSheets: BOQSheet[];
    }[];
    [key: string]: any;
}

interface ClearBoqItemsRequest {
    scope: "Sheet" | "Building" | "Project";
    projectId: number;
    buildingId?: number;
    sheetId?: number;
    [key: string]: any;
}

const useBudgetBOQsDialog = () => {
    const [selectedTrade, setSelectedTrade] = useState<BOQSheet | null>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [boqSheets, setBoqSheets] = useState<BOQSheet[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [projectData, setProjectData] = useState<ProjectSaveModel | null>(null);

    const { getToken } = useAuth();
    const token = getToken();

    const columns = {
        no: "N°",
        key: "Item",
        unite: "Unit",
        qte: "Quantity",
        pu: "Unit Price",
        total_price: "Total Price",
    };

    const createBuildings = async (buildingData: BuildingRequestModel) => {
        try {
            const result = await apiRequest({
                endpoint: "Building/CreateBuilding",
                method: "POST",
                token: token ?? "",
                body: buildingData,
            });
            
            if (result && (result as any).success !== false) {
                return { success: true };
            }
            return { success: false, message: "Failed to create buildings" };
        } catch (error) {
            console.error("Error creating buildings:", error);
            return { success: false, message: "Error creating buildings" };
        }
    };

    const previewBuildings = async (buildingData: BuildingRequestModel) => {
        try {
            const data = await apiRequest({
                endpoint: "Building/PreviewBuildings",
                method: "POST",
                token: token ?? "",
                body: buildingData,
            });
            
            return data;
        } catch (error) {
            console.error("Error previewing buildings:", error);
            return null;
        }
    };

    const uploadBoq = async (importData: ImportBoqRequest) => {
        try {
            const formData = new FormData();
            formData.append('ProjectId', importData.projectId.toString());
            formData.append('BuildingId', importData.buildingId.toString());
            if (importData.name) {
                formData.append('Name', importData.name);
            }
            formData.append('excelFile', importData.excelFile);

            const result = await apiRequest({
                endpoint: "Project/UploadBoq",
                method: "POST",
                token: token ?? "",
                body: formData,
            });
            
            if (result && (result as any).success !== false) {
                return { success: true };
            }
            return { success: false, message: "Failed to upload BOQ" };
        } catch (error) {
            console.error("Error uploading BOQ:", error);
            return { success: false, message: "Error uploading BOQ" };
        }
    };

    const getBoqPreview = async (importData: ImportBoqRequest) => {
        try {
            const formData = new FormData();
            formData.append('ProjectId', importData.projectId.toString());
            formData.append('BuildingId', importData.buildingId.toString());
            if (importData.name) {
                formData.append('Name', importData.name);
            }
            formData.append('excelFile', importData.excelFile);

            const data = await apiRequest({
                endpoint: "Project/GetBoqPreview",
                method: "POST",
                token: token ?? "",
                body: formData,
            });
            
            return data;
        } catch (error) {
            console.error("Error getting BOQ preview:", error);
            return null;
        }
    };

    const saveProject = async (projectData: ProjectSaveModel) => {
        try {
            const result = await apiRequest({
                endpoint: "Project/SaveProject",
                method: "POST",
                token: token ?? "",
                body: projectData,
            });
            
            if (result && (result as any).success !== false) {
                return { success: true };
            }
            return { success: false, message: "Failed to save project" };
        } catch (error) {
            console.error("Error saving project:", error);
            return { success: false, message: "Error saving project" };
        }
    };

    const clearBoq = async (clearData: ClearBoqItemsRequest) => {
        try {
            const result = await apiRequest({
                endpoint: "Project/ClearBoq",
                method: "POST",
                token: token ?? "",
                body: clearData,
            });
            
            if (result && (result as any).success !== false) {
                return { success: true };
            }
            return { success: false, message: "Failed to clear BOQ" };
        } catch (error) {
            console.error("Error clearing BOQ:", error);
            return { success: false, message: "Error clearing BOQ" };
        }
    };

    const calculateTotal = (item: BOQItem) => {
        return item.qte * item.pu;
    };

    const formatCurrency = (amount: number) => {
        if (!amount || isNaN(amount)) return '0.0';
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(amount);
    };

    const formatQuantity = (quantity: number) => {
        if (!quantity || isNaN(quantity)) return '0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(quantity);
    };

    const processBoqData = (boqItems: BOQItem[]) => {
        return boqItems.map(item => ({
            ...item,
            qte: formatQuantity(item.qte),
            pu: formatCurrency(item.pu),
            total_price: formatCurrency(calculateTotal(item))
        }));
    };

    const getBuildingsList = async (projectId: number) => {
        try {
            const data = await apiRequest<Building[]>({
                endpoint: `Building/GetBuildingsList?projectId=${projectId}`,
                method: "GET",
                token: token ?? "",
            });
            
            // Check if it's an error response
            if (data && (data as any).success === false) {
                console.error("GetBuildingsList API error:", (data as any).message);
                setBuildings([]);
                return;
            }
            
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

    const openProject = async (projectId: number) => {
        try {
            const data = await apiRequest({
                endpoint: `Project/OpenProject/${projectId}`,
                method: "GET",
                token: token ?? "",
            });
            
            // Check if the response indicates an error
            if (data && (data as any).success === false) {
                console.warn("OpenProject API returned error:", (data as any).message);
                // Return a basic project structure if OpenProject fails
                return {
                    id: projectId,
                    currencyId: 1,
                    buildings: []
                };
            }
            
            // If we get valid data, return it
            if (data) {
                return data;
            }
            
            // Fallback: return basic structure
            return {
                id: projectId,
                currencyId: 1,
                buildings: []
            };
        } catch (error) {
            console.warn("Error opening project, using fallback:", error);
            // Return a basic project structure as fallback
            return {
                id: projectId,
                currencyId: 1,
                buildings: []
            };
        }
    };


    return {
        columns,
        selectedTrade,
        selectedBuilding,
        buildings,
        boqSheets,
        loading,
        projectData,
        setSelectedTrade,
        setSelectedBuilding,
        setBuildings,
        setBoqSheets,
        setProjectData,
        createBuildings,
        previewBuildings,
        uploadBoq,
        getBoqPreview,
        saveProject,
        clearBoq,
        calculateTotal,
        formatCurrency,
        formatQuantity,
        processBoqData,
        getBuildingsList,
        openProject,
    };
};

export default useBudgetBOQsDialog;
