import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import type { SubcontractorBoqVM } from "@/types/contracts";

import { useContractsApi } from "../../hooks/use-contracts-api";

// Types and Interfaces (same as new wizard)
interface Project {
    id: number;
    code: string;
    name?: string;
    acronym?: string;
    city?: string;
}

interface Building {
    id: number;
    name: string;
    buildingName?: string;
}

interface Subcontractor {
    id: number;
    name: string | null;
    siegeSocial?: string | null;
    commerceRegistrar?: string | null;
    commerceNumber?: string | null;
    taxNumber?: string | null;
    representedBy?: string | null;
    qualityRepresentive?: string | null;
    subcontractorTel?: string | null;
}

interface Contract {
    id: number;
    templateName: string;
    type: string;
    contractType?: string;
}

interface Currency {
    id: number;
    name: string;
    currencies: string;
}

interface Trade {
    id: number;
    name: string;
    code: string;
    buildingCount: number;
}

interface BuildingWithSheets extends Building {
    sheets: Array<{
        id: number;
        name: string;
        hasVo: boolean;
        isActive: boolean;
        costCodeId?: number;
        boqItemCount?: number;
    }>;
    availableSheets: Array<{
        id: number;
        name: string;
        hasVo: boolean;
        isActive: boolean;
        boqItemCount?: number;
    }>;
    sheetCount: number;
}

export interface BOQItem {
    id?: number;
    no: string;
    key: string;
    costCode?: string;
    unite: string;
    qte: number;
    pu: number;
    totalPrice?: number;
    _budgetBOQSource?: string; // Internal flag for UI purposes
    _readonly?: boolean; // Internal flag for UI purposes
}

interface BuildingTradeMapping {
    buildingId: number;
    tradeId: number;
    tradeName: string;
}

interface EditWizardFormData {
    id: number; // Different from new wizard - this has an ID
    projectId: number | null;
    selectedTrades: number[]; // Multiple trades
    buildingTradeMap: BuildingTradeMapping[]; // Map buildings to their trades
    subcontractorId: number | null;
    contractId: number | null;
    currencyId: number | null;
    amount: number; // Add missing amount property
    contractNumber: string;
    contractDate: string;
    completionDate: string;
    advancePayment: number;
    materialSupply: number;
    purchaseIncrease: string;
    latePenalties: string;
    latePenalityCeiling: string;
    holdWarranty: string;
    mintenancePeriod: string;
    workWarranty: string;
    termination: string;
    daysNumber: string;
    progress: string;
    holdBack: string;
    subcontractorAdvancePayee: string;
    recoverAdvance: string;
    procurementConstruction: string;
    prorataAccount: string;
    managementFees: string;
    plansExecution: string;
    subTrade: string;
    paymentsTerm: string;
    remark: string;
    remarkCP: string;
    attachments: {
        file: File;
        type: string;
    }[];
    boqData: {
        buildingId: number;
        buildingName: string;
        sheetName: string;
        replaceAllItems?: boolean;
        items: BOQItem[];
    }[];
}

// Context Interface
interface EditWizardContextType {
    // State
    formData: EditWizardFormData;
    currentStep: number;
    hasUnsavedChanges: boolean;
    loading: boolean;
    initialDataLoading: boolean;
    loadingProjects: boolean;
    loadingBuildings: boolean;

    // Data
    projects: Project[];
    trades: Trade[];
    buildings: BuildingWithSheets[];
    allBuildings: BuildingWithSheets[];
    subcontractors: Subcontractor[];
    contracts: Contract[];
    currencies: Currency[];
    allCostCodes: any[];
    originalContractData: SubcontractorBoqVM | null;

    // Actions
    setFormData: (data: Partial<EditWizardFormData>) => void;
    setCurrentStep: (step: number) => void;
    setHasUnsavedChanges: (changed: boolean) => void;

    // Data fetching
    fetchProjects: () => Promise<void>;
    fetchCostCodes: () => Promise<void>;
    fetchBuildingsWithSheets: (projectId: number) => Promise<void>;
    fetchSubcontractors: () => Promise<void>;
    fetchContracts: () => Promise<void>;
    fetchCurrencies: () => Promise<void>;
    loadExistingData: (id: number) => Promise<void>;

    // Validation & Navigation
    validateCurrentStep: () => boolean;
    goToNextStep: () => void;
    goToPreviousStep: () => void;

    // Submission
    handleSubmit: () => Promise<void>;
}

// Initial form data for editing
const initialEditFormData: EditWizardFormData = {
    id: 0,
    projectId: null,
    selectedTrades: [],
    buildingTradeMap: [],
    subcontractorId: null,
    contractId: null,
    currencyId: null,
    amount: 0, // Add missing amount property
    contractDate: new Date().toISOString().split("T")[0],
    completionDate: "",
    contractNumber: "",
    advancePayment: 0,
    materialSupply: 0,
    purchaseIncrease: "",
    latePenalties: "",
    latePenalityCeiling: "",
    holdWarranty: "",
    mintenancePeriod: "",
    workWarranty: "",
    termination: "",
    daysNumber: "",
    progress: "",
    holdBack: "",
    subcontractorAdvancePayee: "",
    recoverAdvance: "",
    procurementConstruction: "",
    prorataAccount: "",
    managementFees: "",
    plansExecution: "",
    subTrade: "",
    paymentsTerm: "",
    remark: "",
    remarkCP: "",
    attachments: [],
    boqData: [],
};

// Create Context
const EditWizardContext = createContext<EditWizardContextType | undefined>(undefined);

// Custom hook to use the context
export const useEditWizardContext = () => {
    const context = useContext(EditWizardContext);
    if (context === undefined) {
        throw new Error("useEditWizardContext must be used within an EditWizardProvider");
    }
    return context;
};

// Provider Props
interface EditWizardProviderProps {
    children: ReactNode;
}

// Provider Component
export const EditWizardProvider: React.FC<EditWizardProviderProps> = ({ children }) => {
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const { contractIdentifier } = useParams<{ contractIdentifier: string }>();
    const location = useLocation();
    const token = getToken();

    // Get actual contract ID from navigation state (for API calls) or try to parse if it's numeric
    const contractId = location.state?.contractId || (!isNaN(Number(contractIdentifier)) ? contractIdentifier : null);

    // State
    const [formData, setFormDataState] = useState<EditWizardFormData>(initialEditFormData);
    const [currentStep, setCurrentStep] = useState(1);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialDataLoading, setInitialDataLoading] = useState(true);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingBuildings, setLoadingBuildings] = useState(false);

    // Data arrays
    const [projects, setProjects] = useState<Project[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [allBuildings, setAllBuildings] = useState<BuildingWithSheets[]>([]);
    const [buildings, setBuildings] = useState<BuildingWithSheets[]>([]);
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [allCostCodes, setAllCostCodes] = useState<any[]>([]);
    const [originalContractData, setOriginalContractData] = useState<SubcontractorBoqVM | null>(null);

    // Enhanced form data setter that tracks changes
    const setFormData = useCallback((data: Partial<EditWizardFormData>) => {
        setFormDataState((prev) => ({ ...prev, ...data }));
        setHasUnsavedChanges(true);
    }, []);

    // Data fetching functions (same as new wizard)
    const fetchProjects = useCallback(async () => {
        try {
            setLoadingProjects(true);
            const response = await apiRequest({
                method: "GET",
                endpoint: "Project/GetProjectsList",
                token: token || undefined,
            });
            if (Array.isArray(response)) {
                // Sort by ID descending (latest first)
                const sortedProjects = [...response].sort((a, b) => b.id - a.id);
                setProjects(sortedProjects);
            } else if (response.success && Array.isArray(response.data)) {
                // Sort by ID descending (latest first)
                const sortedProjects = [...response.data].sort((a, b) => b.id - a.id);
                setProjects(sortedProjects);
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
            toaster.error("Failed to fetch projects");
        } finally {
            setLoadingProjects(false);
        }
    }, [token]);

    const fetchCostCodes = useCallback(async () => {
        try {
            const response = await apiRequest({
                method: "GET",
                endpoint: "CostCode/GetCodeCostLibrary",
                token: token || undefined,
            });
            if (Array.isArray(response)) {
                setAllCostCodes(response);
            } else if (response.success && Array.isArray(response.data)) {
                setAllCostCodes(response.data);
            }
        } catch (error) {
            console.error("Error fetching cost codes:", error);
            toaster.error("Failed to fetch cost codes");
        }
    }, [token]);

    const fetchBuildingsWithSheets = useCallback(
        async (projectId: number) => {
            try {
                setLoadingBuildings(true);
                // Use OpenProject API to get full project data with BOQ items (matching budget BOQ approach)
                const projectData = await apiRequest({
                    method: "GET",
                    endpoint: `Project/OpenProject/${projectId}`,
                    token: token || undefined,
                });

                if (projectData && projectData.buildings && Array.isArray(projectData.buildings)) {
                    const buildingsWithSheets: BuildingWithSheets[] = projectData.buildings.map((building: any) => {
                        // Extract sheets with actual BOQ data
                        const sheets = building.boqSheets || [];
                        const enhancedSheets = sheets.map((sheet: any) => {
                            const boqItemCount =
                                sheet.boqItems && Array.isArray(sheet.boqItems) ? sheet.boqItems.length : 0;

                            return {
                                id: sheet.id,
                                name: sheet.name,
                                hasVo: sheet.hasVo || false,
                                isActive: sheet.isActive || true,
                                costCodeId: sheet.costCodeId,
                                boqItemCount: boqItemCount,
                            };
                        });

                        return {
                            id: building.id,
                            name: building.name || building.buildingName || `Building ${building.id}`,
                            buildingName: building.buildingName,
                            sheets: enhancedSheets,
                            availableSheets: [],
                            sheetCount: enhancedSheets.length,
                        };
                    });

                    setAllBuildings(buildingsWithSheets);
                    setBuildings(buildingsWithSheets);
                } else {
                    setAllBuildings([]);
                    setBuildings([]);
                }
            } catch (error) {
                console.error("Error fetching project with BOQ data:", error);
                toaster.error("Failed to fetch project data");
                setAllBuildings([]);
                setBuildings([]);
            } finally {
                setLoadingBuildings(false);
            }
        },
        [token],
    );

    const fetchSubcontractors = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiRequest({
                method: "GET",
                endpoint: "Subcontractors/GetSubcontractors",
                token: token || undefined,
            });
            if (Array.isArray(response)) {
                setSubcontractors(response);
            } else if (response.success && Array.isArray(response.data)) {
                setSubcontractors(response.data);
            }
        } catch (error) {
            console.error("Error fetching subcontractors:", error);
            toaster.error("Failed to fetch subcontractors");
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchContracts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiRequest({
                method: "GET",
                endpoint: "Templates/GetContracts",
                token: token || undefined,
            });
            if (Array.isArray(response)) {
                setContracts(response);
            } else if (response.success && Array.isArray(response.data)) {
                setContracts(response.data);
            }
        } catch (error) {
            console.error("Error fetching contracts:", error);
            toaster.error("Failed to fetch contracts");
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchCurrencies = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiRequest({
                method: "GET",
                endpoint: "Currencie/GetCurrencies",
                token: token || undefined,
            });
            if (Array.isArray(response)) {
                setCurrencies(response);
            } else if (response.success && Array.isArray(response.data)) {
                setCurrencies(response.data);
            }
        } catch (error) {
            console.error("Error fetching currencies:", error);
            toaster.error("Failed to fetch currencies");
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Initialize contracts API hook
    const contractsApi = useContractsApi();

    // Load existing data for editing using the new API service
    const loadExistingData = useCallback(
        async (contractId: number) => {
            try {
                setInitialDataLoading(true);
                const result = await contractsApi.loadSubcontractorData(contractId);

                if (result.success && result.data) {
                    const existingData = result.data;

                    // ✅ Store original contract data for project change detection
                    setOriginalContractData(existingData);

                    const newFormData = {
                        ...initialEditFormData,
                        id: existingData.id || contractId,
                        projectId: existingData.projectId,
                        subcontractorId: existingData.subContractorId,
                        contractId: existingData.contractId,
                        currencyId: existingData.currencyId,
                        contractNumber: existingData.contractNumber || "",
                        contractDate: existingData.contractDate ? existingData.contractDate.split("T")[0] : "",
                        completionDate: existingData.completionDate ? existingData.completionDate.split("T")[0] : "",
                        advancePayment: existingData.advancePayment || 0,
                        materialSupply: existingData.materialSupply || 0,
                        purchaseIncrease: existingData.purchaseIncrease || "",
                        latePenalties: existingData.latePenalties || "",
                        latePenalityCeiling: existingData.latePenalityCeiling || "",
                        holdWarranty: existingData.holdWarranty || "",
                        mintenancePeriod: existingData.mintenancePeriod || "",
                        workWarranty: existingData.workWarranty || "",
                        termination: existingData.termination || "",
                        daysNumber: existingData.daysNumber || "",
                        progress: existingData.progress || "",
                        holdBack: existingData.holdBack || "",
                        subcontractorAdvancePayee: existingData.subcontractorAdvancePayee || "",
                        recoverAdvance: existingData.recoverAdvance || "",
                        procurementConstruction: existingData.procurementConstraction || "",
                        prorataAccount: existingData.prorataAccount || "",
                        managementFees: existingData.managementFees || "",
                        plansExecution: existingData.plansExecution || "",
                        subTrade: existingData.subTrade || "",
                        paymentsTerm: existingData.paymentsTerm || "",
                        remark: existingData.remark || "",
                        remarkCP: existingData.remarkCP || "",
                        attachments: [],
                        boqData:
                            existingData.buildings?.map((building: any) => ({
                                buildingId: building.id,
                                buildingName: building.buildingName,
                                replaceAllItems: building.replaceAllItems || false,
                                sheetName: building.sheetName || "", // Use empty string if no sheet specified
                                items:
                                    building.boqsContract?.map((item: any) => ({
                                        id: item.id,
                                        no: item.no,
                                        key: item.key,
                                        costCode: item.costCode || "",
                                        unite: item.unite,
                                        qte: item.qte,
                                        pu: item.pu,
                                        totalPrice: item.totalPrice || item.qte * item.pu,
                                    })) || [],
                            })) || [],
                    };

                    setFormDataState(newFormData);

                    // Load buildings for the project
                    if (existingData.projectId) {
                        await fetchBuildingsWithSheets(existingData.projectId);
                    }

                    setHasUnsavedChanges(false);
                }
            } catch (error) {
                console.error("Error loading existing data:", error);
                const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                toaster.error(`Failed to load contract data: ${errorMessage}`);
            } finally {
                setInitialDataLoading(false);
                // Mark that initial load is complete - NOW project changes should clear data
                isInitialProjectLoadRef.current = false;
            }
        },
        [contractsApi, fetchBuildingsWithSheets],
    );

    // Validation functions (6 steps)
    const validateStep1 = (): boolean => {
        return formData.projectId !== null;
    };

    const validateStep2 = (): boolean => {
        return formData.subcontractorId !== null;
    };

    const validateStep3 = (): boolean => {
        return (
            formData.contractId !== null &&
            formData.currencyId !== null &&
            formData.contractNumber.trim() !== "" &&
            formData.contractDate !== "" &&
            formData.completionDate !== ""
        );
    };

    const validateStep4 = (): boolean => {
        return formData.boqData.some((building) => building.items.length > 0);
    };

    const validateStep5 = (): boolean => {
        return true; // Review step doesn't require validation
    };

    const validateStep6 = (): boolean => {
        return true; // Preview step doesn't require validation
    };

    const validateCurrentStep = useCallback((): boolean => {
        switch (currentStep) {
            case 1:
                return validateStep1();
            case 2:
                return validateStep2();
            case 3:
                return validateStep3();
            case 4:
                return validateStep4();
            case 5:
                return validateStep5();
            case 6:
                return validateStep6();
            default:
                return false;
        }
    }, [currentStep, formData]);

    // Navigation functions
    const goToNextStep = useCallback(() => {
        if (validateCurrentStep() && currentStep < 6) {
            setCurrentStep(currentStep + 1);
        }
    }, [validateCurrentStep, currentStep]);

    const goToPreviousStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    }, [currentStep]);

    // Submission function for updates using the new API service
    const handleSubmit = useCallback(async () => {
        try {
            setLoading(true);

            // Prepare JSON data for submission according to SubcontractorBoqVM structure
            const submitData: SubcontractorBoqVM = {
                id: formData.id, // Existing contract ID
                currencyId: formData.currencyId!,
                projectId: formData.projectId!,
                subContractorId: formData.subcontractorId!,
                contractId: formData.contractId!,
                amount: formData.amount || 0, // Add missing amount property
                contractDate: formData.contractDate,
                completionDate: formData.completionDate,
                advancePayment: formData.advancePayment, // Store as percentage directly
                materialSupply: formData.materialSupply, // Store as percentage directly
                purchaseIncrease: formData.purchaseIncrease,
                latePenalties: formData.latePenalties,
                latePenaliteCeiling: formData.latePenalityCeiling,
                holdWarranty: formData.holdWarranty,
                mintenancePeriod: formData.mintenancePeriod,
                workWarranty: formData.workWarranty,
                termination: formData.termination,
                daysNumber: formData.daysNumber,
                progress: formData.progress,
                holdBack: formData.holdBack,
                subcontractorAdvancePayee: formData.subcontractorAdvancePayee,
                recoverAdvance: formData.recoverAdvance,
                procurementConstruction: formData.procurementConstruction,
                prorataAccount: formData.prorataAccount,
                managementFees: formData.managementFees,
                plansExecution: formData.plansExecution,
                subTrade: formData.subTrade,
                paymentsTerm: formData.paymentsTerm,
                contractNumber: formData.contractNumber,
                remark: formData.remark,
                remarkCP: formData.remarkCP,
                contractDatasetStatus: "Editable",
                isGenerated: false,
                buildings: formData.boqData.map((building) => ({
                    id: building.buildingId || 0,
                    buildingName: building.buildingName,
                    sheetId: 0, // Will be managed by backend
                    sheetName: building.sheetName || "", // Use empty string if no sheet specified
                    replaceAllItems: building.replaceAllItems || false,
                    boqsContract: building.items.map((item) => ({
                        id: item.id && item.id > 0 && item.id < 2147483647 ? item.id : 0, // Use existing ID if valid, otherwise 0 for new items
                        no: item.no,
                        key: item.key,
                        unite: item.unite,
                        qte: item.qte,
                        pu: item.pu,
                        costCode: item.costCode || "",
                        costCodeId: null as number | null,
                        boqtype: "Subcontractor",
                        boqSheetId: 0,
                        sheetName: building.sheetName || "", // Use empty string if no sheet specified
                        orderBoq: 0,
                        totalPrice: item.qte * item.pu,
                    })),
                })),
            };

            // Use the new API service
            const result = await contractsApi.saveContract(submitData, false);

            if (result.success) {
                // Upload new documents if any
                if (formData.attachments.length > 0) {
                    try {
                        for (const attachment of formData.attachments) {
                            await contractsApi.attachDocument({
                                contractsDataSetId: formData.id,
                                attachmentsType: attachment.type === "PDF" ? 0 : 1, // AttachmentType enum
                                wordFile: attachment.file,
                            });
                        }
                    } catch (docError) {
                        console.warn("Failed to upload some documents:", docError);
                        toaster.warning("Contract updated but some documents failed to upload");
                    }
                }

                toaster.success("Contract updated successfully!");
                setHasUnsavedChanges(false);
                // Navigation will be handled by the main component
            } else {
                throw new Error(result.error || "Failed to update contract");
            }
        } catch (error) {
            console.error("Error updating contract:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            toaster.error(`Failed to update contract: ${errorMessage}`);
            // Re-throw so index.tsx knows save failed and doesn't navigate
            throw error;
        } finally {
            setLoading(false);
        }
    }, [formData, contractsApi, toaster]);

    // Initialize data on component mount
    useEffect(() => {
        let isMounted = true; // Prevent state updates if component unmounts

        const initializeData = async () => {
            if (token && isMounted) {
                try {
                    // Inline API calls to avoid dependency issues
                    setLoadingProjects(true);
                    setLoading(true);

                    // First load all master data BEFORE loading existing contract data
                    const [projectsRes, costCodesRes, subcontractorsRes, contractsRes, currenciesRes] =
                        await Promise.allSettled([
                            apiRequest({
                                method: "GET",
                                endpoint: "Project/GetProjectsList",
                                token: token,
                            }),
                            apiRequest({
                                method: "GET",
                                endpoint: "CostCode/GetCodeCostLibrary",
                                token: token,
                            }),
                            apiRequest({
                                method: "GET",
                                endpoint: "Subcontractors/GetSubcontractors",
                                token: token,
                            }),
                            apiRequest({
                                method: "GET",
                                endpoint: "Templates/GetContracts",
                                token: token,
                            }),
                            apiRequest({
                                method: "GET",
                                endpoint: "Currencie/GetCurrencies",
                                token: token,
                            }),
                        ]);

                    if (isMounted) {
                        // Process projects
                        if (projectsRes.status === "fulfilled") {
                            const response = projectsRes.value;
                            if (Array.isArray(response)) {
                                // Sort by ID descending (latest first)
                                const sortedProjects = [...response].sort((a, b) => b.id - a.id);
                                setProjects(sortedProjects);
                            } else if (response.success && Array.isArray(response.data)) {
                                // Sort by ID descending (latest first)
                                const sortedProjects = [...response.data].sort((a, b) => b.id - a.id);
                                setProjects(sortedProjects);
                            }
                        } else {
                            console.error("Error fetching projects:", projectsRes.reason);
                            toaster.error("Failed to fetch projects");
                        }

                        // Process cost codes
                        if (costCodesRes.status === "fulfilled") {
                            const response = costCodesRes.value;
                            if (Array.isArray(response)) {
                                setAllCostCodes(response);
                            } else if (response.success && Array.isArray(response.data)) {
                                setAllCostCodes(response.data);
                            }
                        } else {
                            console.error("Error fetching cost codes:", costCodesRes.reason);
                            toaster.error("Failed to fetch cost codes");
                        }

                        // Process subcontractors
                        if (subcontractorsRes.status === "fulfilled") {
                            const response = subcontractorsRes.value;
                            if (Array.isArray(response)) {
                                setSubcontractors(response);
                            } else if (response.success && Array.isArray(response.data)) {
                                setSubcontractors(response.data);
                            }
                        } else {
                            console.error("Error fetching subcontractors:", subcontractorsRes.reason);
                            toaster.error("Failed to fetch subcontractors");
                        }

                        // Process contracts
                        if (contractsRes.status === "fulfilled") {
                            const response = contractsRes.value;
                            if (Array.isArray(response)) {
                                setContracts(response);
                            } else if (response.success && Array.isArray(response.data)) {
                                setContracts(response.data);
                            }
                        } else {
                            console.error("Error fetching contracts:", contractsRes.reason);
                            toaster.error("Failed to fetch contracts");
                        }

                        // Process currencies
                        if (currenciesRes.status === "fulfilled") {
                            const response = currenciesRes.value;
                            if (Array.isArray(response)) {
                                setCurrencies(response);
                            } else if (response.success && Array.isArray(response.data)) {
                                setCurrencies(response.data);
                            }
                        } else {
                            console.error("Error fetching currencies:", currenciesRes.reason);
                            toaster.error("Failed to fetch currencies");
                        }

                        // THEN load existing contract data so selectedRowId can find matches
                        if (contractId) {
                            await loadExistingData(parseInt(contractId));
                        }
                    }
                } catch (error) {
                    if (isMounted) {
                        console.error("Error in initializeData:", error);
                        toaster.error("Failed to initialize data");
                    }
                } finally {
                    if (isMounted) {
                        setLoadingProjects(false);
                        setLoading(false);
                    }
                }
            }
        };

        initializeData();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [contractId, token]); // Only re-run when contractId or token changes

    // Build trades list from sheet names - ONLY sheets with actual BOQ data
    useEffect(() => {
        if (formData.projectId && allBuildings.length > 0) {
            const tradesMap = new Map<string, Trade>();

            // Use sheet names as trades - but ONLY sheets with actual BOQ data
            allBuildings.forEach((building) => {
                building.sheets.forEach((sheet) => {
                    // Only include sheets that have actual BOQ data populated
                    const hasBoqData = sheet.boqItemCount && sheet.boqItemCount > 0;

                    if (sheet.name && sheet.name.trim() && hasBoqData) {
                        const sheetName = sheet.name.trim();
                        const existingTrade = tradesMap.get(sheetName);
                        if (existingTrade) {
                            existingTrade.buildingCount++;
                        } else {
                            tradesMap.set(sheetName, {
                                id: sheet.id,
                                name: sheetName,
                                code: sheetName,
                                buildingCount: 1,
                            });
                        }
                    }
                });
            });

            let finalTrades = Array.from(tradesMap.values()).sort((a, b) => a.name.localeCompare(b.name));

            // 🔧 EDIT MODE FIX: Ensure existing contract's trades are always available for editing
            if (originalContractData && originalContractData.buildings && originalContractData.buildings.length > 0) {
                const existingSheetNames = [...new Set(originalContractData.buildings.map((b: any) => b.sheetName))];

                existingSheetNames.forEach((sheetName) => {
                    if (sheetName && !finalTrades.some((trade) => trade.name === sheetName)) {
                        console.warn("⚠️ EDIT MODE - Contract uses trade with no current BOQ data:", sheetName);

                        // Find the first sheet with this name to get an ID
                        let sheetId = 0;
                        allBuildings.forEach((building) => {
                            building.sheets.forEach((sheet) => {
                                if (sheet.name === sheetName && sheetId === 0) {
                                    sheetId = sheet.id;
                                }
                            });
                        });

                        if (sheetId > 0) {
                            finalTrades.push({
                                id: sheetId,
                                name: sheetName,
                                code: sheetName,
                                buildingCount: 1,
                            });
                        }
                    }
                });

                finalTrades = finalTrades.sort((a, b) => a.name.localeCompare(b.name));
            }

            setTrades(finalTrades);

            // 🔧 FIX: Set selectedTrades and buildingTradeMap based on existing contract data
            if (
                originalContractData &&
                formData.selectedTrades.length === 0 &&
                originalContractData.buildings &&
                originalContractData.buildings.length > 0 &&
                formData.projectId === originalContractData.projectId
            ) {
                const buildingTradeMap: BuildingTradeMapping[] = [];
                const selectedTradesSet = new Set<number>();

                originalContractData.buildings.forEach((building: any) => {
                    const matchingTrade = finalTrades.find((trade) => trade.name === building.sheetName);
                    if (matchingTrade) {
                        buildingTradeMap.push({
                            buildingId: building.id,
                            tradeId: matchingTrade.id,
                            tradeName: matchingTrade.name,
                        });
                        selectedTradesSet.add(matchingTrade.id);
                    }
                });

                if (buildingTradeMap.length > 0) {
                    setFormDataState((prev) => ({
                        ...prev,
                        selectedTrades: Array.from(selectedTradesSet),
                        buildingTradeMap,
                    }));
                }
            }
        }
    }, [formData.projectId, allBuildings, originalContractData]);

    // Fetch buildings with sheets when project changes
    // Track if this is the first project load to avoid clearing data during initial edit load
    const isInitialProjectLoadRef = useRef(true);

    useEffect(() => {
        // 🔧 CRITICAL FIX: Skip ALL runs until initial data load completes
        if (isInitialProjectLoadRef.current) {
            return;
        }

        if (formData.projectId) {
            // Immediately clear buildings and trades from the old project
            setBuildings([]);
            setAllBuildings([]);
            setTrades([]);

            fetchBuildingsWithSheets(formData.projectId);
            // Clear trade, building, and BOQ data when project changes
            setFormData({ selectedTrades: [], buildingTradeMap: [], boqData: [] });
        } else {
            // If project is cleared, also clear buildings and trades
            setBuildings([]);
            setAllBuildings([]);
            setTrades([]);
        }
    }, [formData.projectId]);

    // Context value - Memoized to prevent unnecessary re-renders
    const contextValue: EditWizardContextType = useMemo(() => ({
        // State
        formData,
        currentStep,
        hasUnsavedChanges,
        loading: loading || contractsApi.loading,
        initialDataLoading,
        loadingProjects,
        loadingBuildings,

        // Data
        projects,
        trades,
        buildings,
        allBuildings,
        subcontractors,
        contracts,
        currencies,
        allCostCodes,
        originalContractData,

        // Actions
        setFormData,
        setCurrentStep,
        setHasUnsavedChanges,

        // Data fetching
        fetchProjects,
        fetchCostCodes,
        fetchBuildingsWithSheets,
        fetchSubcontractors,
        fetchContracts,
        fetchCurrencies,
        loadExistingData,

        // Validation & Navigation
        validateCurrentStep,
        goToNextStep,
        goToPreviousStep,

        // Submission
        handleSubmit,
    }), [
        formData,
        currentStep,
        hasUnsavedChanges,
        loading,
        contractsApi.loading,
        initialDataLoading,
        loadingProjects,
        loadingBuildings,
        projects,
        trades,
        buildings,
        allBuildings,
        subcontractors,
        contracts,
        currencies,
        allCostCodes,
        originalContractData,
        setFormData,
        fetchProjects,
        fetchCostCodes,
        fetchBuildingsWithSheets,
        fetchSubcontractors,
        fetchContracts,
        fetchCurrencies,
        loadExistingData,
        validateCurrentStep,
        goToNextStep,
        goToPreviousStep,
        handleSubmit
    ]);

    return <EditWizardContext.Provider value={contextValue}>{children}</EditWizardContext.Provider>;
};