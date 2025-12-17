import React from "react";
import { useIPCWizardContext } from "../context/IPCWizardContext";
import { Step1_ContractAndType } from "../steps/Step1_ContractAndType";
import { Step2_PeriodBuildingAndBOQ } from "../steps/Step2_PeriodBuildingAndBOQ";
import { Step3_Deductions } from "../steps/Step3_Deductions";
import { Step4_PreviewAndSave } from "../steps/Step4_PreviewAndSave";
import { IPCErrorBoundary } from "./IPCErrorBoundary";

const getStepName = (step: number): string => {
    switch (step) {
        case 1: return "Contract Selection";
        case 2: return "Period & BOQ Progress";
        case 3: return "Deductions";
        case 4: return "Preview & Save";
        default: return "Unknown Step";
    }
};

export const IPCStepRenderer: React.FC = () => {
    const { currentStep } = useIPCWizardContext();

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <IPCErrorBoundary stepName={getStepName(1)}>
                        <Step1_ContractAndType />
                    </IPCErrorBoundary>
                );
            case 2:
                return (
                    <IPCErrorBoundary stepName={getStepName(2)}>
                        <Step2_PeriodBuildingAndBOQ />
                    </IPCErrorBoundary>
                );
            case 3:
                return (
                    <IPCErrorBoundary stepName={getStepName(3)}>
                        <Step3_Deductions />
                    </IPCErrorBoundary>
                );
            case 4:
                return (
                    <IPCErrorBoundary stepName={getStepName(4)}>
                        <Step4_PreviewAndSave />
                    </IPCErrorBoundary>
                );
            default:
                return (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-semibold text-base-content mb-2">Unknown Step</h3>
                        <p className="text-base-content/70">Step {currentStep} is not recognized.</p>
                    </div>
                );
        }
    };
    
    return (
        <div className="bg-base-100 rounded-lg p-6 shadow-sm border border-base-300">
            {renderStep()}
        </div>
    );
};
