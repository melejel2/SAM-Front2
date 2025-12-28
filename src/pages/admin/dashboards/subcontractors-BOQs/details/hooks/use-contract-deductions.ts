import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/auth";
import {
    Labor,
    LaborDataBase,
    Machine,
    MachineDataBase,
    Material,
    addContractLabor,
    addContractMachine,
    addContractMaterial,
    deleteContractLabor,
    deleteContractMachine,
    deleteContractMaterial,
    fetchLabors,
    fetchMachines,
    fetchManagerLabors,
    fetchManagerMachines,
    fetchMaterials,
    updateContractLabor,
    updateContractMachine,
    updateContractMaterial,
} from "@/api/services/deductionsApi";

// Static column definitions
const LABOR_COLUMNS = {
    ref: "REF #",
    laborType: "Type of Worker",
    activityDescription: "Description",
    unit: "Unit",
    unitPrice: "Unit Price",
    quantity: "Quantity",
    amount: "Amount",
};

const MATERIALS_COLUMNS = {
    bc: "REF #",
    designation: "Item",
    unit: "Unit",
    saleUnit: "Unit Price",
    allocated: "Allocated Qty",
    transferedQte: "Transferred Qty",
    transferedTo: "Transferred to",
    stockQte: "Stock Qty",
    remark: "Remarks",
};

const MACHINES_COLUMNS = {
    ref: "REF #",
    machineAcronym: "Machine Code",
    machineType: "Type of Machine",
    unit: "Unit",
    unitPrice: "Unit Price",
    quantity: "Quantity",
    amount: "Amount",
};

// Unit options for dropdowns
const UNIT_OPTIONS = [
    "HR", "DAY", "WEEK", "MONTH", "LUMPSUM",
    "M", "M2", "M3", "KG", "TON", "PIECE", "SET", "UNIT"
];

interface UseContractDeductionsProps {
    contractId: number | null;
}

const useContractDeductions = ({ contractId }: UseContractDeductionsProps) => {
    const [loading, setLoading] = useState(false);
    const [laborData, setLaborData] = useState<Labor[]>([]);
    const [materialsData, setMaterialsData] = useState<Material[]>([]);
    const [machinesData, setMachinesData] = useState<Machine[]>([]);

    // Manager data for dropdowns
    const [laborTypeOptions, setLaborTypeOptions] = useState<string[]>([]);
    const [managerLaborTypes, setManagerLaborTypes] = useState<LaborDataBase[]>([]);
    const [machineAcronymOptions, setMachineAcronymOptions] = useState<string[]>([]);
    const [managerMachines, setManagerMachines] = useState<MachineDataBase[]>([]);

    const { getToken } = useAuth();

    // Memoized columns
    const laborColumns = useMemo(() => LABOR_COLUMNS, []);
    const materialsColumns = useMemo(() => MATERIALS_COLUMNS, []);
    const machinesColumns = useMemo(() => MACHINES_COLUMNS, []);
    const unitOptions = useMemo(() => UNIT_OPTIONS, []);

    // Fetch manager labor types for dropdown
    useEffect(() => {
        const fetchLaborTypes = async () => {
            const currentToken = getToken();
            if (currentToken) {
                try {
                    const managerLabors = await fetchManagerLabors(currentToken);
                    if (Array.isArray(managerLabors)) {
                        setManagerLaborTypes(managerLabors);
                        const uniqueTypes = [...new Set(managerLabors.map((l: LaborDataBase) => l.laborType))];
                        setLaborTypeOptions(uniqueTypes);
                    }
                } catch (error) {
                    console.error("Failed to fetch manager labor types:", error);
                }
            }
        };
        fetchLaborTypes();
    }, [getToken]);

    // Fetch manager machine types for dropdown
    useEffect(() => {
        const fetchMachineTypes = async () => {
            const currentToken = getToken();
            if (currentToken) {
                try {
                    const managerMachinesResult = await fetchManagerMachines(currentToken);
                    if (Array.isArray(managerMachinesResult)) {
                        setManagerMachines(managerMachinesResult);
                        const uniqueAcronyms = [
                            ...new Set(managerMachinesResult.map((m: MachineDataBase) => m.acronym)),
                        ];
                        setMachineAcronymOptions(uniqueAcronyms);
                    }
                } catch (error) {
                    console.error("Failed to fetch manager machine types:", error);
                }
            }
        };
        fetchMachineTypes();
    }, [getToken]);

    // Fetch all deductions data for the contract
    const fetchDeductionsData = useCallback(async () => {
        if (!contractId) {
            setLaborData([]);
            setMaterialsData([]);
            setMachinesData([]);
            return;
        }

        setLoading(true);
        try {
            const currentToken = getToken() ?? "";
            const [laborsResult, materialsResult, machinesResult] = await Promise.all([
                fetchLabors(contractId, currentToken),
                fetchMaterials(contractId, currentToken),
                fetchMachines(contractId, currentToken),
            ]);

            if ("success" in laborsResult && !laborsResult.success) {
                setLaborData([]);
            } else if (Array.isArray(laborsResult)) {
                setLaborData(laborsResult);
            }

            if ("success" in materialsResult && !materialsResult.success) {
                setMaterialsData([]);
            } else if (Array.isArray(materialsResult)) {
                setMaterialsData(materialsResult);
            }

            if ("success" in machinesResult && !machinesResult.success) {
                setMachinesData([]);
            } else if (Array.isArray(machinesResult)) {
                setMachinesData(machinesResult);
            }
        } catch (error) {
            // Error handled silently - data arrays remain empty
        } finally {
            setLoading(false);
        }
    }, [contractId, getToken]);

    // Fetch data when contractId changes
    useEffect(() => {
        if (contractId) {
            fetchDeductionsData();
        } else {
            setLaborData([]);
            setMaterialsData([]);
            setMachinesData([]);
        }
    }, [contractId, fetchDeductionsData]);

    // ============= LABOR CRUD =============
    const addLabor = useCallback(async (laborData: Omit<Labor, "id" | "amount">) => {
        if (!contractId) return { success: false, error: "No contract selected" };

        try {
            const currentToken = getToken() ?? "";
            const result = await addContractLabor(contractId, laborData, currentToken);
            if ("id" in result) {
                await fetchDeductionsData();
                return { success: true, data: result };
            }
            return { success: false, error: result.message };
        } catch (error) {
            return { success: false, error: "Failed to add labor" };
        }
    }, [contractId, getToken, fetchDeductionsData]);

    const updateLabor = useCallback(async (laborData: Labor) => {
        if (!contractId) return { success: false, error: "No contract selected" };

        try {
            const currentToken = getToken() ?? "";
            const result = await updateContractLabor(contractId, laborData, currentToken);
            if ("id" in result) {
                await fetchDeductionsData();
                return { success: true, data: result };
            }
            return { success: false, error: result.message };
        } catch (error) {
            return { success: false, error: "Failed to update labor" };
        }
    }, [contractId, getToken, fetchDeductionsData]);

    const deleteLabor = useCallback(async (laborId: number) => {
        try {
            const currentToken = getToken() ?? "";
            const result = await deleteContractLabor(laborId, currentToken);
            if ("success" in result && result.success) {
                await fetchDeductionsData();
                return { success: true };
            }
            return { success: false, error: "Failed to delete labor" };
        } catch (error) {
            return { success: false, error: "Failed to delete labor" };
        }
    }, [getToken, fetchDeductionsData]);

    // ============= MATERIALS CRUD =============
    const addMaterial = useCallback(async (materialData: Omit<Material, "id">) => {
        if (!contractId) return { success: false, error: "No contract selected" };

        try {
            const currentToken = getToken() ?? "";
            const result = await addContractMaterial(contractId, materialData, currentToken);
            if ("id" in result) {
                await fetchDeductionsData();
                return { success: true, data: result };
            }
            return { success: false, error: result.message };
        } catch (error) {
            return { success: false, error: "Failed to add material" };
        }
    }, [contractId, getToken, fetchDeductionsData]);

    const updateMaterial = useCallback(async (materialData: Material) => {
        try {
            const currentToken = getToken() ?? "";
            const result = await updateContractMaterial(materialData, currentToken);
            if ("id" in result) {
                await fetchDeductionsData();
                return { success: true, data: result };
            }
            return { success: false, error: result.message };
        } catch (error) {
            return { success: false, error: "Failed to update material" };
        }
    }, [getToken, fetchDeductionsData]);

    const deleteMaterial = useCallback(async (materialId: number) => {
        try {
            const currentToken = getToken() ?? "";
            const result = await deleteContractMaterial(materialId, currentToken);
            if ("success" in result && result.success) {
                await fetchDeductionsData();
                return { success: true };
            }
            return { success: false, error: "Failed to delete material" };
        } catch (error) {
            return { success: false, error: "Failed to delete material" };
        }
    }, [getToken, fetchDeductionsData]);

    // ============= MACHINES CRUD =============
    const addMachine = useCallback(async (machineData: Omit<Machine, "id">) => {
        if (!contractId) return { success: false, error: "No contract selected" };

        try {
            const currentToken = getToken() ?? "";
            const result = await addContractMachine(contractId, machineData, currentToken);
            if ("id" in result) {
                await fetchDeductionsData();
                return { success: true, data: result };
            }
            return { success: false, error: result.message };
        } catch (error) {
            return { success: false, error: "Failed to add machine" };
        }
    }, [contractId, getToken, fetchDeductionsData]);

    const updateMachine = useCallback(async (machineData: Machine) => {
        if (!contractId) return { success: false, error: "No contract selected" };

        try {
            const currentToken = getToken() ?? "";
            const result = await updateContractMachine(contractId, machineData, currentToken);
            if ("id" in result) {
                await fetchDeductionsData();
                return { success: true, data: result };
            }
            return { success: false, error: result.message };
        } catch (error) {
            return { success: false, error: "Failed to update machine" };
        }
    }, [contractId, getToken, fetchDeductionsData]);

    const deleteMachine = useCallback(async (machineId: number) => {
        try {
            const currentToken = getToken() ?? "";
            const result = await deleteContractMachine(machineId, currentToken);
            if ("success" in result && result.success) {
                await fetchDeductionsData();
                return { success: true };
            }
            return { success: false, error: "Failed to delete machine" };
        } catch (error) {
            return { success: false, error: "Failed to delete machine" };
        }
    }, [getToken, fetchDeductionsData]);

    // Get manager data for auto-fill
    const getLaborDefaults = useCallback((laborType: string) => {
        const managerLabor = managerLaborTypes.find(l => l.laborType === laborType);
        return managerLabor || null;
    }, [managerLaborTypes]);

    const getMachineDefaults = useCallback((acronym: string) => {
        const managerMachine = managerMachines.find(m => m.acronym === acronym);
        return managerMachine || null;
    }, [managerMachines]);

    return {
        loading,
        // Data
        laborData,
        materialsData,
        machinesData,
        // Columns
        laborColumns,
        materialsColumns,
        machinesColumns,
        // Options for dropdowns
        laborTypeOptions,
        machineAcronymOptions,
        unitOptions,
        // Fetch
        fetchDeductionsData,
        // Labor CRUD
        addLabor,
        updateLabor,
        deleteLabor,
        // Material CRUD
        addMaterial,
        updateMaterial,
        deleteMaterial,
        // Machine CRUD
        addMachine,
        updateMachine,
        deleteMachine,
        // Helpers
        getLaborDefaults,
        getMachineDefaults,
    };
};

export default useContractDeductions;
