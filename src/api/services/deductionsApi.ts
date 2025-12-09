import apiRequest from "../api";

type ApiErrorResponse = {
    isSuccess: false;
    success: false;
    message: string;
    status?: number;
};

interface Labor {
    id: number;
    ref: string;
    laborType: string;
    activityDescription: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    amount: number;
}

interface LaborDataBase {
    id: number;
    laborType: string;
    unit: string;
    unitPrice: number;
}

interface Material {
    id: number;
    bc: string;
    designation: string;
    unit: string;
    saleUnit: number;
    quantity: number;
    allocated: number;
    transferedQte: number;
    transferedTo: string;
    stockQte: number;
    remark: string;
}

interface Machine {
    id: number;
    ref: string;
    machineAcronym: string;
    machineType: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    amount: number;
}

export const fetchLabors = async (contractDataSetId: number, token: string): Promise<Labor[] | ApiErrorResponse> => {
    return apiRequest<Labor[]>({
        endpoint: `Deductions/GetLaborsList/${contractDataSetId}`,
        method: "GET",
        token: token,
    });
};

export const fetchMaterials = async (
    contractDataSetId: number,
    token: string,
): Promise<Material[] | ApiErrorResponse> => {
    return apiRequest<Material[]>({
        endpoint: `Deductions/GetVentesList/${contractDataSetId}`,
        method: "GET",
        token: token,
    });
};

export const fetchMachines = async (
    contractDataSetId: number,
    token: string,
): Promise<Machine[] | ApiErrorResponse> => {
    return apiRequest<Machine[]>({
        endpoint: `Deductions/GetMachinesList/${contractDataSetId}`,
        method: "GET",
        token: token,
    });
};

export const fetchContracts = async (token: string): Promise<any[]> => {
    // This is still a placeholder. If there's an actual API to get contracts, it should use apiRequest.
    // For now, it returns dummy data, so no apiRequest call here.
    // However, if the API requires a token, you would pass it here
    return [
        { id: 1, name: "Contract A", contractNumber: "C-001" },
        { id: 2, name: "Contract B", contractNumber: "C-002" },
        { id: 3, name: "Contract C", contractNumber: "C-003" },
    ];
};

export const fetchManagerLabors = async (token: string): Promise<LaborDataBase[] | ApiErrorResponse> => {
    return apiRequest<LaborDataBase[]>({
        endpoint: `DeductionsManager/labors`,
        method: "GET",
        token: token,
    });
};

export const fetchManagerMaterials = async (token: string): Promise<Material[] | ApiErrorResponse> => {
    return apiRequest<Material[]>({
        endpoint: `DeductionsManager/poe`,
        method: "GET",
        token: token,
    });
};

export const fetchManagerMachines = async (token: string): Promise<Machine[] | ApiErrorResponse> => {
    return apiRequest<Machine[]>({
        endpoint: `DeductionsManager/machines`,
        method: "GET",
        token: token,
    });
};

export const addManagerLabor = async (
    laborData: Omit<LaborDataBase, "id">,
    token: string,
): Promise<LaborDataBase | ApiErrorResponse> => {
    return apiRequest<LaborDataBase>({
        endpoint: `DeductionsManager/labors`,
        method: "POST",
        token: token,
        body: laborData as unknown as Record<string, unknown>,
    });
};

export const updateManagerLabor = async (
    laborData: LaborDataBase,
    token: string,
): Promise<LaborDataBase | ApiErrorResponse> => {
    return apiRequest<LaborDataBase>({
        endpoint: `DeductionsManager/labors`,
        method: "POST",
        token: token,
        body: laborData as unknown as Record<string, unknown>,
    });
};

export const deleteManagerLabor = async (id: number, token: string): Promise<{ success: boolean } | ApiErrorResponse> => {
    return apiRequest<{ success: boolean }>({
        endpoint: `DeductionsManager/labors/${id}`,
        method: "DELETE",
        token: token,
    });
};
