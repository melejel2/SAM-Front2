import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
    ContractBuilding
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

// Provider Props
interface ContractVOWizardProviderProps {
    children: ReactNode;
    contractId: string;
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
    contractId 
}) => {
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const token = getToken();
    
    // State
    const [currentStep, setCurrentStep] = useState(1);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(false);
    const [contractData, setContractData] = useState<ContractData | null>(null);
    const [availableBuildings, setAvailableBuildings] = useState<Building[]>([]);
    const [contractLoading, setContractLoading] = useState(false);
    const [buildingsLoading, setBuildingsLoading] = useState(false);
    
    // Initialize form data with contract context
    const [formData, setFormDataState] = useState<ContractVOFormData>({
        // Step 1: VO Basic Information
        voNumber: generateVONumberLocal(),
        voDate: new Date().toISOString().split('T')[0],
        voType: 'Addition',
        description: '',
        
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
    
    // Enhanced form data setter that tracks changes
    const setFormData = (data: Partial<ContractVOFormData>) => {
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
    };
    
    // Load contract data and generate VO number on mount
    useEffect(() => {
        const loadContractData = async () => {
            try {
                setContractLoading(true);
                
                console.log("🔄 Loading contract data for VO creation:", {
                    contractId: contractId,
                    contractIdParsed: parseInt(contractId),
                    hasToken: !!token,
                    tokenLength: token?.length || 0
                });
                
                // Load contract details using the new API
                const contractResponse = await getContractForVO(parseInt(contractId), token || '');
                
                console.log("📡 Contract response:", contractResponse);
                
                if (contractResponse.success && contractResponse.data) {
                    const contractContext = contractResponse.data;
                    
                    // Transform to local ContractData format
                    const contractInfo: ContractData = {
                        ...contractContext,
                        buildings: contractContext.buildings.map(building => ({
                            ...building,
                            selected: false
                        }))
                    };
                    
                    setContractData(contractInfo);
                    setAvailableBuildings(contractInfo.buildings);
                    
                    // Generate proper VO number
                    const voNumberResponse = await generateVONumber(parseInt(contractId), token || '');
                    const finalVoNumber = voNumberResponse.success ? voNumberResponse.data! : generateVONumberLocal();
                    
                    // Update form data with contract context
                    setFormData({
                        voNumber: finalVoNumber,
                        contractId: contractInfo.id,
                        contractNumber: contractInfo.contractNumber,
                        projectId: contractInfo.projectId,
                        projectName: contractInfo.projectName,
                        subcontractorId: contractInfo.subcontractorId,
                        subcontractorName: contractInfo.subcontractorName,
                        currencyId: contractInfo.currencyId,
                        currencySymbol: contractInfo.currencySymbol
                    });
                } else {
                    const errorMsg = contractResponse.error || "Failed to load contract details";
                    console.error("❌ Contract loading failed:", {
                        success: contractResponse.success,
                        error: contractResponse.error,
                        message: contractResponse.message || 'No message',
                        contractId: contractId
                    });
                    toaster.error(errorMsg);
                }
            } catch (error) {
                console.error("🚨 Exception loading contract data:", {
                    error: error,
                    contractId: contractId,
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                });
                toaster.error("Failed to load contract information: " + (error instanceof Error ? error.message : 'Unknown error'));
            } finally {
                setContractLoading(false);
            }
        };
        
        if (contractId && token) {
            loadContractData();
        }
    }, [contractId, token]);
    
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
                   item.description.trim() !== '' && 
                   item.quantity > 0 && 
                   item.unitPrice !== 0
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
            id: Date.now(), // Temporary ID
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
                // Recalculate total price if quantity or unit price changed
                if ('quantity' in updatedItem || 'unitPrice' in updatedItem) {
                    updated.totalPrice = updated.quantity * updated.unitPrice;
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
            const voDataset = transformFormDataToVoDataset(formData, contractData);
            
            console.log("📤 SUBMITTING CONTRACT VO DATA:", JSON.stringify(voDataset, null, 2));
            
            // Create VO using proper API
            const response = await createContractVO(voDataset, token || '');
            
            if (response.success) {
                toaster.success("Variation Order created successfully!");
                setHasUnsavedChanges(false);
                
                // Navigate back to contract details page
                window.location.href = `/dashboard/subcontractors-boqs/details/${contractId}`;
            } else {
                throw new Error(response.error || "Failed to create VO");
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