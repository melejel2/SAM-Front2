import apiRequest from "../api";

interface Labor {
    id: number;
    ref_nb: string;
    type_of_worker: string;
    description_of_activity: string;
    unit: string;
    unit_price: number;
    qty: number;
    amount: number;
}

interface Material {
    id: number;
    bc: string;
    designation: string;
    unit: string;
    sale_unit: number;
    quantity: number;
    allocated: number;
    transfered_qte: number;
    transfered_to: string;
    stock_qte: number;
    remark: string;
}

interface Machine {
    id: number;
    ref: string;
    machine_acronym: string;
    machine_type: string;
    unit: string;
    unit_price: number;
    quantity: number;
    amount: number;
}

export const fetchLabors = async (contractDataSetId: number, token: string): Promise<Labor[]> => {
    return apiRequest<Labor[]>({
        endpoint: `Deductions/GetLaborsList/${contractDataSetId}`,
        method: "GET",
        token: token,
    });
};

export const fetchMaterials = async (contractDataSetId: number, token: string): Promise<Material[]> => {
    return apiRequest<Material[]>({
        endpoint: `Deductions/GetVentesList/${contractDataSetId}`,
        method: "GET",
        token: token,
    });
};

export const fetchMachines = async (contractDataSetId: number, token: string): Promise<Machine[]> => {
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