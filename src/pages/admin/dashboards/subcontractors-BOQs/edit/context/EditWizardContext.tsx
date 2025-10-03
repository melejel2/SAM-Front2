import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
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

interface EditWizardFormData {
    id: number; // Different from new wizard - this has an ID
    projectId: number | null;
    tradeId: number | null;
    buildingIds: number[];
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
    tradeId: null,
    buildingIds: [],
    subcontractorId: null,
    contractId: null,
    currencyId: null,
    amount: 0, // Add missing amount property
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
    const { contractIdentifier } = useParams<{ contractIdentifier: string }>();
    const location = useLocation();
    const token = getToken();
    
    // Get actual contract ID from navigation state (for API calls) or try to parse if it's numeric
    const contractId = location.state?.contractId || 
        (!isNaN(Number(contractIdentifier)) ? contractIdentifier : null);
    
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
        setFormDataState(prev => ({ ...prev, ...data }));
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

    const fetchBuildingsWithSheets = useCallback(async (projectId: number) => {
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
                        const boqItemCount = (sheet.boqItems && Array.isArray(sheet.boqItems)) ? sheet.boqItems.length : 0;

                        return {
                            id: sheet.id,
                            name: sheet.name,
                            hasVo: sheet.hasVo || false,
                            isActive: sheet.isActive || true,
                            costCodeId: sheet.costCodeId,
                            boqItemCount: boqItemCount
                        };
                    });

                    return {
                        id: building.id,
                        name: building.name || building.buildingName || `Building ${building.id}`,
                        buildingName: building.buildingName,
                        sheets: enhancedSheets,
                        availableSheets: [],
                        sheetCount: enhancedSheets.length
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
    }, [token]);
    
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
    const loadExistingData = useCallback(async (contractId: number) => {
        try {
            setInitialDataLoading(true);
            const result = await contractsApi.loadSubcontractorData(contractId);
            
            if (result.success && result.data) {
                const existingData = result.data;
                
                // ✅ Store original contract data for project change detection
                setOriginalContractData(existingData);

                // 🔍 DEBUGGING: Log buildings and BOQ structure
                console.log("🔍 EDIT PAGE - Buildings and BOQ Structure:", {
                    contractId: contractId,
                    existingDataBuildings: existingData.buildings,
                    buildingsCount: existingData.buildings?.length || 0,
                    buildingDetails: existingData.buildings?.map((building: any) => ({
                        id: building.id,
                        buildingName: building.buildingName,
                        sheetName: building.sheetName,
                        boqsContractCount: building.boqsContract?.length || 0,
                        boqsContract: building.boqsContract || null,
                    })),
                });

                // 🔍 DEBUG: Log building IDs from existing data
                const extractedBuildingIds = existingData.buildings?.map((b: any) => b.id) || [];
                console.log("🏢 EDIT MODE - Building IDs from existing data:", {
                    existingDataBuildings: existingData.buildings,
                    extractedBuildingIds: extractedBuildingIds,
                    buildingCount: extractedBuildingIds.length
                });

                const newFormData = {
                    ...initialEditFormData,
                    id: existingData.id || contractId,
                    projectId: existingData.projectId,
                    buildingIds: extractedBuildingIds,
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
                    procurementConstruction: existingData.procurementConstraction || '',
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
                };

                setFormDataState(newFormData);
                
                // 🔍 DEBUG: Log final form data
                console.log("🏢 EDIT MODE - Final form data set:", {
                    buildingIds: newFormData.buildingIds,
                    buildingCount: newFormData.buildingIds.length,
                    projectId: newFormData.projectId,
                    tradeId: newFormData.tradeId
                });
                
                
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
        }
    }, [contractsApi, fetchBuildingsWithSheets]);
    
    // Validation functions (same as new wizard)
    const validateStep1 = (): boolean => {
        return formData.projectId !== null;
    };
    
    const validateStep2 = (): boolean => {
        return formData.tradeId !== null;
    };

    const validateStep3 = (): boolean => {
        return formData.buildingIds.length > 0;
    };

    const validateStep4 = (): boolean => {
        return formData.subcontractorId !== null;
    };

    const validateStep5 = (): boolean => {
        return (
            formData.contractId !== null &&
            formData.currencyId !== null &&
            formData.contractNumber.trim() !== '' &&
            formData.contractDate !== '' &&
            formData.completionDate !== ''
        );
    };

    const validateStep6 = (): boolean => {
        return formData.boqData.some(building => building.items.length > 0);
    };

    const validateStep7 = (): boolean => {
        return true; // Review step doesn't require validation
    };

    const validateStep8 = (): boolean => {
        return true; // Preview step doesn't require validation
    };
    
    const validateCurrentStep = useCallback((): boolean => {
        switch (currentStep) {
            case 1: return validateStep1();
            case 2: return validateStep2();
            case 3: return validateStep3();
            case 4: return validateStep4();
            case 5: return validateStep5();
            case 6: return validateStep6();
            case 7: return validateStep7();
            case 8: return validateStep8();
            default: return false;
        }
    }, [currentStep, formData]);
    
    // Navigation functions
    const goToNextStep = useCallback(() => {
        if (validateCurrentStep() && currentStep < 8) {
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
                    const [projectsRes, costCodesRes, subcontractorsRes, contractsRes, currenciesRes] = await Promise.allSettled([
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
                        })
                    ]);
                    
                    if (isMounted) {
                        // Process projects
                        if (projectsRes.status === 'fulfilled') {
                            const response = projectsRes.value;
                            if (Array.isArray(response)) {
                                setProjects(response);
                            } else if (response.success && Array.isArray(response.data)) {
                                setProjects(response.data);
                            }
                        } else {
                            console.error("Error fetching projects:", projectsRes.reason);
                            toaster.error("Failed to fetch projects");
                        }

                        // Process cost codes
                        if (costCodesRes.status === 'fulfilled') {
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
                        if (subcontractorsRes.status === 'fulfilled') {
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
                        if (contractsRes.status === 'fulfilled') {
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
                        if (currenciesRes.status === 'fulfilled') {
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

    // Build trades list from sheet names - ONLY sheets with actual BOQ data (matching budget BOQ behavior)
    useEffect(() => {
        if (formData.projectId && allBuildings.length > 0) {
            const tradesMap = new Map<string, Trade>();

            // Use sheet names as trades - but ONLY sheets with actual BOQ data
            allBuildings.forEach((building) => {
                building.sheets.forEach((sheet) => {
                    // Only include sheets that have actual BOQ data populated (matching budget BOQ behavior)
                    const hasBoqData = sheet.boqItemCount && sheet.boqItemCount > 0;

                    // 🔍 DEBUG: Log all sheets and their BOQ status, especially "Earth Works"
                    if (sheet.name === "Earth Works") {
                        console.log("🌍 EARTH WORKS SHEET DEBUG:", {
                            sheetName: sheet.name,
                            sheetId: sheet.id,
                            buildingName: building.name,
                            buildingId: building.id,
                            boqItemCount: sheet.boqItemCount,
                            hasBoqData,
                            willBeIncludedInTrades: hasBoqData
                        });
                    }

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
                                buildingCount: 1
                            });
                        }
                    }
                });
            });

            let finalTrades = Array.from(tradesMap.values()).sort((a, b) => a.name.localeCompare(b.name));

            // 🔧 EDIT MODE FIX: Ensure existing contract's trade is always available for editing
            // This handles cases where:
            // 1. Contract was created when trade had BOQ data
            // 2. BOQ data was later removed from project sheets
            // 3. Contract still needs to be editable
            if (originalContractData && originalContractData.buildings && originalContractData.buildings.length > 0) {
                const existingSheetName = originalContractData.buildings[0]?.sheetName;
                if (existingSheetName && !finalTrades.some(trade => trade.name === existingSheetName)) {
                    console.warn("⚠️ EDIT MODE - Contract uses trade with no current BOQ data:", existingSheetName);
                    console.warn("⚠️ This suggests the BOQ data was removed after contract creation");
                    console.log("🔧 EDIT MODE - Adding missing contract trade for editing:", existingSheetName);
                    
                    // Find the first sheet with this name to get an ID (even if boqItemCount = 0)
                    let sheetId = 0;
                    let foundSheet = false;
                    allBuildings.forEach(building => {
                        building.sheets.forEach(sheet => {
                            if (sheet.name === existingSheetName && sheetId === 0) {
                                sheetId = sheet.id;
                                foundSheet = true;
                            }
                        });
                    });
                    
                    if (foundSheet) {
                        // Add the missing trade (marked as legacy/empty)
                        finalTrades.push({
                            id: sheetId,
                            name: existingSheetName,
                            code: existingSheetName,
                            buildingCount: 1 // At least the buildings in the contract
                        });
                        
                        // Re-sort after adding
                        finalTrades = finalTrades.sort((a, b) => a.name.localeCompare(b.name));
                        console.log("🔧 EDIT MODE - Updated trades list now includes:", finalTrades.map(t => t.name));
                    } else {
                        console.error("🚨 CRITICAL - Contract trade doesn't exist in project:", existingSheetName);
                    }
                }
            }

            setTrades(finalTrades);

            // 🔧 FIX: Set tradeId based on existing contract data
            // If we have existing contract data and haven't set tradeId yet, match by sheet name
            if (originalContractData && !formData.tradeId && originalContractData.buildings && originalContractData.buildings.length > 0) {
                const existingSheetName = originalContractData.buildings[0]?.sheetName;
                const existingBuildingIds = originalContractData.buildings.map((b: any) => b.id) || [];
                
                console.log("🔍 TRADE MATCHING DEBUG:", {
                    existingSheetName,
                    finalTradesCount: finalTrades.length,
                    finalTradesNames: finalTrades.map(t => t.name),
                    originalContractDataExists: !!originalContractData,
                    currentTradeId: formData.tradeId,
                    existingBuildingIds
                });
                
                if (existingSheetName) {
                    // ONLY exact match - no fuzzy matching
                    const matchingTrade = finalTrades.find(trade => trade.name === existingSheetName);
                    
                    console.log("🔍 TRADE MATCHING RESULT:", {
                        searchingFor: existingSheetName,
                        matchingTrade,
                        found: !!matchingTrade,
                        availableTradesWithBoqData: finalTrades.map(t => t.name)
                    });
                    
                    if (matchingTrade) {
                        console.log(`🔧 EDIT MODE - Setting tradeId to ${matchingTrade.id} for sheet "${existingSheetName}" with buildingIds:`, existingBuildingIds);
                        // Set both tradeId AND preserve buildingIds in one update to avoid race condition
                        setFormDataState(prev => ({ 
                            ...prev, 
                            tradeId: matchingTrade.id,
                            buildingIds: existingBuildingIds // Ensure building IDs are preserved
                        }));
                    } else {
                        console.error("🚨 EDIT MODE - No EXACT match found for sheet:", existingSheetName);
                        console.error("🚨 This means 'Earth Works' sheet either:");
                        console.error("   1. Has no BOQ items (boqItemCount = 0)");
                        console.error("   2. Doesn't exist in current project buildings");
                        console.error("   3. Sheet name changed after contract was created");
                        console.error("🚨 Available trades (sheets with BOQ data):", finalTrades.map(t => t.name));
                    }
                } else {
                    console.warn("🚨 EDIT MODE - No sheetName found in existing contract data");
                }
            }
        }
    }, [formData.projectId, allBuildings, originalContractData]); // Add originalContractData dependency

    // Fetch buildings with sheets when project changes
    useEffect(() => {
        if (formData.projectId) {
            fetchBuildingsWithSheets(formData.projectId);
            // Clear trade and building selections when project changes
            setFormData({ tradeId: null, buildingIds: [] });
        }
    }, [formData.projectId]);

    // Filter buildings when trade changes (SIMPLE: based on sheet names)
    useEffect(() => {
        if (formData.tradeId && allBuildings.length > 0) {
            // Find the selected trade
            const selectedTrade = trades.find(t => t.id === formData.tradeId);
            if (selectedTrade) {
                const filteredBuildings = allBuildings.map(building => {
                    // Filter sheets by trade name (sheet name)
                    const availableSheets = building.sheets.filter(sheet =>
                        sheet.name === selectedTrade.name
                    );
                    return {
                        ...building,
                        availableSheets,
                        sheetCount: availableSheets.length
                    };
                }).filter(building => building.sheetCount > 0);

                console.log(`🔍 EDIT Filtered buildings for trade "${selectedTrade.name}":`, filteredBuildings);
                setBuildings(filteredBuildings);
                
                // 🔍 DEBUG: Log building IDs state during filtering
                console.log("🏢 BUILDING FILTER - Current state:", {
                    selectedTradeId: formData.tradeId,
                    selectedTradeName: selectedTrade.name,
                    currentBuildingIds: formData.buildingIds,
                    filteredBuildingIds: filteredBuildings.map(b => b.id),
                    buildingIdsStillValid: formData.buildingIds.filter(id => 
                        filteredBuildings.some(b => b.id === id)
                    ),
                    hasOriginalContractData: !!originalContractData
                });
                
                // 🔧 FIX: Only clear building selection if this is NOT from loading existing contract data
                // If we have existing contract data, preserve the building selections
                if (!originalContractData) {
                    // Clear building selection when trade changes (only for new contracts)
                    setFormData({ buildingIds: [] });
                } else {
                    // For edit mode, ensure we don't accidentally clear building IDs
                    // If building IDs are empty but we have original data, restore them
                    if (formData.buildingIds.length === 0 && originalContractData.buildings) {
                        const restoredBuildingIds = originalContractData.buildings.map((b: any) => b.id) || [];
                        console.log("🔧 EDIT MODE - Restoring building IDs during filter:", restoredBuildingIds);
                        setFormDataState(prev => ({ ...prev, buildingIds: restoredBuildingIds }));
                    }
                }
            }
        } else if (!formData.tradeId) {
            // Reset to all buildings when no trade selected
            setBuildings(allBuildings);
        }
    }, [formData.tradeId, allBuildings, trades, originalContractData]); // Add originalContractData dependency

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
        trades,
        buildings,
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
        handleSubmit
    };
    
    return (
        <EditWizardContext.Provider value={contextValue}>
            {children}
        </EditWizardContext.Provider>
    );
};