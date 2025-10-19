import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import {
    getContractForVO,
    getContractBuildings,
    getContractBOQItems,
    generateVONumber,
    createContractVO,
    transformFormDataToVoDataset,
    ContractContext,
    ContractBuilding,
    getVoContracts,
    getVoDatasetWithBoqs, // Added for fetching VO dataset with BOQs
    VoDatasetBoqDetailsVM // Added for VO dataset type
} from "@/api/services/vo-api";

// Types and Interfaces
// Re-export types from VO API for backward compatibility
type ContractData = ContractContext & {
    buildings: (ContractBuilding & { selected: boolean })[];
};

type Building = ContractBuilding & { selected: boolean; };

interface VOLineItem {
    id?: number;
    no: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    costCode?: string;
    buildingId?: number;
}

interface ContractVOFormData {
    // Step 1: VO Basic Information
    voNumber: string;
    voDate: string;
    voType: 'Addition' | 'Omission';
    description: string;
    voContractId?: number;
    subTrade: string;
    
    // Step 2: Contract Context (read-only, from contract)
    contractId: number;
    contractNumber: string;
    projectId: number;
    projectName: string;
    subcontractorId: number;
    subcontractorName: string;
    currencyId: number;
    currencySymbol: string;
    
    // Step 3: Building Selection
    selectedBuildingIds: number[];
    
    // Step 4: VO Line Items
    lineItems: VOLineItem[];
    
    // Calculated values
    totalAmount: number;
    totalAdditions: number;
    totalDeductions: number;
}

// Context Interface
interface ContractVOWizardContextType {
    // State
    formData: ContractVOFormData;
    currentStep: number;
    hasUnsavedChanges: boolean;
    loading: boolean;
    
    // Contract data
    contractData: ContractData | null;
    availableBuildings: Building[];
    
    // API state
    contractLoading: boolean;
    buildingsLoading: boolean;
    voContracts: any[];
    voContractsLoading: boolean;
    
    // Actions
    setFormData: (data: Partial<ContractVOFormData>) => void;
    setCurrentStep: (step: number) => void;
    setHasUnsavedChanges: (changed: boolean) => void;
    
    // Validation & Navigation
    validateCurrentStep: () => boolean;
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    
    // VO Line Items Management
    addLineItem: (item: Omit<VOLineItem, 'id' | 'totalPrice'>) => void;
    updateLineItem: (index: number, item: Partial<VOLineItem>) => void;
    removeLineItem: (index: number) => void;
    
    // Submission
    handleSubmit: () => Promise<void>;
}

// Create Context
const ContractVOWizardContext = createContext<ContractVOWizardContextType | undefined>(undefined);

// Custom hook to use the context
export const useContractVOWizardContext = () => {
    const context = useContext(ContractVOWizardContext);
    if (context === undefined) {
        throw new Error('useContractVOWizardContext must be used within a ContractVOWizardProvider');
    }
    return context;
};

// Helper function to map fetched VO data to form data
const mapVoDatasetToFormData = (
    voDataset: any,
    contractContext: ContractContext
): ContractVOFormData => {
    // Flatten all line items from all buildings into a single array
    const lineItems: VOLineItem[] = [];
    if (voDataset.buildings) {
        voDataset.buildings.forEach(building => {
            if (building.contractVoes) {
                building.contractVoes.forEach(vo => {
                    lineItems.push({
                        id: vo.id,
                        no: vo.no,
                        description: vo.key, // 'Key' in backend is 'description' in frontend
                        unit: vo.unite,
                        quantity: vo.qte,
                        unitPrice: vo.pu,
                        totalPrice: vo.totalPrice,
                        costCode: vo.costCode,
                        buildingId: building.id
                    });
                });
            }
        });
    }

    const totalAdditions = lineItems
        .filter(item => item.totalPrice > 0)
        .reduce((sum, item) => sum + item.totalPrice, 0);

    const totalDeductions = Math.abs(
        lineItems
            .filter(item => item.totalPrice < 0)
            .reduce((sum, item) => sum + item.totalPrice, 0)
    );

    return {
        voNumber: voDataset.voNumber,
        voDate: voDataset.date ? voDataset.date.split('T')[0] : '', // Extract date part only, or default to empty string
        voType: voDataset.type === 'Addition' ? 'Addition' : 'Omission',
        description: voDataset.remark, // 'Remark' in backend is 'description' in frontend
        voContractId: voDataset.contractId,
        subTrade: voDataset.subTrade,

        // Contract Context (from provided contractContext or fallback)
        contractId: contractContext.id,
        contractNumber: contractContext.contractNumber,
        projectId: contractContext.projectId,
        projectName: contractContext.projectName,
        subcontractorId: contractContext.subcontractorId,
        subcontractorName: contractContext.subcontractorName,
        currencyId: contractContext.currencyId,
        currencySymbol: contractContext.currencySymbol,

        selectedBuildingIds: (voDataset.buildings || []).map(b => b.id),
        lineItems: lineItems,
        totalAmount: voDataset.amount,
        totalAdditions: totalAdditions,
        totalDeductions: totalDeductions
    };
};

// Provider Props
interface ContractVOWizardProviderProps {
    children: ReactNode;
    contractId: string;
    voDatasetId?: number; // Added for editing existing VO datasets
}

// Generate VO Number Helper
const generateVONumberLocal = (): string => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const time = date.getTime().toString().slice(-4);
    return `VO-${year}${month}${day}-${time}`;
};

// Provider Component
export const ContractVOWizardProvider: React.FC<ContractVOWizardProviderProps> = ({
    children,
    contractId,
    voDatasetId // Destructure voDatasetId here
}) => {
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const navigate = useNavigate();
    const memoizedToken = useMemo(() => getToken(), [getToken]);
    
    // State
    const [currentStep, setCurrentStep] = useState(1);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(false);
    const [contractData, setContractData] = useState<ContractData | null>(null);
    const [availableBuildings, setAvailableBuildings] = useState<Building[]>([]);
    const [contractLoading, setContractLoading] = useState(false);
    const [buildingsLoading, setBuildingsLoading] = useState(false);
    const [voContracts, setVoContracts] = useState<any[]>([]);
    const [voContractsLoading, setVoContractsLoading] = useState(false);
    
    // Initialize form data with contract context
    const [formData, setFormDataState] = useState<ContractVOFormData>({
        // Step 1: VO Basic Information
        voNumber: generateVONumberLocal(),
        voDate: new Date().toISOString().split('T')[0],
        voType: 'Addition',
        description: '',
        voContractId: undefined,
        subTrade: '',
        
        // Step 2: Contract Context (will be populated from contract data)
        contractId: parseInt(contractId),
        contractNumber: '',
        projectId: 0,
        projectName: '',
        subcontractorId: 0,
        subcontractorName: '',
        currencyId: 0,
        currencySymbol: '$',
        
        // Step 3: Building Selection
        selectedBuildingIds: [],
        
        // Step 4: VO Line Items
        lineItems: [],
        
        // Calculated values
        totalAmount: 0,
        totalAdditions: 0,
        totalDeductions: 0
    });

    // State to hold the fetched VO dataset for editing
    const [initialVoDataset, setInitialVoDataset] = useState<VoDatasetBoqDetailsVM | null>(null);

    // Enhanced form data setter that tracks changes
    const setFormData = useCallback((data: Partial<ContractVOFormData>) => {
        setFormDataState(prev => {
            const updated = { ...prev, ...data };
            
            // Recalculate totals when line items change
            if (data.lineItems) {
                const additions = data.lineItems
                    .filter(item => item.totalPrice > 0)
                    .reduce((sum, item) => sum + item.totalPrice, 0);
                    
                const deductions = Math.abs(
                    data.lineItems
                        .filter(item => item.totalPrice < 0)
                        .reduce((sum, item) => sum + item.totalPrice, 0)
                );
                
                updated.totalAdditions = additions;
                updated.totalDeductions = deductions;
                updated.totalAmount = additions - deductions;
            }
            
            return updated;
        });
        setHasUnsavedChanges(true);
    }, []);

    // Memoized function to load contract-related data
    const loadData = useCallback(async () => {
        setContractLoading(true);
        setLoading(true); // Set overall loading for initial data fetch

        try {
            // 1. Load Contract Details
            console.log("🔄 Loading contract data for VO wizard:", { contractId, voDatasetId });
            const contractResponse = await getContractForVO(parseInt(contractId), memoizedToken || '');

            if (!contractResponse.success || !contractResponse.data) {
                throw new Error(contractResponse.message || "Failed to load contract details");
            }
            const contractContext = contractResponse.data;
            
            let initialFormState: Partial<ContractVOFormData> = {};
            let fetchedVoDataset: VoDatasetBoqDetailsVM | null = null;
            let selectedBuildingIdsFromVo: number[] = []; // To store selected building IDs from VO dataset

            // 2. If voDatasetId is provided, load existing VO data
            if (voDatasetId) {
                console.log("🔄 Loading existing VO dataset for editing:", { voDatasetId, token: memoizedToken });
                const voDatasetResponse = await getVoDatasetWithBoqs(voDatasetId, memoizedToken || '');
                console.log("📥 VO dataset response:", voDatasetResponse);

                if (!voDatasetResponse || !voDatasetResponse.id) {
                    console.error("❌ VO dataset response failed:", voDatasetResponse);
                    throw new Error(voDatasetResponse.message || "Failed to load existing VO dataset");
                }
                fetchedVoDataset = voDatasetResponse;
                setInitialVoDataset(fetchedVoDataset);
                initialFormState = mapVoDatasetToFormData(fetchedVoDataset!, contractContext);
                selectedBuildingIdsFromVo = initialFormState.selectedBuildingIds || []; // Get selected building IDs
                setHasUnsavedChanges(false); // No unsaved changes initially for edit mode
                console.log("✅ Successfully loaded VO dataset for editing:", { voDatasetId, initialFormState });
            } else {
                // For new VO, generate VO number
                const voNumberResponse = await generateVONumber(parseInt(contractId), memoizedToken || '');
                initialFormState.voNumber = voNumberResponse.success ? voNumberResponse.data! : generateVONumberLocal();
            }

            // 1. Load Contract Details and update building selection based on VO data if in edit mode
            const contractInfo: ContractData = {
                ...contractContext,
                buildings: contractContext.buildings.map(building => ({
                    ...building,
                    selected: selectedBuildingIdsFromVo.includes(building.id) // Mark as selected if in VO dataset
                }))
            };
            setContractData(contractInfo);
            setAvailableBuildings(contractInfo.buildings); // Set available buildings with correct selection state

            // 3. Update form data with contract context and (if editing) VO data
            setFormDataState(prev => {
                const newState = {
                    ...prev,
                    ...initialFormState,
                    contractId: contractInfo.id,
                    contractNumber: contractInfo.contractNumber,
                    projectId: contractInfo.projectId,
                    projectName: contractInfo.projectName,
                    subcontractorId: contractInfo.subcontractorId,
                    subcontractorName: contractInfo.subcontractorName,
                    currencyId: contractInfo.currencyId,
                    currencySymbol: contractInfo.currencySymbol
                };
                return newState;
            });

        } catch (error) {
            console.error("🚨 Exception loading data for VO wizard:", { error });
            toaster.error("Failed to load wizard information: " + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setContractLoading(false);
            setLoading(false); // End overall loading
        }
    }, [contractId, voDatasetId, memoizedToken, toaster]);

    // Memoized function to load VO contracts
    const loadVoContracts = useCallback(async () => {
        setVoContractsLoading(true);
        try {
            const response = await getVoContracts(memoizedToken || '');
            if (Array.isArray(response)) {
                setVoContracts(response);
            } else {
                toaster.error("Failed to load VO contracts: Invalid response format.");
            }
        } catch (error) {
            toaster.error("Failed to load VO contracts.");
        } finally {
            setVoContractsLoading(false);
        }
    }, [memoizedToken, toaster]);

    // Load data on mount and when dependencies change
    useEffect(() => {
        if (contractId && memoizedToken) {
            loadData();
            loadVoContracts();
        }
    }, [contractId, memoizedToken, voDatasetId]);
    
    // Validation functions
    const validateStep1 = (): boolean => {
        return (
            formData.voNumber.trim() !== '' &&
            formData.voDate !== '' &&
            formData.description.trim() !== ''
        );
    };
    
    const validateStep2 = (): boolean => {
        return true; // Contract context is read-only, always valid
    };
    
    const validateStep3 = (): boolean => {
        return formData.selectedBuildingIds.length > 0;
    };
    
    const validateStep4 = (): boolean => {
        return formData.lineItems.length > 0 && 
               formData.lineItems.every(item => 
                   item.no.trim() !== '' && 
                   item.quantity >= 0
               );
    };
    
    const validateStep5 = (): boolean => {
        return true; // Review step doesn't require validation
    };
    
    const validateCurrentStep = (): boolean => {
        switch (currentStep) {
            case 1: return validateStep1();
            case 2: return validateStep2();
            case 3: return validateStep3();
            case 4: return validateStep4();
            case 5: return validateStep5();
            default: return false;
        }
    };
    
    // Navigation functions
    const goToNextStep = () => {
        if (validateCurrentStep()) {
            if (currentStep === 1) {
                // Skip step 2 (contract review) since we're already in contract context
                setCurrentStep(3);
            } else if (currentStep < 5) {
                setCurrentStep(currentStep + 1);
            }
        }
    };
    
    const goToPreviousStep = () => {
        if (currentStep === 3) {
            // Skip step 2 when going back from step 3
            setCurrentStep(1);
        } else if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    // VO Line Items Management
    const addLineItem = (item: Omit<VOLineItem, 'id' | 'totalPrice'>) => {
        const newItem: VOLineItem = {
            ...item,
            id: 0, // Set to 0 for new items, backend will generate ID
            totalPrice: item.quantity * item.unitPrice
        };
        
        setFormData({
            lineItems: [...formData.lineItems, newItem]
        });
    };
    
    const updateLineItem = (index: number, updatedItem: Partial<VOLineItem>) => {
        const updatedItems = formData.lineItems.map((item, i) => {
            if (i === index) {
                const updated = { ...item, ...updatedItem };
                // Ensure quantity and unitPrice are numbers for calculation
                const quantity = Number(updated.quantity) || 0;
                const unitPrice = Number(updated.unitPrice) || 0;

                // Recalculate total price if quantity or unit price changed
                if ('quantity' in updatedItem || 'unitPrice' in updatedItem) {
                    updated.totalPrice = quantity * unitPrice;
                }
                return updated;
            }
            return item;
        });
        
        setFormData({ lineItems: updatedItems });
    };
    
    const removeLineItem = (index: number) => {
        const updatedItems = formData.lineItems.filter((_, i) => i !== index);
        setFormData({ lineItems: updatedItems });
    };
    
    // Submission function with proper API integration
    const handleSubmit = async () => {
        try {
            setLoading(true);
            
            if (!contractData) {
                throw new Error('Contract context not loaded');
            }
            
            // Transform form data to backend format
            const voDataset = transformFormDataToVoDataset(formData, contractData, voDatasetId);
            
            console.log("📤 SUBMITTING CONTRACT VO DATA:", JSON.stringify(voDataset, null, 2));
            
            // Determine if we are creating or updating
            const isUpdate = !!voDatasetId;

            const response = await createContractVO(voDataset, memoizedToken || '');
            
            if (response.success) {
                toaster.success(`Variation Order ${isUpdate ? 'updated' : 'created'} successfully!`);
                setHasUnsavedChanges(false);
                
                // Navigate back to contract details page using contract number
                const contractNumber = formData.contractNumber || contractId;
                navigate(`/dashboard/subcontractors-boqs/details/${contractNumber}`);
            } else {
                throw new Error((response as any).error || "Failed to create VO");
            }
        } catch (error) {
            console.error("🚨 ERROR SUBMITTING CONTRACT VO:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            toaster.error(`Failed to create VO: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Context value
    const contextValue: ContractVOWizardContextType = {
        // State
        formData,
        currentStep,
        hasUnsavedChanges,
        loading,
        
        // Contract data
        contractData,
        availableBuildings,
        
        // API state
        contractLoading,
        buildingsLoading,
        voContracts,
        voContractsLoading,
        
        // Actions
        setFormData,
        setCurrentStep,
        setHasUnsavedChanges,
        
        // Validation & Navigation
        validateCurrentStep,
        goToNextStep,
        goToPreviousStep,
        
        // VO Line Items Management
        addLineItem,
        updateLineItem,
        removeLineItem,
        
        // Submission
        handleSubmit
    };
    
    return (
        <ContractVOWizardContext.Provider value={contextValue}>
            {children}
        </ContractVOWizardContext.Provider>
    );
};