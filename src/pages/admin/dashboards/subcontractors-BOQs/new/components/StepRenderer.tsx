import React from "react";
import { useWizardContext } from "../context/WizardContext";
import { Step1_ProjectSelection } from "../steps/Step1_ProjectSelection";
import { Step2_TradeSelection } from "../steps/Step2_TradeSelection";
import { Step3_BuildingSelection } from "../steps/Step3_BuildingSelection";
import { Step4_SubcontractorSelection } from "../steps/Step4_SubcontractorSelection";
import { Step5_ContractDetails } from "../steps/Step5_ContractDetails";
import { Step6_BOQItems } from "../steps/Step6_BOQItems";
import { Step7_Review } from "../steps/Step7_Review";
import { Step8_Preview } from "../steps/Step8_Preview";

export const StepRenderer: React.FC = () => {
    const { currentStep } = useWizardContext();

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <Step1_ProjectSelection />;
            case 2:
                return <Step2_TradeSelection />;
            case 3:
                return <Step3_BuildingSelection />;
            case 4:
                return <Step4_SubcontractorSelection />;
            case 5:
                return <Step5_ContractDetails />;
            case 6:
                return <Step6_BOQItems />;
            case 7:
                return <Step7_Review />;
            case 8:
                return <Step8_Preview />;
            default:
                return <div>Invalid step</div>;
        }
    };

    // Steps 5, 6, 7, and 8 need the white container for their form content
    // Step 8 (Preview) needs special height handling for PDF viewer
    if (currentStep === 5 || currentStep === 6 || currentStep === 7) {
        return (
            <div className="card bg-base-100 shadow-sm p-4">
                {renderStepContent()}
            </div>
        );
    }

    // Step 8 gets white container with optimized height for PDF preview
    if (currentStep === 8) {
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