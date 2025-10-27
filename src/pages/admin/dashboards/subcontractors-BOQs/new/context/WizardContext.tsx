import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import type { SubcontractorBoqVM } from "@/types/contracts";

import { useContractsApi } from "../../hooks/use-contracts-api";

// Types and Interfaces
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
    currencies: string; // This is the code/symbol
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
    _budgetBOQSource?: string; // Internal flag for UI purposes
    _readonly?: boolean; // Internal flag for UI purposes
}

interface WizardFormData {
    projectId: number | null;
    selectedTrades: string[]; // Array of selected trade names (sheet names)
    buildingTradeMap: { [tradeName: string]: number[] }; // Map of trade → building IDs
    subcontractorId: number | null;
    contractId: number | null;
    currencyId: number | null;
    amount: number; // Add missing amount property
    contractNumber: string;
    contractDate: string;
    completionDate: string;
    advancePayment: number;
    materialSupply: number;
    vat: number;
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
interface WizardContextType {
    // State
    formData: WizardFormData;
    currentStep: number;
    hasUnsavedChanges: boolean;
    loading: boolean;
    loadingProjects: boolean;
    loadingBuildings: boolean;

    // Data
    projects: Project[];
    trades: Trade[];
    allBuildings: BuildingWithSheets[];
    buildings: BuildingWithSheets[];
    subcontractors: Subcontractor[];
    contracts: Contract[];
    currencies: Currency[];
    allCostCodes: any[];

    // Actions
    setFormData: (data: Partial<WizardFormData>) => void;
    setCurrentStep: (step: number) => void;
    setHasUnsavedChanges: (changed: boolean) => void;

    // Data fetching
    fetchProjects: () => Promise<void>;
    fetchCostCodes: () => Promise<void>;
    fetchBuildingsWithSheets: (projectId: number) => Promise<void>;
    fetchSubcontractors: () => Promise<void>;
    fetchContracts: () => Promise<void>;
    fetchCurrencies: () => Promise<void>;

    // Validation & Navigation
    validateCurrentStep: () => boolean;
    goToNextStep: () => void;
    goToPreviousStep: () => void;

    // Submission
    handleSubmit: () => Promise<boolean>;
}

// Initial form data
const initialFormData: WizardFormData = {
    projectId: null,
    selectedTrades: [],
    buildingTradeMap: {},
    subcontractorId: null,
    contractId: null,
    currencyId: null,
    amount: 0, // Add missing amount property
    contractDate: new Date().toISOString().split("T")[0],
    completionDate: "",
    contractNumber: "",
    advancePayment: 0,
    materialSupply: 0,
    vat: 20, // Default VAT rate, will be loaded from system config
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
const WizardContext = createContext<WizardContextType | undefined>(undefined);

// Custom hook to use the context
export const useWizardContext = () => {
    const context = useContext(WizardContext);
    if (context === undefined) {
        throw new Error("useWizardContext must be used within a WizardProvider");
    }
    return context;
};

// Provider Props
interface WizardProviderProps {
    children: ReactNode;
}

// Provider Component
export const WizardProvider: React.FC<WizardProviderProps> = ({ children }) => {
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const token = getToken();

    // State
    const [formData, setFormDataState] = useState<WizardFormData>(initialFormData);
    const [currentStep, setCurrentStep] = useState(1);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(false);
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

    // Enhanced form data setter that tracks changes - memoized to prevent re-creation
    const setFormData = useCallback((data: Partial<WizardFormData>) => {
        setFormDataState((prev) => ({ ...prev, ...data }));
        setHasUnsavedChanges(true);
    }, []);

    // Data fetching functions
    const fetchProjects = async () => {
        try {
            setLoadingProjects(true);
            const response = await apiRequest({
                method: "GET",
                endpoint: "Project/GetProjectsList",
                token: token || undefined,
            });

            // Handle both wrapped and direct array responses
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
    };

    const fetchCostCodes = useCallback(async () => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    }, [token, toaster]);

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
                            sheets: enhancedSheets,
                            availableSheets: [],
                            sheetCount: enhancedSheets.length,
                        };
                    });

                    setAllBuildings(buildingsWithSheets);
                    setBuildings(buildingsWithSheets);
                } else {
                    console.warn("OpenProject returned no buildings or invalid data");
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
        [token, toaster],
    );

    const fetchSubcontractors = async () => {
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
    };

    const fetchContracts = async () => {
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
    };

    const fetchCurrencies = async () => {
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
    };

    // Validation functions
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
        // Check that at least one trade is selected
        if (formData.selectedTrades.length === 0) {
            return false;
        }

        // Check that at least one building is selected for each trade
        for (const tradeName of formData.selectedTrades) {
            const buildings = formData.buildingTradeMap[tradeName] || [];
            if (buildings.length === 0) {
                return false;
            }
        }

        // Check that BOQ data exists
        return formData.boqData.some((building) => building.items.length > 0);
    };

    const validateStep5 = (): boolean => {
        return true; // Review step doesn't require validation
    };

    const validateStep6 = (): boolean => {
        return true; // Preview step doesn't require validation
    };

    const validateCurrentStep = (): boolean => {
        switch (currentStep) {
            case 1:
                return validateStep1();
            case 2:
                return validateStep2(); // Subcontractor (was Step4)
            case 3:
                return validateStep3(); // Contract Details (was Step5)
            case 4:
                return validateStep4(); // BOQ Items (was Step6)
            case 5:
                return validateStep5(); // Review (was Step7)
            case 6:
                return validateStep6(); // Preview (was Step8)
            default:
                return false;
        }
    };

    // Navigation functions
    const goToNextStep = () => {
        if (validateCurrentStep() && currentStep < 6) {
            setCurrentStep(currentStep + 1);
        }
    };

    const goToPreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Initialize contracts API hook
    const contractsApi = useContractsApi();

    // Submission function using the new API service
    const handleSubmit = async (): Promise<boolean> => {
        try {
            setLoading(true);

            // Prepare JSON data for submission according to SubcontractorBoqVM structure
            const submitData: SubcontractorBoqVM = {
                id: 0, // New contract
                currencyId: formData.currencyId!,
                projectId: formData.projectId!,
                subContractorId: formData.subcontractorId!,
                contractId: formData.contractId!,
                amount: formData.amount || 0, // Add missing amount property
                contractDate: formData.contractDate || "",
                completionDate: formData.completionDate || "",
                advancePayment: formData.advancePayment || 0,
                materialSupply: formData.materialSupply || 0,
                vat: formData.vat || 0,
                purchaseIncrease: formData.purchaseIncrease || "",
                latePenalties: formData.latePenalties || "",
                latePenaliteCeiling: formData.latePenalityCeiling || "",
                holdWarranty: formData.holdWarranty || "",
                mintenancePeriod: formData.mintenancePeriod || "",
                workWarranty: formData.workWarranty || "",
                termination: formData.termination || "",
                daysNumber: formData.daysNumber || "",
                progress: formData.progress || "",
                holdBack: formData.holdBack || "",
                subcontractorAdvancePayee: formData.subcontractorAdvancePayee || "",
                recoverAdvance: formData.recoverAdvance || "",
                procurementConstruction: formData.procurementConstruction || "",
                prorataAccount: formData.prorataAccount || "",
                managementFees: formData.managementFees || "",
                plansExecution: formData.plansExecution || "",
                subTrade: formData.subTrade || "",
                paymentsTerm: formData.paymentsTerm || "",
                contractNumber: formData.contractNumber || "",
                remark: formData.remark || "",
                remarkCP: formData.remarkCP || "",
                contractDatasetStatus: "Editable",
                isGenerated: false,
                buildings: formData.boqData.map((building) => ({
                    id: building.buildingId, // Use actual building ID from selected building
                    buildingName: building.buildingName,
                    sheetId: 0, // Will be set by backend
                    sheetName: building.sheetName || "", // Use empty string if no sheet specified
                    replaceAllItems: building.replaceAllItems || false,
                    boqsContract: building.items.map((item) => ({
                        id: 0, // Use 0 for all items in new contracts (backend will auto-generate IDs)
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

            // DEBUG: Log the data being sent to backend
            console.log("📤 SUBMITTING CONTRACT DATA:", JSON.stringify(submitData, null, 2));
            console.log("📤 Form Data Summary:", {
                projectId: formData.projectId,
                subcontractorId: formData.subcontractorId,
                contractId: formData.contractId,
                currencyId: formData.currencyId,
                selectedTradesCount: formData.selectedTrades.length,
                totalBuildingsCount: Object.values(formData.buildingTradeMap).reduce((sum, buildings) => sum + buildings.length, 0),
                boqDataCount: formData.boqData.length,
                totalBoqItems: formData.boqData.reduce((sum, building) => sum + building.items.length, 0),
            });

            // Use the new API service
            console.log("🎯 CALLING SAVE CONTRACT API...");
            const result = await contractsApi.saveContract(submitData, false);

            // DEBUG: Log the response from backend
            console.log("📥 BACKEND SAVE RESPONSE:", result);
            console.log("📥 BACKEND SAVE RESPONSE - Success:", result.success);
            console.log("📥 BACKEND SAVE RESPONSE - Error:", result.error);
            console.log("📥 BACKEND SAVE RESPONSE - Message:", (result as any).message);
            console.log("📥 BACKEND SAVE RESPONSE - Data:", result.data);

            if (result.success) {
                const contractId = result.data?.id;

                // Upload documents if any
                if (formData.attachments.length > 0 && contractId) {
                    try {
                        for (const attachment of formData.attachments) {
                            await contractsApi.attachDocument({
                                contractsDataSetId: contractId,
                                attachmentsType: attachment.type === "PDF" ? 0 : 1, // AttachmentType enum
                                wordFile: attachment.file,
                            });
                        }
                    } catch (docError) {
                        console.warn("Failed to upload some documents:", docError);
                        toaster.warning("Contract created but some documents failed to upload");
                    }
                }

                toaster.success("Contract created successfully!");
                setHasUnsavedChanges(false);
                return true; // SUCCESS
            } else {
                throw new Error(result.error || "Failed to create contract");
            }
        } catch (error) {
            console.error("🚨 ERROR SUBMITTING FORM:", error);
            console.error("🚨 ERROR DETAILS:", {
                name: error instanceof Error ? error.name : "Unknown",
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            toaster.error(`Failed to create contract: ${errorMessage}`);
            return false; // FAILURE
        } finally {
            setLoading(false);
        }
    };

    // Initialize data on component mount
    useEffect(() => {
        if (token) {
            fetchProjects();
            fetchCostCodes();
            fetchSubcontractors();
            fetchContracts();
            fetchCurrencies();
        }
    }, [token]);

    // Build trades list from sheet names - ONLY sheets with actual BOQ data (matching budget BOQ behavior)
    useEffect(() => {
        if (formData.projectId && allBuildings.length > 0) {
            const tradesMap = new Map<string, Trade>();

            // Use sheet names as trades - but ONLY sheets with actual BOQ data
            allBuildings.forEach((building) => {
                building.sheets.forEach((sheet) => {
                    // Only include sheets that have actual BOQ data populated (matching budget BOQ behavior)
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

            const finalTrades = Array.from(tradesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
            setTrades(finalTrades);
        }
    }, [formData.projectId, allBuildings]);

    // Fetch buildings with sheets when project changes
    useEffect(() => {
        if (formData.projectId) {
            fetchBuildingsWithSheets(formData.projectId);
            // Clear trade and building selections when project changes
            // ALSO clear boqData to prevent stale items from being submitted
            setFormData({
                selectedTrades: [],
                buildingTradeMap: {},
                boqData: [] // CRITICAL: Clear stale BOQ items
            });
        }
    }, [formData.projectId]);

    // Filter buildings when trade changes (LEGACY: kept for compatibility but unused in new architecture)
    useEffect(() => {
        // Note: This effect is kept for backward compatibility but is not used in the new unified trade/building selection
        // The new architecture uses selectedTrades and buildingTradeMap instead
        setBuildings(allBuildings);
    }, [allBuildings]);

    // Context value - Memoized to prevent unnecessary re-renders
    const contextValue: WizardContextType = useMemo(() => ({
        // State
        formData,
        currentStep,
        hasUnsavedChanges,
        loading: loading || contractsApi.loading,
        loadingProjects,
        loadingBuildings,

        // Data
        projects,
        trades,
        allBuildings,
        buildings,
        subcontractors,
        contracts,
        currencies,
        allCostCodes,

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
        loadingProjects,
        loadingBuildings,
        projects,
        trades,
        allBuildings,
        buildings,
        subcontractors,
        contracts,
        currencies,
        allCostCodes,
        setFormData,
        fetchCostCodes,
        fetchBuildingsWithSheets,
        validateCurrentStep,
        goToNextStep,
        goToPreviousStep,
        handleSubmit
    ]);

    return <WizardContext.Provider value={contextValue}>{children}</WizardContext.Provider>;
};
