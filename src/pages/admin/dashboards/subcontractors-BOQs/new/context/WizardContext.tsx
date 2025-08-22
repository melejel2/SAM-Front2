import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import { useContractsApi } from "../../hooks/use-contracts-api";
import type { SubcontractorBoqVM } from "@/types/contracts";

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

export interface BOQItem {
    id?: number;
    no: string;
    key: string;
    costCode?: string;
    unite: string;
    qte: number;
    pu: number;
}

interface WizardFormData {
    projectId: number | null;
    buildingIds: number[];
    subcontractorId: number | null;
    contractId: number | null;
    currencyId: number | null;
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
    buildings: Building[];
    subcontractors: Subcontractor[];
    contracts: Contract[];
    currencies: Currency[];
    
    // Actions
    setFormData: (data: Partial<WizardFormData>) => void;
    setCurrentStep: (step: number) => void;
    setHasUnsavedChanges: (changed: boolean) => void;
    
    // Data fetching
    fetchProjects: () => Promise<void>;
    fetchBuildingsByProject: (projectId: number) => Promise<void>;
    fetchSubcontractors: () => Promise<void>;
    fetchContracts: () => Promise<void>;
    fetchCurrencies: () => Promise<void>;
    
    // Validation & Navigation
    validateCurrentStep: () => boolean;
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    
    // Submission
    handleSubmit: () => Promise<void>;
}

// Initial form data
const initialFormData: WizardFormData = {
    projectId: null,
    buildingIds: [],
    subcontractorId: null,
    contractId: null,
    currencyId: null,
    contractDate: new Date().toISOString().split('T')[0],
    completionDate: '',
    contractNumber: '',
    advancePayment: 0,
    materialSupply: 0,
    purchaseIncrease: '',
    latePenalties: '',
    latePenalityCeiling: '',
    holdWarranty: '',
    mintenancePeriod: '',
    workWarranty: '',
    termination: '',
    daysNumber: '',
    progress: '',
    holdBack: '',
    subcontractorAdvancePayee: '',
    recoverAdvance: '',
    procurementConstruction: '',
    prorataAccount: '',
    managementFees: '',
    plansExecution: '',
    subTrade: '',
    paymentsTerm: '',
    remark: '',
    remarkCP: '',
    attachments: [],
    boqData: []
};

// Create Context
const WizardContext = createContext<WizardContextType | undefined>(undefined);

// Custom hook to use the context
export const useWizardContext = () => {
    const context = useContext(WizardContext);
    if (context === undefined) {
        throw new Error('useWizardContext must be used within a WizardProvider');
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
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    
    // Enhanced form data setter that tracks changes
    const setFormData = (data: Partial<WizardFormData>) => {
        setFormDataState(prev => ({ ...prev, ...data }));
        setHasUnsavedChanges(true);
    };
    
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
                setProjects(response);
            } else if (response.success && Array.isArray(response.data)) {
                setProjects(response.data);
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
            toaster.error("Failed to fetch projects");
        } finally {
            setLoadingProjects(false);
        }
    };
    
    const fetchBuildingsByProject = async (projectId: number) => {
        try {
            setLoadingBuildings(true);
            const response = await apiRequest({
                method: "GET",
                endpoint: `Building/GetBuildingsList?projectId=${projectId}`,
                token: token || undefined,
            });
            if (Array.isArray(response)) {
                setBuildings(response);
            } else if (response.success && Array.isArray(response.data)) {
                setBuildings(response.data);
            }
        } catch (error) {
            console.error("Error fetching buildings:", error);
            toaster.error("Failed to fetch buildings");
        } finally {
            setLoadingBuildings(false);
        }
    };
    
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
        return formData.buildingIds.length > 0;
    };
    
    const validateStep3 = (): boolean => {
        return formData.subcontractorId !== null;
    };
    
    const validateStep4 = (): boolean => {
        return (
            formData.contractId !== null &&
            formData.currencyId !== null &&
            formData.contractNumber.trim() !== '' &&
            formData.contractDate !== '' &&
            formData.completionDate !== ''
        );
    };
    
    const validateStep5 = (): boolean => {
        return formData.boqData.some(building => building.items.length > 0);
    };
    
    const validateStep6 = (): boolean => {
        return true; // Review step doesn't require validation
    };
    
    const validateStep7 = (): boolean => {
        return true; // Preview step doesn't require validation
    };
    
    const validateCurrentStep = (): boolean => {
        switch (currentStep) {
            case 1: return validateStep1();
            case 2: return validateStep2();
            case 3: return validateStep3();
            case 4: return validateStep4();
            case 5: return validateStep5();
            case 6: return validateStep6();
            case 7: return validateStep7();
            default: return false;
        }
    };
    
    // Navigation functions
    const goToNextStep = () => {
        if (validateCurrentStep() && currentStep < 7) {
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
    const handleSubmit = async () => {
        try {
            setLoading(true);
            
            // Prepare JSON data for submission according to SubcontractorBoqVM structure
            const submitData: SubcontractorBoqVM = {
                id: 0, // New contract
                currencyId: formData.currencyId!,
                projectId: formData.projectId!,
                subContractorId: formData.subcontractorId!,
                contractId: formData.contractId!,
                contractDate: formData.contractDate,
                completionDate: formData.completionDate,
                advancePayment: formData.advancePayment,
                materialSupply: formData.materialSupply,
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
                buildings: formData.boqData.map(building => ({
                    id: building.buildingId, // Use actual building ID from selected building
                    buildingName: building.buildingName,
                    sheetId: 0, // Will be set by backend
                    sheetName: building.sheetName || "", // Use empty string if no sheet specified
                    replaceAllItems: true,
                    boqsContract: building.items.map(item => ({
                        id: 0, // Use 0 for all items in new contracts (backend will auto-generate IDs)
                        no: item.no,
                        key: item.key,
                        unite: item.unite,
                        qte: item.qte,
                        pu: item.pu,
                        costCode: item.costCode || '',
                        costCodeId: null as number | null,
                        boqtype: "Subcontractor",
                        boqSheetId: 0,
                        sheetName: building.sheetName || "", // Use empty string if no sheet specified
                        orderBoq: 0,
                        totalPrice: item.qte * item.pu
                    }))
                }))
            };
            
            // DEBUG: Log the data being sent to backend
            console.log("📤 SUBMITTING CONTRACT DATA:", JSON.stringify(submitData, null, 2));
            console.log("📤 Form Data Summary:", {
                projectId: formData.projectId,
                subcontractorId: formData.subcontractorId,
                contractId: formData.contractId,
                currencyId: formData.currencyId,
                buildingCount: formData.buildingIds.length,
                boqDataCount: formData.boqData.length,
                totalBoqItems: formData.boqData.reduce((sum, building) => sum + building.items.length, 0)
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
                                attachmentsType: attachment.type === 'PDF' ? 0 : 1, // AttachmentType enum
                                wordFile: attachment.file
                            });
                        }
                    } catch (docError) {
                        console.warn('Failed to upload some documents:', docError);
                        toaster.warning('Contract created but some documents failed to upload');
                    }
                }
                
                toaster.success("Contract created successfully!");
                setHasUnsavedChanges(false);
                // Navigation will be handled by the main component
            } else {
                throw new Error(result.error || "Failed to create contract");
            }
        } catch (error) {
            console.error("🚨 ERROR SUBMITTING FORM:", error);
            console.error("🚨 ERROR DETAILS:", {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            toaster.error(`Failed to create contract: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Initialize data on component mount
    useEffect(() => {
        if (token) {
            fetchProjects();
            fetchSubcontractors();
            fetchContracts();
            fetchCurrencies();
        }
    }, [token]);
    
    // Fetch buildings when project changes
    useEffect(() => {
        if (formData.projectId) {
            fetchBuildingsByProject(formData.projectId);
        }
    }, [formData.projectId]);
    
    // Context value
    const contextValue: WizardContextType = {
        // State
        formData,
        currentStep,
        hasUnsavedChanges,
        loading: loading || contractsApi.loading,
        loadingProjects,
        loadingBuildings,
        
        // Data
        projects,
        buildings,
        subcontractors,
        contracts,
        currencies,
        
        // Actions
        setFormData,
        setCurrentStep,
        setHasUnsavedChanges,
        
        // Data fetching
        fetchProjects,
        fetchBuildingsByProject,
        fetchSubcontractors,
        fetchContracts,
        fetchCurrencies,
        
        // Validation & Navigation
        validateCurrentStep,
        goToNextStep,
        goToPreviousStep,
        
        // Submission
        handleSubmit
    };
    
    return (
        <WizardContext.Provider value={contextValue}>
            {children}
        </WizardContext.Provider>
    );
};