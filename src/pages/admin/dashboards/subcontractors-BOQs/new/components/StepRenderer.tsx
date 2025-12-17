import React from "react";
import { useWizardContext } from "../context/WizardContext";
import { Step1_ProjectSelection } from "../steps/Step1_ProjectSelection";
import { Step2_SubcontractorSelection } from "../steps/Step2_SubcontractorSelection";
import { Step3_ContractDetails } from "../steps/Step3_ContractDetails";
import { Step4_BOQItems } from "../steps/Step4_BOQItems";
import { Step5_Preview } from "../steps/Step5_Preview";

export const StepRenderer: React.FC = () => {
    const { currentStep } = useWizardContext();

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <Step1_ProjectSelection />;
            case 2:
                return <Step2_SubcontractorSelection />;
            case 3:
                return <Step3_ContractDetails />;
            case 4:
                return <Step4_BOQItems />;
            case 5:
                return <Step5_Preview />;
            default:
                return <Step1_ProjectSelection />;
        }
    };

    // Steps 3 and 4 need the white container for their form content
    // Step 5 (Preview) needs special height handling for PDF viewer
    if (currentStep === 3 || currentStep === 4) {
        return (
            <div className="card bg-base-100 shadow-sm p-4">
                {renderStepContent()}
            </div>
        );
    }

    // Step 5 gets white container with optimized height for PDF preview
    if (currentStep === 5) {
        return (
            <div className="card bg-base-100 shadow-sm p-4 h-[calc(100vh-180px)] flex flex-col">
                <div className="flex-1 min-h-0">
                    {renderStepContent()}
                </div>
            </div>
        );
    }

    return renderStepContent();
};