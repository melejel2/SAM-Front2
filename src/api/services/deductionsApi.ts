import apiRequest from "../api";

type ApiErrorResponse = {
    isSuccess: false;
    success: false;
    message: string;
    status?: number;
};

export interface Labor {
    id: number;
    laborTypeId: number;
    contractDataSetId: number;
    ref: string;
    laborType: string;
    activityDescription: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    amount: number;
}

export interface LaborDataBase {
    id: number;
    laborType: string;
    unit: string;
    unitPrice: number;
}

export interface MachineDataBase {
    id: number;
    acronym: string;
    type: string;
    unit: string;
    unitPrice: number;
}

export interface Material {
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
    contract: string;
    remark: string;
}

export interface Machine {
    id: number;
    machineCodeId: number;
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

export const fetchManagerMachines = async (token: string): Promise<MachineDataBase[] | ApiErrorResponse> => {
    return apiRequest<MachineDataBase[]>({
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

export const deleteManagerLabor = async (
    id: number,
    token: string,
): Promise<{ success: boolean } | ApiErrorResponse> => {
    return apiRequest<{ success: boolean }>({
        endpoint: `DeductionsManager/labors/${id}`,
        method: "DELETE",
        token: token,
    });
};

export const addManagerMaterial = async (
    materialData: Omit<Material, "id">,
    token: string,
): Promise<Material | ApiErrorResponse> => {
    return apiRequest<Material>({
        endpoint: `DeductionsManager/poe`,
        method: "POST",
        token: token,
        body: materialData as unknown as Record<string, unknown>,
    });
};

export const updateManagerMaterial = async (
    materialData: Material,
    token: string,
): Promise<Material | ApiErrorResponse> => {
    return apiRequest<Material>({
        endpoint: `DeductionsManager/poe`,
        method: "POST",
        token: token,
        body: materialData as unknown as Record<string, unknown>,
    });
};

export const deleteManagerMaterial = async (
    id: number,
    token: string,
): Promise<{ success: boolean } | ApiErrorResponse> => {
    return apiRequest<{ success: boolean }>({
        endpoint: `DeductionsManager/poe/${id}`,
        method: "DELETE",
        token: token,
    });
};

export const addManagerMachine = async (
    machineData: Omit<Machine, "id">,
    token: string,
): Promise<Machine | ApiErrorResponse> => {
    return apiRequest<Machine>({
        endpoint: `DeductionsManager/machines`,
        method: "POST",
        token: token,
        body: machineData as unknown as Record<string, unknown>,
    });
};

export const updateManagerMachine = async (
    machineData: Machine,
    token: string,
): Promise<Machine | ApiErrorResponse> => {
    return apiRequest<Machine>({
        endpoint: `DeductionsManager/machines`,
        method: "POST",
        token: token,
        body: machineData as unknown as Record<string, unknown>,
    });
};

export const deleteManagerMachine = async (
    id: number,
    token: string,
): Promise<{ success: boolean } | ApiErrorResponse> => {
    return apiRequest<{ success: boolean }>({
        endpoint: `DeductionsManager/machines/${id}`,
        method: "DELETE",
        token: token,
    });
};

export const uploadManagerPoe = async (
    excelFile: File,
    token: string,
): Promise<{ success: boolean } | ApiErrorResponse> => {
    const formData = new FormData();
    formData.append("excelFile", excelFile);

    return apiRequest<{ success: boolean }>({
        endpoint: `DeductionsManager/UploadPoe`,
        method: "POST",
        token: token,
        body: formData,
    });
};

export const addContractLabor = async (
    contractDataSetId: number,
    laborData: Omit<Labor, "id" | "amount">,
    token: string,
): Promise<Labor | ApiErrorResponse> => {
    return apiRequest<Labor>({
        endpoint: `Deductions/labors`,
        method: "POST",
        token: token,
        body: { ...laborData, contractDataSetId } as unknown as Record<string, unknown>,
    });
};

export const updateContractLabor = async (
    contractDataSetId: number,
    laborData: Labor,
    token: string,
): Promise<Labor | ApiErrorResponse> => {
    return apiRequest<Labor>({
        endpoint: `Deductions/labors`,
        method: "PUT",
        token: token,
        body: { ...laborData, contractDataSetId } as unknown as Record<string, unknown>,
    });
};

export const deleteContractLabor = async (
    laborId: number,
    token: string,
): Promise<{ success: boolean } | ApiErrorResponse> => {
    return apiRequest<{ success: boolean }>({
        endpoint: `Deductions/labors/${laborId}`,
        method: "DELETE",
        token: token,
    });
};

export const addContractMaterial = async (
    contractDataSetId: number,
    materialData: Omit<Material, "id">,
    token: string,
): Promise<Material | ApiErrorResponse> => {
    return apiRequest<Material>({
        endpoint: `Deductions/materials`,
        method: "POST",
        token: token,
        body: { ...materialData, contractDataSetId } as unknown as Record<string, unknown>,
    });
};

export const updateContractMaterial = async (
    materialData: Material, // Omit id for the body, but use it in the URL
    token: string,
): Promise<Material | ApiErrorResponse> => {
    return apiRequest<Material>({
        endpoint: `Deductions/materials`,
        method: "PUT",
        token: token,
        body: materialData as unknown as Record<string, unknown>,
    });
};

export const deleteContractMaterial = async (
    materialId: number,
    token: string,
): Promise<{ success: boolean } | ApiErrorResponse> => {
    return apiRequest<{ success: boolean }>({
        endpoint: `Deductions/materials/${materialId}`,
        method: "DELETE",
        token: token,
    });
};

export const addContractMachine = async (
    contractDataSetId: number,
    machineData: Omit<Machine, "id">,
    token: string,
): Promise<Machine | ApiErrorResponse> => {
    return apiRequest<Machine>({
        endpoint: `Deductions/machines`,
        method: "POST",
        token: token,
        body: { ...machineData, contractDataSetId } as unknown as Record<string, unknown>,
    });
};

export const updateContractMachine = async (
    contractDataSetId: number,
    machineData: Machine, // Omit id for the body, but use it in the URL
    token: string,
): Promise<Machine | ApiErrorResponse> => {
    return apiRequest<Machine>({
        endpoint: `Deductions/machines`,
        method: "PUT",
        token: token,
        body: { ...machineData, contractDataSetId } as unknown as Record<string, unknown>,
    });
};

export const deleteContractMachine = async (
    machineId: number,
    token: string,
): Promise<{ success: boolean } | ApiErrorResponse> => {
    return apiRequest<{ success: boolean }>({
        endpoint: `Deductions/machines/${machineId}`,
        method: "DELETE",
        token: token,
    });
};
