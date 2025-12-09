import { useCallback, useEffect, useMemo, useState } from "react";

import { getContractsByProjectsAndSub, getSubcontractorsByProjectId } from "@/api/services/contracts-api";
import { useAuth } from "@/contexts/auth";
import useProjects from "@/pages/admin/adminTools/projects/use-projects";
import useSubcontractors from "@/pages/admin/adminTools/subcontractors/use-subcontractors";

import {
    addContractLabor,
    deleteContractLabor,
    fetchContracts as fetchAllContracts,
    fetchLabors,
    fetchMachines,
    fetchMaterials,
    fetchManagerLabors,
    Labor,
    LaborDataBase,
    updateContractLabor,
} from "../../../../api/services/deductionsApi";

// Move static column definitions outside hook to prevent recreation
const LABOR_COLUMNS = {
    ref: "REF #",
    laborType: "Type of Worker",
    activityDescription: "Description of Activity",
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
    allocated: "Allocated Quantity",
    transferedQte: "Transferred Quantity",
    transferedTo: "Transferred to",
    stockQte: "Stock Quantity",
    remark: "Remarks",
};

const MACHINES_COLUMNS = {
    ref: "REF #",
    machineAcronym: "Machine Code",
    machineType: "Type of Machine",
    unit: "unit",
    unitPrice: "Unit Price",
    quantity: "Quantity",
    amount: "Amount",
};

const useDeductionsDatabase = () => {
    const { getProjects } = useProjects();
    const { getSubcontractors: fetchAllSubcontractorsFromHook } = useSubcontractors(); // Renamed to avoid conflict
    const [loading, setLoading] = useState(true);
    const [laborData, setLaborData] = useState<any[]>([]);
    const [materialsData, setMaterialsData] = useState<any[]>([]);
    const [machinesData, setMachinesData] = useState<any[]>([]);

    // State for dropdowns
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>("");

    const [subcontractors, setSubcontractors] = useState<any[]>([]);
    const [allSubcontractors, setAllSubcontractors] = useState<any[]>([]);
    const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>("");

    const [contracts, setContracts] = useState<any[]>([]);
    const [selectedContract, setSelectedContract] = useState<string>("");

    const [laborTypeOptions, setLaborTypeOptions] = useState<string[]>([]);

    const { getToken } = useAuth();
    const token = getToken();

    // Effect to fetch all subcontractors initially
    useEffect(() => {
        const fetchAllSubs = async () => {
            const currentToken = getToken();
            if (currentToken) {
                try {
                    const subs = await fetchAllSubcontractorsFromHook();
                    setAllSubcontractors(subs);
                } catch (error) {
                    console.error("Error fetching all subcontractors:", error);
                    setAllSubcontractors([]);
                }
            }
        };
        fetchAllSubs();
    }, [fetchAllSubcontractorsFromHook, getToken]);

    useEffect(() => {
        const fetchLaborTypes = async () => {
            const currentToken = getToken();
            if (currentToken) {
                try {
                    const managerLabors = await fetchManagerLabors(currentToken);
                    if (Array.isArray(managerLabors)) {
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

    const fetchDeductionsData = useCallback(
        async (contractDataSetId: number) => {
            setLoading(true);
            try {
                const currentToken = token ?? "";
                const [laborsResult, materialsResult, machinesResult] = await Promise.all([
                    fetchLabors(contractDataSetId, currentToken),
                    fetchMaterials(contractDataSetId, currentToken),
                    fetchMachines(contractDataSetId, currentToken),
                ]);

                if ("success" in laborsResult && !laborsResult.success) {
                    console.error("Failed to fetch labors:", laborsResult.message);
                    setLaborData([]);
                } else if (Array.isArray(laborsResult)) {
                    setLaborData(laborsResult);
                }

                if ("success" in materialsResult && !materialsResult.success) {
                    console.error("Failed to fetch materials:", materialsResult.message);
                    setMaterialsData([]);
                } else if (Array.isArray(materialsResult)) {
                    setMaterialsData(materialsResult);
                }

                if ("success" in machinesResult && !machinesResult.success) {
                    console.error("Failed to fetch machines:", machinesResult.message);
                    setMachinesData([]);
                } else if (Array.isArray(machinesResult)) {
                    setMachinesData(machinesResult);
                }
            } catch (error) {
                console.error("Failed to fetch deductions data:", error);
            } finally {
                setLoading(false);
            }
        },
        [token],
    );

    // Effect to clear data when contract selection changes to null or fetch data when a contract is selected
    useEffect(() => {
        if (!selectedContract || selectedContract === "") {
            setLaborData([]);
            setMaterialsData([]);
            setMachinesData([]);
            setLoading(false);
        }
        else {
            fetchDeductionsData(Number(selectedContract));
        }
    }, [selectedContract, fetchDeductionsData]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const fetchedProjects = await getProjects();
                setProjects(fetchedProjects);
                setSelectedProject("");
                setSelectedSubcontractor(""); // Clear subcontractor selection when project changes
                setSelectedContract(""); // Clear contract selection when project changes
            } catch (error) {
                console.error("Error fetching projects:", error);
            }
        };
        fetchProjects();
    }, [getProjects]);

    // Effect to set subcontractors based on selectedProject and allSubcontractors
    useEffect(() => {
        const updateSubcontractorsBasedOnProject = async () => {
            const currentToken = getToken(); // Get fresh token

            if (!currentToken || allSubcontractors.length === 0) {
                setSubcontractors([]);
                setSelectedSubcontractor("");
                setSelectedContract("");
                return;
            }

            let finalSubcontractors: any[] = [];
            if (selectedProject) {
                try {
                    const response = await getSubcontractorsByProjectId(Number(selectedProject), currentToken);
                    if (response.success && response.data && response.data.length > 0) {
                        finalSubcontractors = response.data;
                    } else {
                        console.warn("Project-specific subcontractors not found or fetch failed. Falling back to all subcontractors.");
                        finalSubcontractors = allSubcontractors; // Fallback
                    }
                } catch (error) {
                    console.error("Error fetching project-specific subcontractors:", error);
                    finalSubcontractors = allSubcontractors; // Fallback on error
                }
            } else {
                finalSubcontractors = allSubcontractors; // If no project selected, show all
            }
            
            setSubcontractors(finalSubcontractors);
            setSelectedSubcontractor("");
            setSelectedContract("");
        };
        updateSubcontractorsBasedOnProject();
    }, [selectedProject, allSubcontractors, getToken]); // Depend on selectedProject and allSubcontractors

    // Fetch Contracts based on selected Project and Subcontractor
    useEffect(() => {
        const fetchContracts = async () => {
            console.log("Fetching contracts for Project:", selectedProject, "Subcontractor:", selectedSubcontractor);
            const token = getToken();
            if (selectedProject && selectedSubcontractor && token) {
                try {
                    const response = await getContractsByProjectsAndSub(
                        Number(selectedProject),
                        Number(selectedSubcontractor),
                        token,
                    );
                    if (response.success && response.data) {
                        setContracts(response.data);
                        setSelectedContract("");
                    } else {
                        console.error("Error fetching contracts:", response.message);
                        setContracts([]);
                        setSelectedContract("");
                    }
                } catch (error) {
                    console.error("Error fetching contracts:", error);
                    setContracts([]);
                    setSelectedContract("");
                }
            } else {
                setContracts([]);
                setSelectedContract("");
            }
        };
        fetchContracts();
    }, [selectedProject, selectedSubcontractor, getToken]);

    const addLaborToContract = async (laborData: Omit<Labor, "id" | "amount">) => {
        if (!selectedContract) {
            console.error("No contract selected.");
            return;
        }
        setLoading(true);
        try {
            await addContractLabor(Number(selectedContract), laborData, token ?? "");
            await fetchDeductionsData(Number(selectedContract)); // Refetch
        } catch (error) {
            console.error("Failed to add labor to contract:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateLaborInContract = async (laborData: Labor) => {
        if (!selectedContract) {
            console.error("No contract selected.");
            return;
        }
        setLoading(true);
        try {
            // The update function expects Omit<Labor, "id" | "amount">, so let's create that
            const { id, amount, ...payload } = laborData;
            await updateContractLabor(laborData.id, payload, token ?? "");
            await fetchDeductionsData(Number(selectedContract)); // Refetch
        } catch (error) {
            console.error("Failed to update labor in contract:", error);
        } finally {
            setLoading(false);
        }
    };

    const deleteLaborFromContract = async (laborId: number) => {
        if (!selectedContract) {
            console.error("No contract selected.");
            return;
        }
        setLoading(true);
        try {
            await deleteContractLabor(laborId, token ?? "");
            await fetchDeductionsData(Number(selectedContract)); // Refetch
        } catch (error) {
            console.error("Failed to delete labor from contract:", error);
        } finally {
            setLoading(false);
        }
    };

    const memoizedData = useMemo(
        () => ({
            laborColumns: LABOR_COLUMNS,
            materialsColumns: MATERIALS_COLUMNS,
            machinesColumns: MACHINES_COLUMNS,
            laborData: laborData,
            materialsData: materialsData,
            machinesData: machinesData,

            // Dropdown data and selections
            projects,
            selectedProject,
            setSelectedProject,
            subcontractors,
            selectedSubcontractor,
            setSelectedSubcontractor,
            contracts,
            selectedContract,
            setSelectedContract,

            // Labor type options
            laborTypeOptions,

            // Mutation functions
            addLabor: addLaborToContract,
            updateLabor: updateLaborInContract,
            deleteLabor: deleteLaborFromContract,
        }),
        [
            laborData,
            materialsData,
            machinesData,
            projects,
            selectedProject,
            subcontractors,
            selectedSubcontractor,
            contracts,
            selectedContract,
            laborTypeOptions,
        ],
    );

    return { ...memoizedData, loading };
};

export default useDeductionsDatabase;
