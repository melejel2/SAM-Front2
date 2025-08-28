import React from "react";
import { VOWizardSteps, VO_WIZARD_STEP_DEFINITIONS } from "./types";

interface VOWizardStepProps {
    step: VOWizardSteps;
    isValid: boolean;
    onValidationChange: (isValid: boolean) => void;
    children: React.ReactNode;
}

const VOWizardStep: React.FC<VOWizardStepProps> = ({
    step,
    isValid,
    onValidationChange,
    children
}) => {
    
    const stepDefinition = VO_WIZARD_STEP_DEFINITIONS.find(s => s.key === step);
    
    if (!stepDefinition) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-base-content mb-2">Unknown Step</h3>
                    <p className="text-base-content/70">The requested step could not be found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Step Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${
                        isValid 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : 'bg-primary/10'
                    }`}>
                        <span className={`iconify ${
                            isValid ? 'lucide--check-circle' : stepDefinition.icon
                        } size-6 ${
                            isValid 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-primary'
                        }`}></span>
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-base-content">
                                {stepDefinition.title}
                            </h1>
                            
                            {stepDefinition.isRequired && (
                                <span className="badge badge-error badge-sm">Required</span>
                            )}
                            
                            {!stepDefinition.isRequired && (
                                <span className="badge badge-info badge-sm">Optional</span>
                            )}
                        </div>
                        
                        <p className="text-base-content/70 mt-1">
                            {stepDefinition.description}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-base-content/60">
                            {isValid && (
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <span className="iconify lucide--check-circle size-4"></span>
                                    <span>Step completed</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Step progress indicator */}
                <div className="flex items-center gap-2">
                    {VO_WIZARD_STEP_DEFINITIONS.map((stepDef, index) => (
                        <React.Fragment key={stepDef.key}>
                            {/* Step indicator: circular with 2px borders and 32px diameter (w-8 h-8) */}
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                                stepDef.key === step
                                    ? 'bg-primary/10 border-primary/20 text-primary'
                                    : index < VO_WIZARD_STEP_DEFINITIONS.findIndex(s => s.key === step)
                                    ? 'bg-success/10 border-success/20 text-success'
                                    : 'bg-base-200 border-base-300 text-base-content/50'
                            }`}>
                                {stepDef.key === step ? (
                                    <span className="iconify lucide--edit size-4"></span>
                                ) : index < VO_WIZARD_STEP_DEFINITIONS.findIndex(s => s.key === step) ? (
                                    <span className="iconify lucide--check size-4"></span>
                                ) : (
                                    index + 1
                                )}
                            </div>
                            
                            {/* Flexible connector line */}
                            {index < VO_WIZARD_STEP_DEFINITIONS.length - 1 && (
                                <div className={`flex-1 h-1 rounded transition-colors duration-300 ${
                                    index < VO_WIZARD_STEP_DEFINITIONS.findIndex(s => s.key === step)
                                        ? 'bg-success/30'
                                        : 'bg-base-300'
                                }`}></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-base-100 rounded-lg border border-base-300 shadow-sm">
                <div className="p-6">
                    {children}
                </div>

                {/* Validation Status */}
                <div className={`px-6 py-3 border-t border-base-300 ${
                    isValid 
                        ? 'bg-green-50 dark:bg-green-900/20 border-t-green-200 dark:border-t-green-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-t-yellow-200 dark:border-t-yellow-800'
                }`}>
                    <div className="flex items-center gap-3">
                        <span className={`iconify ${
                            isValid 
                                ? 'lucide--check-circle text-green-600 dark:text-green-400' 
                                : 'lucide--alert-circle text-yellow-600 dark:text-yellow-400'
                        } size-5`}></span>
                        
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${
                                isValid 
                                    ? 'text-green-900 dark:text-green-100'
                                    : 'text-yellow-900 dark:text-yellow-100'
                            }`}>
                                {isValid 
                                    ? 'This step is complete and valid'
                                    : stepDefinition.isRequired 
                                    ? 'Please complete all required fields to continue'
                                    : 'You can skip this optional step or complete it now'
                                }
                            </p>
                            
                            {!isValid && stepDefinition.isRequired && (
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                    This step is required to proceed to the next step.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Step Instructions */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <span className="iconify lucide--lightbulb text-blue-600 dark:text-blue-400 size-5 mt-0.5"></span>
                    <div>
                        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Step Instructions
                        </h5>
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                            {getStepInstructions(step)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function to get step-specific instructions
const getStepInstructions = (step: VOWizardSteps) => {
    switch (step) {
        case VOWizardSteps.VOTypeSelection:
            return (
                <ul className="space-y-1">
                    <li>• Choose between Budget BOQ VO or Contract Dataset VO</li>
                    <li>• Budget BOQ VOs modify project-level BOQs using api/Vo/* endpoints</li>
                    <li>• Contract Dataset VOs are subcontractor-specific using api/VoDataSet/* endpoints</li>
                    <li>• Select the project or contract dataset you want to work with</li>
                    <li>• This choice determines the workflow for the remaining steps</li>
                </ul>
            );

        case VOWizardSteps.BuildingSelection:
            return (
                <ul className="space-y-1">
                    <li>• Choose between Project level (all buildings) or Building level (specific buildings)</li>
                    <li>• Select one or more buildings this VO applies to</li>
                    <li>• At least one building must be selected to proceed</li>
                    <li>• You can change the selection later if needed</li>
                </ul>
            );
        
        case VOWizardSteps.VODataEntry:
            return (
                <ul className="space-y-1">
                    <li>• Enter VO number (auto-generated or custom)</li>
                    <li>• Provide clear description of the variation</li>
                    <li>• Add line items with quantities and unit prices</li>
                    <li>• Attach supporting documents if needed</li>
                    <li>• Verify total calculations are accurate</li>
                </ul>
            );
            
        case VOWizardSteps.SaveConfirmation:
            return (
                <ul className="space-y-1">
                    <li>• Review all information for accuracy</li>
                    <li>• Choose document generation options</li>
                    <li>• Add any final comments</li>
                    <li>• Confirm to enable the save button</li>
                    <li>• Click Create/Update to complete the process</li>
                </ul>
            );
            
        default:
            return <p>Complete this step and proceed to the next one.</p>;
    }
};

export default VOWizardStep;