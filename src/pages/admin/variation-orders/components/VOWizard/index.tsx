import { useState, useEffect } from "react";
import { Button } from "@/components/daisyui";
import { Loader } from "@/components/Loader";
import useToast from "@/hooks/use-toast";
import VOWizardStep from "./VOWizardStep";
import VOWizardNavigation from "./VOWizardNavigation";
import VOWizardSummary from "./VOWizardSummary";
import { VOWizardSteps, WizardStepData, VOWizardState } from "./types";
import { VOType } from '@/types/variation-order';
import { createVoDataset, saveVoDataset } from '@/api/services/vo-api';
import { saveBudgetVo, uploadBudgetVo } from '@/api/services/budget-vo-api';
import { useAuth } from '@/contexts/auth';

// Import step components - Now includes VO Type Selection
import VOTypeSelectionStep from "./steps/VOTypeSelectionStep";
import BuildingSelectionStep from "./steps/BuildingSelectionStep";
import VODataEntryStep from "./steps/LineItemsStep"; // Renamed to VODataEntryStep
import SaveConfirmationStep from "./steps/ReviewSubmitStep"; // Renamed to SaveConfirmationStep

interface VOWizardProps {
    voDatasetId?: number;
    voDataset?: any;
    onComplete?: (result: any) => void;
    onCancel?: () => void;
    showControls?: boolean;
    mode?: 'create' | 'edit';
}

const VOWizard: React.FC<VOWizardProps> = ({
    voDatasetId,
    voDataset,
    onComplete,
    onCancel,
    showControls = true,
    mode = 'create'
}) => {
    const [wizardState, setWizardState] = useState<VOWizardState>({
        currentStep: VOWizardSteps.VOTypeSelection,
        completedSteps: new Set(),
        stepData: {},
        isValidStep: false,
        isSubmitting: false
    });

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { toaster } = useToast();
    const { user } = useAuth();

    // Initialize wizard data from existing VO dataset if in edit mode
    useEffect(() => {
        if (mode === 'edit' && voDataset) {
            initializeFromExistingData();
        }
    }, [mode, voDataset]);

    const initializeFromExistingData = () => {
        const initialData: WizardStepData = {
            // Step 1: VO Type Selection
            voTypeSelection: {
                voType: 'contract-dataset', // Default assumption for existing VOs
                selectedFor: {
                    contractDatasetId: voDataset.contractsDatasetId || 1,
                    contractNumber: voDataset.contractNumber || '',
                    subcontractorId: voDataset.subcontractorId || 0,
                    subcontractorName: voDataset.subcontractorName || ''
                }
            },

            // Step 2: Building Selection
            buildingSelection: {
                selectedBuildings: voDataset.buildingId ? [voDataset.buildingId] : [],
                buildingNames: voDataset.buildingName ? [voDataset.buildingName] : [],
                level: voDataset.buildingId ? 'Building' : 'Project'
            },

            // Step 3: VO Data Entry (combines basic info + line items + attachments)
            voDataEntry: {
                voNumber: voDataset.voNumber || '',
                description: voDataset.description || voDataset.remark || '',
                type: voDataset.type || 'Addition',
                date: voDataset.date || new Date().toISOString().split('T')[0],
                items: voDataset.buildings?.flatMap((b: any) => b.contractVoes || []) || [],
                totalAmount: voDataset.amount || 0,
                currency: 'USD',
                attachments: []
            },

            // Step 4: Save Confirmation
            saveConfirmation: {
                confirmed: false,
                generateDocument: true,
                documentFormat: 'both',
                finalComments: ''
            }
        };

        setWizardState(prev => ({
            ...prev,
            stepData: initialData,
            // Mark some steps as completed if we have the data
            completedSteps: new Set([
                VOWizardSteps.VOTypeSelection,
                VOWizardSteps.BuildingSelection,
                VOWizardSteps.VODataEntry
            ])
        }));
    };

    const getStepComponent = (step: VOWizardSteps) => {
        const stepProps = {
            data: wizardState.stepData,
            onDataChange: (stepData: any) => updateStepData(step, stepData),
            onValidationChange: (isValid: boolean) => setStepValidation(isValid),
            mode,
            voDataset
        };

        switch (step) {
            case VOWizardSteps.VOTypeSelection:
                return <VOTypeSelectionStep {...stepProps} />;
            case VOWizardSteps.BuildingSelection:
                return <BuildingSelectionStep {...stepProps} />;
            case VOWizardSteps.VODataEntry:
                return <VODataEntryStep {...stepProps} />;
            case VOWizardSteps.SaveConfirmation:
                return <SaveConfirmationStep {...stepProps} />;
            default:
                return <div>Unknown step</div>;
        }
    };

    const updateStepData = (step: VOWizardSteps, data: any) => {
        setWizardState(prev => ({
            ...prev,
            stepData: {
                ...prev.stepData,
                [step]: data
            }
        }));
    };

    const setStepValidation = (isValid: boolean) => {
        setWizardState(prev => ({
            ...prev,
            isValidStep: isValid
        }));
    };

    const handleNext = () => {
        if (wizardState.isValidStep) {
            // Mark current step as completed
            const newCompletedSteps = new Set(wizardState.completedSteps);
            newCompletedSteps.add(wizardState.currentStep);

            // Move to next step
            const nextStep = getNextStep(wizardState.currentStep);
            if (nextStep) {
                setWizardState(prev => ({
                    ...prev,
                    currentStep: nextStep,
                    completedSteps: newCompletedSteps,
                    isValidStep: false // Reset validation for next step
                }));
            }
        } else {
            toaster.error("Please complete all required fields before continuing");
        }
    };

    const handleBack = () => {
        const prevStep = getPreviousStep(wizardState.currentStep);
        if (prevStep) {
            setWizardState(prev => ({
                ...prev,
                currentStep: prevStep,
                isValidStep: true // Previous steps should be valid
            }));
        }
    };

    const handleStepClick = (step: VOWizardSteps) => {
        // Only allow navigation to completed steps or current step
        if (wizardState.completedSteps.has(step) || isStepAccessible(step)) {
            setWizardState(prev => ({
                ...prev,
                currentStep: step,
                isValidStep: wizardState.completedSteps.has(step)
            }));
        }
    };

    const handleSubmit = async () => {
        if (!wizardState.isValidStep) {
            toaster.error("Please review and complete all steps before submitting");
            return;
        }

        setWizardState(prev => ({ ...prev, isSubmitting: true }));

        try {
            // Compile all wizard data for submission
            const voData = compileWizardData();
            const voType = wizardState.stepData.voTypeSelection?.voType;
            
            if (!user?.token) {
                throw new Error('Authentication token is required');
            }

            let result;
            
            // Route to appropriate API based on VO type
            if (voType === VOType.BudgetBOQ) {
                // Use Budget BOQ VO API (api/Vo/*)
                if (mode === 'create') {
                    result = await createBudgetVO(voData, user.token);
                } else {
                    result = await updateBudgetVO(voDatasetId!, voData, user.token);
                }
            } else if (voType === VOType.ContractDataset) {
                // Use Contract Dataset VO API (api/VoDataSet/*)
                if (mode === 'create') {
                    result = await createContractDatasetVO(voData, user.token);
                } else {
                    result = await updateContractDatasetVO(voDatasetId!, voData, user.token);
                }
            } else {
                throw new Error('VO type must be selected before submitting');
            }

            if (result.success || result.isSuccess) {
                toaster.success(`${voType === VOType.BudgetBOQ ? 'Budget BOQ' : 'Contract Dataset'} VO ${mode === 'create' ? 'created' : 'updated'} successfully`);
                if (onComplete) {
                    onComplete(result.data);
                }
            } else {
                throw new Error(result.error?.message || result.error || `Failed to ${mode} VO`);
            }
        } catch (error) {
            console.error(`VO ${mode} error:`, error);
            toaster.error(`Failed to ${mode} VO: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setWizardState(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    const compileWizardData = () => {
        // Transform wizard step data into API-compatible format
        const { stepData } = wizardState;
        
        return {
            // VO Type selection from step 1
            voType: stepData.voTypeSelection?.voType,
            selectedFor: stepData.voTypeSelection?.selectedFor,
            
            // Building selection from step 2
            selectedBuildings: stepData.buildingSelection?.selectedBuildings || [],
            level: stepData.buildingSelection?.level,
            
            // VO data from step 3
            voNumber: stepData.voDataEntry?.voNumber,
            description: stepData.voDataEntry?.description,
            type: stepData.voDataEntry?.type,
            date: stepData.voDataEntry?.date,
            currency: stepData.voDataEntry?.currency,
            items: stepData.voDataEntry?.items || [],
            amount: stepData.voDataEntry?.totalAmount || 0,
            attachments: stepData.voDataEntry?.attachments || [],
            
            // Save confirmation from step 4
            generateDocuments: stepData.saveConfirmation?.generateDocument,
            documentFormat: stepData.saveConfirmation?.documentFormat,
            finalComments: stepData.saveConfirmation?.finalComments
        };
    };

    // Budget BOQ VO API functions
    const createBudgetVO = async (data: any, token: string) => {
        const budgetVOData = [{
            buildingId: data.selectedBuildings[0] || 1,
            voLevel: 1, // Default level
            voSheets: data.items?.map((item: any) => ({
                id: item.boqSheetId || 1,
                sheetName: item.sheetName || 'VO Items',
                voItems: [{
                    id: 0, // New item
                    level: 1,
                    orderVo: item.orderVo || 1,
                    no: item.no || '1',
                    key: item.key || data.description,
                    unite: item.unite || 'LS',
                    qte: item.qte || 1,
                    pu: item.pu || data.amount,
                    costCode: item.costCode,
                    costCodeId: item.costCodeId
                }]
            })) || []
        }];
        
        return await saveBudgetVo(budgetVOData, token);
    };

    const updateBudgetVO = async (id: number, data: any, token: string) => {
        // Similar to create but with existing ID
        const budgetVOData = [{
            buildingId: data.selectedBuildings[0] || 1,
            voLevel: 1,
            voSheets: data.items?.map((item: any) => ({
                id: item.boqSheetId || 1,
                sheetName: item.sheetName || 'VO Items',
                voItems: [{
                    id: item.id || 0,
                    level: 1,
                    orderVo: item.orderVo || 1,
                    no: item.no || '1',
                    key: item.key || data.description,
                    unite: item.unite || 'LS',
                    qte: item.qte || 1,
                    pu: item.pu || data.amount,
                    costCode: item.costCode,
                    costCodeId: item.costCodeId
                }]
            })) || []
        }];
        
        return await saveBudgetVo(budgetVOData, token);
    };

    // Contract Dataset VO API functions
    const createContractDatasetVO = async (data: any, token: string) => {
        const contractVOData = {
            voNumber: data.voNumber,
            description: data.description,
            reason: data.finalComments,
            amount: data.amount,
            type: data.type,
            contractDatasetId: data.selectedFor?.contractDatasetId || 1,
            subcontractorId: data.selectedFor?.subcontractorId || 1,
            projectId: data.selectedFor?.projectId || 1,
            buildingId: data.selectedBuildings[0] || 1,
            date: data.date
        };

        return await createVoDataset(contractVOData, token);
    };

    const updateContractDatasetVO = async (id: number, data: any, token: string) => {
        const contractVOData = {
            voNumber: data.voNumber,
            description: data.description,
            reason: data.finalComments,
            amount: data.amount,
            type: data.type,
            contractDatasetId: data.selectedFor?.contractDatasetId || 1,
            subcontractorId: data.selectedFor?.subcontractorId || 1,
            projectId: data.selectedFor?.projectId || 1,
            buildingId: data.selectedBuildings[0] || 1,
            date: data.date
        };

        return await saveVoDataset(contractVOData, token);
    };

    const getNextStep = (current: VOWizardSteps): VOWizardSteps | null => {
        const steps = Object.values(VOWizardSteps);
        const currentIndex = steps.indexOf(current);
        return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
    };

    const getPreviousStep = (current: VOWizardSteps): VOWizardSteps | null => {
        const steps = Object.values(VOWizardSteps);
        const currentIndex = steps.indexOf(current);
        return currentIndex > 0 ? steps[currentIndex - 1] : null;
    };

    const isStepAccessible = (step: VOWizardSteps): boolean => {
        // Logic to determine if a step is accessible
        const steps = Object.values(VOWizardSteps);
        const stepIndex = steps.indexOf(step);
        const currentIndex = steps.indexOf(wizardState.currentStep);
        
        // Can access current step and one step forward if current is completed
        return stepIndex <= currentIndex + (wizardState.isValidStep ? 1 : 0);
    };

    const getStepProgress = () => {
        const totalSteps = Object.keys(VOWizardSteps).length;
        const completedCount = wizardState.completedSteps.size;
        const currentStepIndex = Object.values(VOWizardSteps).indexOf(wizardState.currentStep) + 1;
        
        return {
            totalSteps,
            completedSteps: completedCount,
            currentStep: currentStepIndex,
            percentage: Math.round((completedCount / totalSteps) * 100)
        };
    };

    const progress = getStepProgress();
    const isLastStep = wizardState.currentStep === VOWizardSteps.SaveConfirmation;
    const isFirstStep = wizardState.currentStep === VOWizardSteps.VOTypeSelection;

    return (
        <div className="flex flex-col lg:flex-row bg-base-100 min-h-screen">
            {/* Sidebar Navigation */}
            <div className={`bg-base-200 border-r border-base-300 transition-all duration-300 ${
                sidebarCollapsed ? 'lg:w-16' : 'lg:w-80'
            } w-full lg:h-screen`}>
                
                {/* Sidebar Header */}
                {showControls && (
                    <div className="flex items-center justify-between p-4 border-b border-base-300">
                        <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <span className="iconify lucide--clipboard-list text-primary size-5"></span>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-base-content">VO Wizard</h2>
                                <p className="text-sm text-base-content/70">
                                    {mode === 'create' ? 'Create' : 'Edit'} Variation Order
                                </p>
                            </div>
                        </div>
                        
                        <Button
                            type="button"
                            size="sm"
                            className="bg-base-300 text-base-content hover:bg-base-400 hidden lg:flex"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        >
                            <span className={`iconify ${sidebarCollapsed ? 'lucide--chevron-right' : 'lucide--chevron-left'} size-4`}></span>
                        </Button>
                    </div>
                )}

                {/* Progress Bar */}
                <div className={`p-4 ${sidebarCollapsed ? 'lg:p-2' : ''}`}>
                    <div className={`${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-base-content">Progress</span>
                            <span className="text-sm text-base-content/70">{progress.percentage}%</span>
                        </div>
                        <div className="w-full bg-base-300 rounded-full h-2">
                            <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress.percentage}%` }}
                            ></div>
                        </div>
                        <div className="text-xs text-base-content/70 mt-1">
                            Step {progress.currentStep} of {progress.totalSteps}
                        </div>
                    </div>
                    
                    {/* Collapsed progress indicator */}
                    <div className={`hidden lg:block ${sidebarCollapsed ? '' : 'lg:hidden'}`}>
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                                {progress.currentStep}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation Steps */}
                <div className={`flex-1 ${sidebarCollapsed ? 'lg:px-2' : 'px-4'} pb-4`}>
                    <VOWizardNavigation
                        currentStep={wizardState.currentStep}
                        completedSteps={wizardState.completedSteps}
                        onStepClick={handleStepClick}
                        collapsed={sidebarCollapsed}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Step Content */}
                <div className="flex-1 p-6">
                    <VOWizardStep
                        step={wizardState.currentStep}
                        isValid={wizardState.isValidStep}
                        onValidationChange={setStepValidation}
                    >
                        {getStepComponent(wizardState.currentStep)}
                    </VOWizardStep>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center justify-between p-6 border-t border-base-300 bg-base-100">
                    <div className="flex items-center gap-3">
                        {!isFirstStep && (
                            <Button
                                type="button"
                                className="bg-base-200 text-base-content hover:bg-base-300"
                                onClick={handleBack}
                                disabled={wizardState.isSubmitting}
                            >
                                <span className="iconify lucide--chevron-left size-4"></span>
                                Back
                            </Button>
                        )}
                        
                        {onCancel && (
                            <Button
                                type="button"
                                className="bg-base-200 text-base-content hover:bg-base-300"
                                onClick={onCancel}
                                disabled={wizardState.isSubmitting}
                            >
                                <span className="iconify lucide--x size-4"></span>
                                Cancel
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {!isLastStep ? (
                            <Button
                                type="button"
                                className="btn-primary"
                                onClick={handleNext}
                                disabled={!wizardState.isValidStep || wizardState.isSubmitting}
                            >
                                Next
                                <span className="iconify lucide--chevron-right size-4"></span>
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                className="btn-success"
                                onClick={handleSubmit}
                                disabled={!wizardState.isValidStep || wizardState.isSubmitting}
                            >
                                {wizardState.isSubmitting ? (
                                    <>
                                        <Loader />
                                        {mode === 'create' ? 'Creating...' : 'Updating...'}
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--check size-4"></span>
                                        {mode === 'create' ? 'Create VO' : 'Update VO'}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Panel (Optional) */}
            <VOWizardSummary
                stepData={wizardState.stepData}
                isVisible={isLastStep}
                mode={mode}
            />
        </div>
    );
};

export default VOWizard;