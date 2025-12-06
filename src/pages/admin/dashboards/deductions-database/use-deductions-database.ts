import { useMemo, useState, useEffect, useCallback } from 'react';
import { getContractsByProjectsAndSub, getSubcontractorsByProjectId } from '@/api/services/contracts-api';
import useSubcontractors from '@/pages/admin/adminTools/subcontractors/use-subcontractors';
import { useAuth } from '@/contexts/auth';
import useProjects from '@/pages/admin/adminTools/projects/use-projects';

// Move static column definitions outside hook to prevent recreation
const LABOR_COLUMNS = {
    ref_nb: "REF #",
    type_of_worker: "Type of Worker",
    description_of_activity: "Description of Activity",
    unit: "Unit",
    unit_price: "Unit Price",
    qty: "Quantity",
    amount: "Amount",
};

const MATERIALS_COLUMNS = {
    ref_nb: "REF #",
    item: "Item",
    unit: "Unit",
    unit_price: "Unit Price",
    allocated_qty: "Allocated Quantity",
    transferred_qty: "Transferred Quantity",
    transferred_to: "Transferred to",
    stock_qty: "Stock Quantity",
    remark: "Remarks",
};

const MACHINES_COLUMNS = {
    ref_nb: "REF #",
    machine_code: "Machine Code",
    type_of_machine: "Type of Machine",
    unit: "unit",
    unit_price: "Unit Price",
    qty: "Quantity",
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
    const [selectedProject, setSelectedProject] = useState<string | null>(null);

    const [subcontractors, setSubcontractors] = useState<any[]>([]);
    const [selectedSubcontractor, setSelectedSubcontractor] = useState<string | null>(null);

    const [contracts, setContracts] = useState<any[]>([]);
    const [selectedContract, setSelectedContract] = useState<string | null>(null);

    const { getToken } = useAuth();
    const token = getToken();

    // Effect to clear data when contract selection changes to null
    useEffect(() => {
        if (selectedContract === null) {
            setLaborData([]);
            setMaterialsData([]);
            setMachinesData([]);
            setLoading(false); // Dismiss loader when no contract is selected
        }
        // When selectedContract is not null, this is where actual data fetching for tables would occur
    }, [selectedContract]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const fetchedProjects = await getProjects();
                setProjects(fetchedProjects);
                setSelectedProject(null);
                setSelectedSubcontractor(null); // Clear subcontractor selection when project changes
                setSelectedContract(null); // Clear contract selection when project changes
            } catch (error) {
                console.error("Error fetching projects:", error);
            }
        };
        fetchProjects();
    }, [getProjects]);

    // Fetch Subcontractors
    useEffect(() => {
        const fetchSubcontractorData = async () => {
            const token = getToken(); // Get token here as well to be explicit
            if (token) { // Ensure token is available before fetching
                try {
                    let fetchedSubcontractors: any[] = [];
                    if (selectedProject) {
                        // If a project is selected, fetch subcontractors for that project
                        const response = await getSubcontractorsByProjectId(Number(selectedProject), token);
                        if (response.success && response.data) {
                            fetchedSubcontractors = response.data;
                        } else {
                            console.error("Error fetching subcontractors by project:", response.message);
                        }
                    } else {
                        // If no project is selected, fetch all subcontractors
                        fetchedSubcontractors = await fetchAllSubcontractorsFromHook();
                    }

                    setSubcontractors(fetchedSubcontractors);
                    setSelectedSubcontractor(null);
                } catch (error) {
                    console.error("Error fetching subcontractors:", error); // Corrected error message
                    setSubcontractors([]);
                    setSelectedSubcontractor(null);
                }
            } else {
                setSubcontractors([]);
                setSelectedSubcontractor(null);
            }
            setSelectedContract(null); // Clear contract selection whenever subcontractors are re-fetched
        };
        fetchSubcontractorData();
    }, [token, fetchAllSubcontractorsFromHook, getToken]); // Added getToken and getSubcontractorsByProjectId to dependency array

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
                        token
                    );
                    if (response.success && response.data) {
                        setContracts(response.data);
                        setSelectedContract(null);
                    } else {
                        console.error("Error fetching contracts:", response.message);
                        setContracts([]);
                        setSelectedContract(null);
                    }
                } catch (error) {
                    console.error("Error fetching contracts:", error);
                    setContracts([]);
                    setSelectedContract(null);
                }
            } else {
                setContracts([]);
                setSelectedContract(null);
            }
        };
        fetchContracts();
    }, [selectedProject, selectedSubcontractor, getToken]);




    const memoizedData = useMemo(() => ({
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
    }), [
        laborData, materialsData, machinesData,
        projects, selectedProject, setSelectedProject,
        subcontractors, selectedSubcontractor, setSelectedSubcontractor,
        contracts, selectedContract, setSelectedContract
    ]);

    return { ...memoizedData, loading };
};

export default useDeductionsDatabase;
