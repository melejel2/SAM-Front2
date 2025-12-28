import { useCallback, useEffect, useMemo, useState } from "react";

import {
    AllDeductionsResponse,
    DeductionsFilter,
    LaborDataBase,
    MachineDataBase,
    UnifiedDeduction,
    addContractLabor,
    addContractMachine,
    addContractMaterial,
    deleteContractLabor,
    deleteContractMachine,
    deleteContractMaterial,
    fetchAllDeductions,
    fetchManagerLabors,
    fetchManagerMachines,
    getNextRefNumber,
    updateContractLabor,
    updateContractMachine,
    updateContractMaterial,
} from "@/api/services/deductionsApi";
import { useAuth } from "@/contexts/auth";

// Unit options for dropdowns
export const UNIT_OPTIONS = ["HR", "DAY", "WEEK", "MONTH", "LUMPSUM", "M", "M2", "M3", "KG", "TON", "PIECE", "SET", "UNIT"];

// Column definitions for the unified table
export const UNIFIED_COLUMNS = {
    type: "Type",
    ref: "REF #",
    projectName: "Project",
    subcontractorName: "Subcontractor",
    contractNumber: "Contract",
    subType: "Category",
    description: "Description",
    unit: "Unit",
    unitPrice: "Unit Price",
    quantity: "Quantity",
    amount: "Amount",
    deduction: "Deduction %",
    actAmount: "Deduction $",
};

export interface FilterOptions {
    projects: { id: number; name: string }[];
    subcontractors: { id: number; name: string }[];
    contracts: { id: number; contractNumber: string }[];
}

const useUnifiedDeductions = () => {
    const { getToken } = useAuth();

    // Data state
    const [deductions, setDeductions] = useState<UnifiedDeduction[]>([]);
    const [summary, setSummary] = useState<AllDeductionsResponse["summary"] | null>(null);
    const [loading, setLoading] = useState(true);

    // Filter state
    const [filters, setFilters] = useState<DeductionsFilter>({});
    const [searchTerm, setSearchTerm] = useState("");

    // Master data for auto-fill
    const [laborTypes, setLaborTypes] = useState<LaborDataBase[]>([]);
    const [machineTypes, setMachineTypes] = useState<MachineDataBase[]>([]);

    // Fetch all deductions
    const fetchDeductions = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        setLoading(true);
        try {
            const result = await fetchAllDeductions(token, {
                ...filters,
                search: searchTerm || undefined,
            });

            if ("items" in result) {
                setDeductions(result.items);
                setSummary(result.summary);
            }
        } catch (error) {
            console.error("Failed to fetch deductions:", error);
        } finally {
            setLoading(false);
        }
    }, [getToken, filters, searchTerm]);

    // Derive filter options from data using useMemo - only recomputes when deductions change
    const filterOptions = useMemo<FilterOptions>(() => {
        const projects = new Map<number, string>();
        const subcontractors = new Map<number, string>();
        const contracts = new Map<number, string>();

        for (const item of deductions) {
            if (item.projectId && item.projectName) {
                projects.set(item.projectId, item.projectName);
            }
            if (item.subcontractorId && item.subcontractorName) {
                subcontractors.set(item.subcontractorId, item.subcontractorName);
            }
            if (item.contractDatasetId && item.contractNumber) {
                contracts.set(item.contractDatasetId, item.contractNumber);
            }
        }

        return {
            projects: Array.from(projects.entries()).map(([id, name]) => ({ id, name })),
            subcontractors: Array.from(subcontractors.entries()).map(([id, name]) => ({ id, name })),
            contracts: Array.from(contracts.entries()).map(([id, contractNumber]) => ({ id, contractNumber })),
        };
    }, [deductions]);

    // Fetch master data for auto-fill
    const fetchMasterData = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        try {
            const [laborsResult, machinesResult] = await Promise.all([
                fetchManagerLabors(token),
                fetchManagerMachines(token),
            ]);

            if (Array.isArray(laborsResult)) {
                setLaborTypes(laborsResult);
            }
            if (Array.isArray(machinesResult)) {
                setMachineTypes(machinesResult);
            }
        } catch (error) {
            console.error("Failed to fetch master data:", error);
        }
    }, [getToken]);

    // Initial load
    useEffect(() => {
        fetchDeductions();
        fetchMasterData();
    }, [fetchDeductions, fetchMasterData]);

    // Get auto-filled data for a labor type
    const getAutoFillForLabor = useCallback(
        (laborType: string): Partial<UnifiedDeduction> | null => {
            const match = laborTypes.find((lt) => lt.laborType === laborType);
            if (match) {
                return {
                    unit: match.unit,
                    unitPrice: match.unitPrice,
                    laborTypeId: match.id,
                };
            }
            return null;
        },
        [laborTypes],
    );

    // Get auto-filled data for a machine type
    const getAutoFillForMachine = useCallback(
        (machineAcronym: string): Partial<UnifiedDeduction> | null => {
            const match = machineTypes.find((mt) => mt.acronym === machineAcronym);
            if (match) {
                return {
                    description: match.type,
                    unit: match.unit,
                    unitPrice: match.unitPrice,
                    machineCodeId: match.id,
                };
            }
            return null;
        },
        [machineTypes],
    );

    // Get next reference number
    const getNextRef = useCallback(
        async (contractDatasetId: number, type: "Labor" | "Machine" | "Material"): Promise<string> => {
            const token = getToken();
            if (!token) return "";

            try {
                const result = await getNextRefNumber(contractDatasetId, type, token);
                if ("refNumber" in result) {
                    return result.refNumber;
                }
            } catch (error) {
                console.error("Failed to get next ref number:", error);
            }
            return "";
        },
        [getToken],
    );

    // Add deduction
    const addDeduction = useCallback(
        async (data: Partial<UnifiedDeduction>): Promise<boolean> => {
            const token = getToken();
            if (!token || !data.contractDatasetId || !data.type) return false;

            try {
                if (data.type === "Labor") {
                    await addContractLabor(
                        data.contractDatasetId,
                        {
                            laborTypeId: data.laborTypeId || 0,
                            contractDataSetId: data.contractDatasetId,
                            ref: data.ref || "",
                            laborType: data.subType || "",
                            activityDescription: data.description || "",
                            unit: data.unit || "",
                            unitPrice: data.unitPrice || 0,
                            quantity: data.quantity || 0,
                        },
                        token,
                    );
                } else if (data.type === "Machine") {
                    await addContractMachine(
                        data.contractDatasetId,
                        {
                            machineCodeId: data.machineCodeId || 0,
                            ref: data.ref || "",
                            machineAcronym: data.subType || "",
                            machineType: data.description || "",
                            unit: data.unit || "",
                            unitPrice: data.unitPrice || 0,
                            quantity: data.quantity || 0,
                            amount: 0,
                        },
                        token,
                    );
                } else if (data.type === "Material") {
                    await addContractMaterial(
                        data.contractDatasetId,
                        {
                            bc: data.ref || "",
                            designation: data.description || "",
                            unit: data.unit || "",
                            saleUnit: data.unitPrice || 0,
                            quantity: data.quantity || 0,
                            allocated: data.allocated || 0,
                            transferedQte: data.transferedQte || 0,
                            transferedTo: data.transferedTo || "",
                            stockQte: data.stockQte || 0,
                            contract: data.contractNumber || "",
                            remark: data.remark || "",
                        },
                        token,
                    );
                }

                await fetchDeductions();
                return true;
            } catch (error) {
                console.error("Failed to add deduction:", error);
                return false;
            }
        },
        [getToken, fetchDeductions],
    );

    // Update deduction
    const updateDeduction = useCallback(
        async (data: UnifiedDeduction): Promise<boolean> => {
            const token = getToken();
            if (!token || !data.contractDatasetId) return false;

            try {
                if (data.type === "Labor") {
                    await updateContractLabor(
                        data.contractDatasetId,
                        {
                            id: data.id,
                            laborTypeId: data.laborTypeId || 0,
                            contractDataSetId: data.contractDatasetId,
                            ref: data.ref || "",
                            laborType: data.subType || "",
                            activityDescription: data.description || "",
                            unit: data.unit || "",
                            unitPrice: data.unitPrice || 0,
                            quantity: data.quantity || 0,
                            amount: data.amount || 0,
                        },
                        token,
                    );
                } else if (data.type === "Machine") {
                    await updateContractMachine(
                        data.contractDatasetId,
                        {
                            id: data.id,
                            machineCodeId: data.machineCodeId || 0,
                            ref: data.ref || "",
                            machineAcronym: data.subType || "",
                            machineType: data.description || "",
                            unit: data.unit || "",
                            unitPrice: data.unitPrice || 0,
                            quantity: data.quantity || 0,
                            amount: data.amount || 0,
                        },
                        token,
                    );
                } else if (data.type === "Material") {
                    await updateContractMaterial(
                        {
                            id: data.id,
                            bc: data.ref || "",
                            designation: data.description || "",
                            unit: data.unit || "",
                            saleUnit: data.unitPrice || 0,
                            quantity: data.quantity || 0,
                            allocated: data.allocated || 0,
                            transferedQte: data.transferedQte || 0,
                            transferedTo: data.transferedTo || "",
                            stockQte: data.stockQte || 0,
                            contract: data.contractNumber || "",
                            remark: data.remark || "",
                        },
                        token,
                    );
                }

                await fetchDeductions();
                return true;
            } catch (error) {
                console.error("Failed to update deduction:", error);
                return false;
            }
        },
        [getToken, fetchDeductions],
    );

    // Delete deduction
    const deleteDeduction = useCallback(
        async (data: UnifiedDeduction): Promise<boolean> => {
            const token = getToken();
            if (!token) return false;

            try {
                if (data.type === "Labor") {
                    await deleteContractLabor(data.id, token);
                } else if (data.type === "Machine") {
                    await deleteContractMachine(data.id, token);
                } else if (data.type === "Material") {
                    await deleteContractMaterial(data.id, token);
                }

                await fetchDeductions();
                return true;
            } catch (error) {
                console.error("Failed to delete deduction:", error);
                return false;
            }
        },
        [getToken, fetchDeductions],
    );

    // Filter handlers
    const handleFilterChange = useCallback((key: keyof DeductionsFilter, value: number | string | null) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value || undefined,
        }));
    }, []);

    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
        setSearchTerm("");
    }, []);

    // Memoized filtered data (client-side filtering for instant response)
    const filteredDeductions = useMemo(() => {
        let result = deductions;

        // Apply type filter
        if (filters.type) {
            result = result.filter((d) => d.type === filters.type);
        }

        // Apply project filter
        if (filters.projectId) {
            result = result.filter((d) => d.projectId === filters.projectId);
        }

        // Apply subcontractor filter
        if (filters.subcontractorId) {
            result = result.filter((d) => d.subcontractorId === filters.subcontractorId);
        }

        // Apply contract filter
        if (filters.contractDatasetId) {
            result = result.filter((d) => d.contractDatasetId === filters.contractDatasetId);
        }

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (d) =>
                    d.ref?.toLowerCase().includes(term) ||
                    d.description?.toLowerCase().includes(term) ||
                    d.subType?.toLowerCase().includes(term) ||
                    d.contractNumber?.toLowerCase().includes(term) ||
                    d.projectName?.toLowerCase().includes(term) ||
                    d.subcontractorName?.toLowerCase().includes(term),
            );
        }

        return result;
    }, [deductions, filters, searchTerm]);

    // Labor and machine type options for dropdowns
    const laborTypeOptions = useMemo(() => laborTypes.map((lt) => lt.laborType), [laborTypes]);
    const machineAcronymOptions = useMemo(() => machineTypes.map((mt) => mt.acronym), [machineTypes]);

    return {
        // Data
        deductions: filteredDeductions,
        allDeductions: deductions,
        summary,
        loading,

        // Filters
        filters,
        searchTerm,
        filterOptions,
        handleFilterChange,
        handleSearchChange,
        clearFilters,

        // Master data
        laborTypes,
        machineTypes,
        laborTypeOptions,
        machineAcronymOptions,
        getAutoFillForLabor,
        getAutoFillForMachine,
        getNextRef,

        // CRUD operations
        addDeduction,
        updateDeduction,
        deleteDeduction,
        refetch: fetchDeductions,

        // Constants
        columns: UNIFIED_COLUMNS,
        unitOptions: UNIT_OPTIONS,
    };
};

export default useUnifiedDeductions;
