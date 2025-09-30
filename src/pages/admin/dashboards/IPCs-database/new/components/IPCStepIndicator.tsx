import React from "react";
import { useIPCWizardContext } from "../context/IPCWizardContext";

interface IPCStepIndicatorProps {
    currentStep: number;
}

interface StepConfig {
    id: number;
    title: string;
    icon: string;
    description: string;
}

const steps: StepConfig[] = [
    {
        id: 1,
        title: "Contract & IPC Type",
        icon: "lucide--file-text",
        description: "Select contract and IPC configuration"
    },
    {
        id: 2,
        title: "Period, Building & BOQ",
        icon: "lucide--calendar-days",
        description: "Work period, building selection and BOQ progress"
    },
    {
        id: 3,
        title: "Deductions",
        icon: "lucide--minus-circle",
        description: "Labor, machine, and material deductions"
    },
    {
        id: 4,
        title: "Preview & Save",
        icon: "lucide--check",
        description: "Review and create IPC"
    }
];

export const IPCStepIndicator: React.FC<IPCStepIndicatorProps> = ({ currentStep }) => {
    const { validateCurrentStep, formData } = useIPCWizardContext();
    
    const getStepStatus = (stepId: number) => {
        if (stepId < currentStep) {
            return 'completed';
        } else if (stepId === currentStep) {
            return validateCurrentStep() ? 'current-valid' : 'current-invalid';
        } else {
            return 'upcoming';
        }
    };
    
    const getStepClasses = (stepId: number) => {
        const status = getStepStatus(stepId);
        const baseClasses = "flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-200";
        
        switch (status) {
            case 'completed':
                return `${baseClasses} bg-green-600 text-white`;
            case 'current-valid':
                return `${baseClasses} bg-blue-600 text-white ring-4 ring-blue-200`;
            case 'current-invalid':
                return `${baseClasses} bg-yellow-500 text-white ring-4 ring-yellow-200`;
            default:
                return `${baseClasses} bg-base-300 text-base-content/60`;
        }
    };
    
    const getConnectorClasses = (stepId: number) => {
        const isCompleted = stepId < currentStep;
        return `flex-1 h-0.5 transition-colors duration-200 ${
            isCompleted ? 'bg-green-600' : 'bg-base-300'
        }`;
    };
    
    const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
    
    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-2">
                <div className="flex justify-between text-xs text-base-content/60 mb-1">
                    <span>IPC Creation Progress</span>
                    <span>{Math.round(progress)}% Complete</span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-1.5">
                    <div 
                        className="bg-gradient-to-r from-blue-600 to-green-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
            
            {/* Desktop View */}
            <div className="hidden lg:block">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center">
                                {/* Step Circle */}
                                <div className={getStepClasses(step.id)}>
                                    {getStepStatus(step.id) === 'completed' ? (
                                        <span className="iconify lucide--check size-5"></span>
                                    ) : (
                                        <span className={`iconify ${step.icon} size-5`}></span>
                                    )}
                                </div>
                                
                                {/* Step Info */}
                                <div className="mt-2 text-center">
                                    <div className={`text-sm font-medium ${
                                        step.id === currentStep 
                                            ? 'text-blue-600 font-semibold' 
                                            : step.id < currentStep 
                                                ? 'text-green-600' 
                                                : 'text-base-content/60'
                                    }`}>
                                        {step.title}
                                    </div>
                                    <div className="text-xs text-base-content/50 mt-1">
                                        {step.description}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className={getConnectorClasses(step.id)}></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            
            {/* Mobile View */}
            <div className="lg:hidden">
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center min-w-[80px]">
                                {/* Step Circle */}
                                <div className={getStepClasses(step.id)}>
                                    {getStepStatus(step.id) === 'completed' ? (
                                        <span className="iconify lucide--check size-4"></span>
                                    ) : (
                                        <span className={`iconify ${step.icon} size-4`}></span>
                                    )}
                                </div>
                                
                                {/* Step Number & Title */}
                                <div className="mt-1 text-center">
                                    <div className="text-xs font-medium text-base-content/80">
                                        {step.id}
                                    </div>
                                    <div className={`text-xs ${
                                        step.id === currentStep 
                                            ? 'text-blue-600 font-medium' 
                                            : step.id < currentStep 
                                                ? 'text-green-600' 
                                                : 'text-base-content/50'
                                    }`}>
                                        {step.title.split(' ')[0]}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Mobile Connector */}
                            {index < steps.length - 1 && (
                                <div className={`w-8 h-0.5 transition-colors duration-200 ${
                                    step.id < currentStep ? 'bg-green-600' : 'bg-base-300'
                                }`}></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            
            {/* Current Step Summary */}
            <div className="mt-4 p-3 bg-base-200 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                        <span className={`iconify ${steps[currentStep - 1]?.icon} text-blue-600 dark:text-blue-400 size-5`}></span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-base-content">
                            Step {currentStep}: {steps[currentStep - 1]?.title}
                        </h3>
                        <p className="text-sm text-base-content/70">
                            {steps[currentStep - 1]?.description}
                        </p>
                    </div>
                    
                    {/* Validation Status */}
                    <div className="ml-auto">
                        {getStepStatus(currentStep) === 'current-valid' ? (
                            <div className="flex items-center gap-1 text-green-600">
                                <span className="iconify lucide--check-circle size-4"></span>
                                <span className="text-xs font-medium">Valid</span>
                            </div>
                        ) : getStepStatus(currentStep) === 'current-invalid' ? (
                            <div className="flex items-center gap-1 text-yellow-600">
                                <span className="iconify lucide--alert-circle size-4"></span>
                                <span className="text-xs font-medium">Incomplete</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};
