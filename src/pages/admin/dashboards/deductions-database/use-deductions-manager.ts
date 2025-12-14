import { useCallback, useEffect, useState } from "react";

import {
    LaborDataBase,
    Machine,
    Material,
    addManagerLabor,
    addManagerMachine,
    addManagerMaterial,
    deleteManagerLabor,
    deleteManagerMachine,
    deleteManagerMaterial,
    fetchManagerLabors,
    fetchManagerMachines,
    fetchManagerMaterials,
    updateManagerLabor,
    updateManagerMachine,
    updateManagerMaterial,
    uploadManagerPoe,
} from "@/api/services/deductionsApi";
import { useAuth } from "@/contexts/auth";

const UNIT_OPTIONS = ["HR", "DAY", "WEEK", "MONTH", "LUMPSUM", "M", "M2", "M3", "KG", "TON", "PIECE", "SET", "UNIT"];

// Static column definitions for Manager Data
const LABOR_COLUMNS_MANAGER = {
    laborType: "Labor Type",
    unit: {
        label: "Unit",
        type: "select",
        options: UNIT_OPTIONS,
    },
    unitPrice: "Unit Price",
};

const MATERIALS_COLUMNS_MANAGER = {
    poRef: "REF #",
    item: "Item",
    contractNumber: "Contract",
    unit: {
        label: "Unit",
        type: "select",
        options: UNIT_OPTIONS,
    },
    unitPrice: "Unit Price",
    orderdQte: "Orderd Qte",
    deliveredQte: "Delivered Qte",
};

const MACHINES_COLUMNS_MANAGER = {
    acronym: "Machine Code",
    type: "Type of Machine",
    unit: {
        label: "Unit",
        type: "select",
        options: UNIT_OPTIONS,
    },
    unitPrice: "Unit Price",
};

const useDeductionsManager = (isOpen: boolean) => {
    const [loading, setLoading] = useState(false);
    const [laborData, setLaborData] = useState<any[]>([]);
    const [materialsData, setMaterialsData] = useState<any[]>([]);
    const [machinesData, setMachinesData] = useState<any[]>([]);
    const { getToken } = useAuth();

    const fetchManagerData = useCallback(async () => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            setLoading(false);
            console.error("Authentication token not found.");
            return;
        }

        try {
            const [laborsResult, materialsResult, machinesResult] = await Promise.all([
                fetchManagerLabors(token),
                fetchManagerMaterials(token),
                fetchManagerMachines(token),
            ]);

            setLaborData(Array.isArray(laborsResult) ? laborsResult : []);
            setMaterialsData(Array.isArray(materialsResult) ? materialsResult : []);
            setMachinesData(Array.isArray(machinesResult) ? machinesResult : []);
        } catch (error) {
            console.error("Failed to fetch manager deductions data:", error);
            setLaborData([]);
            setMaterialsData([]);
            setMachinesData([]);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        if (isOpen) {
            fetchManagerData();
        }
    }, [isOpen, fetchManagerData]);

    // --- Labor Functions ---
    const addLabor = async (labor: Omit<LaborDataBase, "id">) => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            setLoading(false);
            console.error("Authentication token not found.");
            return;
        }
        try {
            await addManagerLabor(labor, token);
            await fetchManagerData();
        } catch (error) {
            console.error("Failed to add labor data:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveLabor = async (labor: LaborDataBase) => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            setLoading(false);
            console.error("Authentication token not found.");
            return;
        }
        try {
            await updateManagerLabor(labor, token);
            await fetchManagerData();
        } catch (error) {
            console.error("Failed to save labor data:", error);
        } finally {
            setLoading(false);
        }
    };

    const deleteLabor = async (id: number) => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            setLoading(false);
            console.error("Authentication token not found.");
            return;
        }
        try {
            await deleteManagerLabor(id, token);
            await fetchManagerData();
        } catch (error) {
            console.error("Failed to delete labor data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Material Functions ---
    const addMaterial = async (material: Omit<Material, "id">) => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            setLoading(false);
            console.error("Authentication token not found.");
            return;
        }
        try {
            await addManagerMaterial(material, token);
            await fetchManagerData();
        } catch (error) {
            console.error("Failed to add material data:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveMaterial = async (material: Material) => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            setLoading(false);
            console.error("Authentication token not found.");
            return;
        }
        try {
            await updateManagerMaterial(material, token);
            await fetchManagerData();
        } catch (error) {
            console.error("Failed to save material data:", error);
        } finally {
            setLoading(false);
        }
    };

    const deleteMaterial = async (id: number) => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            setLoading(false);
            console.error("Authentication token not found.");
            return;
        }
        try {
            await deleteManagerMaterial(id, token);
            await fetchManagerData();
        } catch (error) {
            console.error("Failed to delete material data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Machine Functions ---
    const addMachine = async (machine: Omit<Machine, "id">) => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            setLoading(false);
            console.error("Authentication token not found.");
            return;
        }
        try {
            await addManagerMachine(machine, token);
            await fetchManagerData();
        } catch (error) {
            console.error("Failed to add machine data:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveMachine = async (machine: Machine) => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            setLoading(false);
            console.error("Authentication token not found.");
            return;
        }
        try {
            await updateManagerMachine(machine, token);
            await fetchManagerData();
        } catch (error) {
            console.error("Failed to save machine data:", error);
        } finally {
            setLoading(false);
        }
    };

    const deleteMachine = async (id: number) => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            setLoading(false);
            console.error("Authentication token not found.");
            return;
        }
        try {
            await deleteManagerMachine(id, token);
            await fetchManagerData();
        } catch (error) {
            console.error("Failed to delete machine data:", error);
        } finally {
            setLoading(false);
        }
    };

    const importPoeFile = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

        input.onchange = async (event) => {
            const target = event.target as HTMLInputElement;
            if (!target.files?.length) {
                return;
            }
            const file = target.files[0];

            setLoading(true);
            const token = getToken();
            if (!token) {
                setLoading(false);
                console.error("Authentication token not found.");
                return;
            }
            try {
                await uploadManagerPoe(file, token);
                await fetchManagerData();
            } catch (error) {
                console.error("Failed to upload POE file:", error);
            } finally {
                setLoading(false);
            }
        };

        input.click();
    };

    return {
        managerLoading: loading,
        managerLaborData: laborData,
        managerMaterialsData: materialsData,
        managerMachinesData: machinesData,
        managerLaborColumns: LABOR_COLUMNS_MANAGER,
        managerMaterialsColumns: MATERIALS_COLUMNS_MANAGER,
        managerMachinesColumns: MACHINES_COLUMNS_MANAGER,
        fetchManagerData,
        addLabor,
        saveLabor,
        deleteLabor,
        addMaterial,
        saveMaterial,
        deleteMaterial,
        addMachine,
        saveMachine,
        deleteMachine,
        unitOptions: UNIT_OPTIONS,
        importPoeFile,
    };
};

export default useDeductionsManager;
