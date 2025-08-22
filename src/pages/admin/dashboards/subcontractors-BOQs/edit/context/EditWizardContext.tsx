import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParams } from "react-router-dom";
import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import { useContractsApi } from "../../hooks/use-contracts-api";
import type { SubcontractorBoqVM } from "@/types/contracts";

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

export interface BOQItem {
    id?: number;
    no: string;
    key: string;
    costCode?: string;
    unite: string;
    qte: number;
    pu: number;
    totalPrice?: number;
}

interface EditWizardFormData {
    id: number; // Different from new wizard - this has an ID
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
    buildings: Building[];
    subcontractors: Subcontractor[];
    contracts: Contract[];
    currencies: Currency[];
    
    // Actions
    setFormData: (data: Partial<EditWizardFormData>) => void;
    setCurrentStep: (step: number) => void;
    setHasUnsavedChanges: (changed: boolean) => void;
    
    // Data fetching
    fetchProjects: () => Promise<void>;
    fetchBuildingsByProject: (projectId: number) => Promise<void>;
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
const EditWizardContext = createContext<EditWizardContextType | undefined>(undefined);

// Custom hook to use the context
export const useEditWizardContext = () => {
    const context = useContext(EditWizardContext);
    if (context === undefined) {
        throw new Error('useEditWizardContext must be used within an EditWizardProvider');
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
    const { id } = useParams<{ id: string }>();
    const token = getToken();
    
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
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    
    // Enhanced form data setter that tracks changes
    const setFormData = (data: Partial<EditWizardFormData>) => {
        setFormDataState(prev => ({ ...prev, ...data }));
        setHasUnsavedChanges(true);
    };
    
    // Data fetching functions (same as new wizard)
    const fetchProjects = async () => {
        try {
            setLoadingProjects(true);
            const response = await apiRequest({
                method: "GET",
                endpoint: "Project/GetProjectsList",
                token: token || undefined,
            });
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
    
    // Initialize contracts API hook
    const contractsApi = useContractsApi();
    
    // Load existing data for editing using the new API service
    const loadExistingData = async (contractId: number) => {
        try {
            setInitialDataLoading(true);
            const result = await contractsApi.loadSubcontractorData(contractId);
            
            if (result.success && result.data) {
                const existingData = result.data;
                setFormDataState({
                    ...initialEditFormData,
                    id: existingData.id || contractId,
                    projectId: existingData.projectId,
                    buildingIds: existingData.buildings?.map((b: any) => b.id) || [],
                    subcontractorId: existingData.subContractorId,
                    contractId: existingData.contractId,
                    currencyId: existingData.currencyId,
                    contractNumber: existingData.contractNumber || '',
                    contractDate: existingData.contractDate ? existingData.contractDate.split('T')[0] : '',
                    completionDate: existingData.completionDate ? existingData.completionDate.split('T')[0] : '',
                    advancePayment: existingData.advancePayment || 0,
                    materialSupply: existingData.materialSupply || 0,
                    purchaseIncrease: existingData.purchaseIncrease || '',
                    latePenalties: existingData.latePenalties || '',
                    latePenalityCeiling: existingData.latePenalityCeiling || '',
                    holdWarranty: existingData.holdWarranty || '',
                    mintenancePeriod: existingData.mintenancePeriod || '',
                    workWarranty: existingData.workWarranty || '',
                    termination: existingData.termination || '',
                    daysNumber: existingData.daysNumber || '',
                    progress: existingData.progress || '',
                    holdBack: existingData.holdBack || '',
                    subcontractorAdvancePayee: existingData.subcontractorAdvancePayee || '',
                    recoverAdvance: existingData.recoverAdvance || '',
                    procurementConstruction: existingData.procurementConstruction || '',
                    prorataAccount: existingData.prorataAccount || '',
                    managementFees: existingData.managementFees || '',
                    plansExecution: existingData.plansExecution || '',
                    subTrade: existingData.subTrade || '',
                    paymentsTerm: existingData.paymentsTerm || '',
                    remark: existingData.remark || '',
                    remarkCP: existingData.remarkCP || '',
                    attachments: [],
                    boqData: existingData.buildings?.map((building: any) => ({
                        buildingId: building.id,
                        buildingName: building.buildingName,
                        sheetName: building.sheetName || '', // Use empty string if no sheet specified
                        items: building.boqsContract?.map((item: any) => ({
                            id: item.id,
                            no: item.no,
                            key: item.key,
                            costCode: item.costCode || '',
                            unite: item.unite,
                            qte: item.qte,
                            pu: item.pu,
                            totalPrice: item.totalPrice || (item.qte * item.pu)
                        })) || []
                    })) || []
                });
                
                // Load buildings for the project
                if (existingData.projectId) {
                    await fetchBuildingsByProject(existingData.projectId);
                }
                
                setHasUnsavedChanges(false);
            }
        } catch (error) {
            console.error("Error loading existing data:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            toaster.error(`Failed to load contract data: ${errorMessage}`);
        } finally {
            setInitialDataLoading(false);
        }
    };
    
    // Validation functions (same as new wizard)
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
        return true;
    };
    
    const validateStep7 = (): boolean => {
        return true;
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
    
    // Submission function for updates using the new API service
    const handleSubmit = async () => {
        try {
            setLoading(true);
            
            // Prepare JSON data for submission according to SubcontractorBoqVM structure
            const submitData: SubcontractorBoqVM = {
                id: formData.id, // Existing contract ID
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
                    id: building.buildingId || 0,
                    buildingName: building.buildingName,
                    sheetId: 0, // Will be managed by backend
                    sheetName: building.sheetName || "", // Use empty string if no sheet specified
                    replaceAllItems: true,
                    boqsContract: building.items.map(item => ({
                        id: item.id && item.id > 0 && item.id < 2147483647 ? item.id : 0, // Use existing ID if valid, otherwise 0 for new items
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
            
            // Use the new API service
            const result = await contractsApi.saveContract(submitData, false);
            
            if (result.success) {
                // Upload new documents if any
                if (formData.attachments.length > 0) {
                    try {
                        for (const attachment of formData.attachments) {
                            await contractsApi.attachDocument({
                                contractsDataSetId: formData.id,
                                attachmentsType: attachment.type === 'PDF' ? 0 : 1, // AttachmentType enum
                                wordFile: attachment.file
                            });
                        }
                    } catch (docError) {
                        console.warn('Failed to upload some documents:', docError);
                        toaster.warning('Contract updated but some documents failed to upload');
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
        } finally {
            setLoading(false);
        }
    };
    
    // Initialize data on component mount
    useEffect(() => {
        const initializeData = async () => {
            if (token) {
                await Promise.all([
                    fetchProjects(),
                    fetchSubcontractors(),
                    fetchContracts(),
                    fetchCurrencies()
                ]);
                
                // Load existing contract data
                if (id) {
                    await loadExistingData(parseInt(id));
                }
            }
        };
        
        initializeData();
    }, [id, token]);
    
    // Context value
    const contextValue: EditWizardContextType = {
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
        loadExistingData,
        
        // Validation & Navigation
        validateCurrentStep,
        goToNextStep,
        goToPreviousStep,
        
        // Submission
        handleSubmit
    };
    
    return (
        <EditWizardContext.Provider value={contextValue}>
            {children}
        </EditWizardContext.Provider>
    );
};