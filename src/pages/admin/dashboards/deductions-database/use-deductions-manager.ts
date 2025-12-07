import { useCallback, useEffect, useState } from "react";

import { fetchManagerLabors, fetchManagerMachines, fetchManagerMaterials } from "@/api/services/deductionsApi";
import { useAuth } from "@/contexts/auth";

// Static column definitions for Manager Data
const LABOR_COLUMNS_MANAGER = {
    type_of_worker: "Labor Type",
    unit: "Unit",
    unit_price: "Unit Price",
};

const MATERIALS_COLUMNS_MANAGER = {
    bc: "REF #",
    designation: "Item",
    unit: "Unit",
    sale_unit: "Unit Price",
    allocated: "Allocated Quantity",
    transfered_qte: "Transferred Quantity",
    transfered_to: "Transferred to",
    stock_qte: "Stock Quantity",
    remark: "Remarks",
};

const MACHINES_COLUMNS_MANAGER = {
    ref: "REF #",
    machine_acronym: "Machine Code",
    machine_type: "Type of Machine",
    unit: "unit",
    unit_price: "Unit Price",
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
    };
};

export default useDeductionsManager;
