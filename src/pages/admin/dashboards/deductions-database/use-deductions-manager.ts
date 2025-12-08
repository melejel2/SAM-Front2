import { useCallback, useEffect, useState } from "react";

import { fetchManagerLabors, fetchManagerMachines, fetchManagerMaterials } from "@/api/services/deductionsApi";
import { useAuth } from "@/contexts/auth";

// Static column definitions for Manager Data
const LABOR_COLUMNS_MANAGER = {
    laborType: "Labor Type",
    unit: "Unit",
    unitPrice: "Unit Price",
};

const MATERIALS_COLUMNS_MANAGER = {
    poRef: "REF #",
    item: "Item",
    unit: "Unit",
    unitPrice: "Unit Price",
    orderdQte: "Orderd Qte",
    deliveredQte: "Delivered Qte",
};

const MACHINES_COLUMNS_MANAGER = {
    ref: "REF #",
    machineAcronym: "Machine Code",
    machineType: "Type of Machine",
    unit: "unit",
    unitPrice: "Unit Price",
    quantity: "Quantity",
    amount: "Amount",
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

    return {
        managerLoading: loading,
        managerLaborData: laborData,
        managerMaterialsData: materialsData,
        managerMachinesData: machinesData,
        managerLaborColumns: LABOR_COLUMNS_MANAGER,
        managerMaterialsColumns: MATERIALS_COLUMNS_MANAGER,
        managerMachinesColumns: MACHINES_COLUMNS_MANAGER,
        fetchManagerData, // Expose fetchManagerData
    };
};

export default useDeductionsManager;
