import { VOType, VOTypeSelectionData } from '@/types/variation-order';

// VO Wizard Steps Enumeration - Now includes VO Type Selection
export enum VOWizardSteps {
    VOTypeSelection = 'voTypeSelection',
    BuildingSelection = 'buildingSelection',
    VODataEntry = 'voDataEntry', 
    SaveConfirmation = 'saveConfirmation'
}

// Step Information for UI Display
export interface VOWizardStepInfo {
    key: VOWizardSteps;
    title: string;
    description: string;
    icon: string;
    isRequired: boolean;
}

// Complete step definitions - Now includes VO Type Selection
export const VO_WIZARD_STEP_DEFINITIONS: VOWizardStepInfo[] = [
    {
        key: VOWizardSteps.VOTypeSelection,
        title: 'Select VO Type',
        description: 'Choose Budget BOQ or Contract Dataset VO',
        icon: 'lucide--split',
        isRequired: true
    },
    {
        key: VOWizardSteps.BuildingSelection,
        title: 'Select Buildings',
        description: 'Choose buildings for this VO',
        icon: 'lucide--building-2',
        isRequired: true
    },
    {
        key: VOWizardSteps.VODataEntry,
        title: 'VO Data & Items',
        description: 'Enter VO details and BOQ line items',
        icon: 'lucide--edit',
        isRequired: true
    },
    {
        key: VOWizardSteps.SaveConfirmation,
        title: 'Save & Generate',
        description: 'Confirm and save the VO',
        icon: 'lucide--check-circle',
        isRequired: true
    }
];

// Individual step data interfaces - Now includes VO Type Selection
export interface VOTypeSelectionStepData extends VOTypeSelectionData {}

export interface BuildingSelectionStepData {
    selectedBuildings: number[];
    buildingNames: string[];
    level: 'Project' | 'Building';
}

export interface VODataEntryStepData {
    // Basic VO info
    voNumber: string;
    description: string;
    type: 'Addition' | 'Deduction';
    date: string;
    
    // BOQ Items (reuse existing line items structure)
    items: any[];
    totalAmount: number;
    currency: string;
    
    // Optional attachments
    attachments?: File[];
}

export interface SaveConfirmationStepData {
    confirmed: boolean;
    generateDocument: boolean;
    documentFormat: 'word' | 'pdf' | 'both';
    finalComments?: string;
}

// Combined step data interface - Now includes VO Type Selection
export interface WizardStepData {
    [VOWizardSteps.VOTypeSelection]?: VOTypeSelectionStepData;
    [VOWizardSteps.BuildingSelection]?: BuildingSelectionStepData;
    [VOWizardSteps.VODataEntry]?: VODataEntryStepData;
    [VOWizardSteps.SaveConfirmation]?: SaveConfirmationStepData;
}

// Overall wizard state
export interface VOWizardState {
    currentStep: VOWizardSteps;
    completedSteps: Set<VOWizardSteps>;
    stepData: WizardStepData;
    isValidStep: boolean;
    isSubmitting: boolean;
    errors?: Record<VOWizardSteps, string[]>;
}

// Step component props
export interface WizardStepProps {
    data: WizardStepData;
    onDataChange: (stepData: any) => void;
    onValidationChange: (isValid: boolean) => void;
    mode: 'create' | 'edit';
    voDataset?: any;
}

// Navigation event types
export interface WizardNavigationEvents {
    onNext: () => void;
    onBack: () => void;
    onStepClick: (step: VOWizardSteps) => void;
    onCancel: () => void;
    onSubmit: () => void;
}

// Validation result
export interface StepValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}

// Progress information
export interface WizardProgress {
    totalSteps: number;
    completedSteps: number;
    currentStep: number;
    percentage: number;
    estimatedTimeRemaining: string;
}

export default VOWizardSteps;