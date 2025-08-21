import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import { useVariationOrders, useVoDatasets } from "../..";
import type { VariationOrder, VODataset, CreateVORequest } from "@/types/variation-order";

// Simplified VO Form Data (much simpler than subcontractor wizard)
interface VOWizardFormData {
    // Step 1: Basic Info
    title: string;
    description: string;
    level: 'Project' | 'Building' | 'Sheet';
    
    // Step 2: Project/Building Selection
    projectId: number | null;
    buildingId: number | null;
    sheetName: string;
    
    // Step 3: VO Data
    uploadFile?: File;
    voItems: any[];
    
    // Step 4: Review & Save
    approved: boolean;
}

// Context Interface (simplified version of subcontractor wizard)
interface VOWizardContextType {
    // State
    formData: VOWizardFormData;
    currentStep: number;
    hasUnsavedChanges: boolean;
    loading: boolean;
    
    // Actions
    setFormData: (data: Partial<VOWizardFormData>) => void;
    setCurrentStep: (step: number) => void;
    setHasUnsavedChanges: (changed: boolean) => void;
    
    // Validation & Navigation
    validateCurrentStep: () => boolean;
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    
    // Submission
    handleSubmit: () => Promise<void>;
}

// Initial form data
const initialFormData: VOWizardFormData = {
    title: '',
    description: '',
    level: 'Project',
    projectId: null,
    buildingId: null,
    sheetName: '',
    voItems: [],
    approved: false
};

// Create Context
const VOWizardContext = createContext<VOWizardContextType | undefined>(undefined);

// Custom hook to use the context
export const useVOWizardContext = () => {
    const context = useContext(VOWizardContext);
    if (context === undefined) {
        throw new Error('useVOWizardContext must be used within a VOWizardProvider');
    }
    return context;
};

// Provider Props
interface VOWizardProviderProps {
    children: ReactNode;
}

// Provider Component (simplified version following subcontractor patterns)
export const VOWizardProvider: React.FC<VOWizardProviderProps> = ({ children }) => {
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const { uploadVo, saveVo } = useVariationOrders();
    const { saveVoDataset } = useVoDatasets();
    
    // State (same pattern as subcontractor wizard)
    const [formData, setFormDataState] = useState<VOWizardFormData>(initialFormData);
    const [currentStep, setCurrentStep] = useState(1);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Enhanced form data setter that tracks changes
    const setFormData = (data: Partial<VOWizardFormData>) => {
        setFormDataState(prev => ({ ...prev, ...data }));
        setHasUnsavedChanges(true);
    };
    
    // Validation functions (simplified - only 4 steps instead of 7)
    const validateStep1 = (): boolean => {
        return formData.title.trim() !== '' && formData.description.trim() !== '';
    };
    
    const validateStep2 = (): boolean => {
        if (formData.level === 'Project') {
            return formData.projectId !== null;
        } else if (formData.level === 'Building') {
            return formData.projectId !== null && formData.buildingId !== null;
        } else { // Sheet
            return formData.projectId !== null && formData.buildingId !== null && formData.sheetName.trim() !== '';
        }
    };
    
    const validateStep3 = (): boolean => {
        return formData.voItems.length > 0 || formData.uploadFile !== undefined;
    };
    
    const validateStep4 = (): boolean => {
        return true; // Review step doesn't require validation
    };
    
    const validateCurrentStep = (): boolean => {
        switch (currentStep) {
            case 1: return validateStep1();
            case 2: return validateStep2();
            case 3: return validateStep3();
            case 4: return validateStep4();
            default: return false;
        }
    };
    
    // Navigation functions (same pattern as subcontractor wizard)
    const goToNextStep = () => {
        if (validateCurrentStep() && currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };
    
    const goToPreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    // Submission function (simplified)
    const handleSubmit = async () => {
        try {
            setLoading(true);
            
            if (formData.uploadFile) {
                // Handle file upload
                const uploadResult = await uploadVo({
                    excelFile: formData.uploadFile,
                    projectId: formData.projectId || 0,
                    buildingId: formData.buildingId || 0,
                    sheetId: 0, // Use default sheet ID
                    voLevel: formData.level === 'Project' ? 0 : formData.level === 'Building' ? 1 : 2,
                });
                
                if (!uploadResult.success) {
                    throw new Error("Failed to upload VO file");
                }
            }
            
            // Save VO data - VoVM expects array format  
            const voData: any = [{
                buildingId: formData.buildingId || 0,
                voLevel: formData.level === 'Project' ? 0 : formData.level === 'Building' ? 1 : 2,
                voSheets: formData.voItems || []
            }];
            const saveResult = await saveVo(voData);
            
            if (saveResult.isSuccess) {
                toaster.success("Variation Order created successfully!");
                setHasUnsavedChanges(false);
            } else {
                throw new Error("Failed to create VO");
            }
        } catch (error) {
            console.error("Error submitting VO:", error);
            toaster.error("Failed to create Variation Order");
        } finally {
            setLoading(false);
        }
    };
    
    // Context value
    const contextValue: VOWizardContextType = {
        // State
        formData,
        currentStep,
        hasUnsavedChanges,
        loading,
        
        // Actions
        setFormData,
        setCurrentStep,
        setHasUnsavedChanges,
        
        // Validation & Navigation
        validateCurrentStep,
        goToNextStep,
        goToPreviousStep,
        
        // Submission
        handleSubmit
    };
    
    return (
        <VOWizardContext.Provider value={contextValue}>
            {children}
        </VOWizardContext.Provider>
    );
};
