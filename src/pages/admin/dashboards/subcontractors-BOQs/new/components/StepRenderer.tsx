import React from "react";
import { useWizardContext } from "../context/WizardContext";
import { Step1_ProjectSelection } from "../steps/Step1_ProjectSelection";
import { Step2_BuildingSelection } from "../steps/Step2_BuildingSelection";
import { Step3_SubcontractorSelection } from "../steps/Step3_SubcontractorSelection";
import { Step4_ContractDetails } from "../steps/Step4_ContractDetails";
import { Step5_BOQItems } from "../steps/Step5_BOQItems";
import { Step6_Review } from "../steps/Step6_Review";
import { Step7_Preview } from "../steps/Step7_Preview";

export const StepRenderer: React.FC = () => {
    const { currentStep } = useWizardContext();

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <Step1_ProjectSelection />;
            case 2:
                return <Step2_BuildingSelection />;
            case 3:
                return <Step3_SubcontractorSelection />;
            case 4:
                return <Step4_ContractDetails />;
            case 5:
                return <Step5_BOQItems />;
            case 6:
                return <Step6_Review />;
            case 7:
                return <Step7_Preview />;
            default:
                return <div>Invalid step</div>;
        }
    };

    // Steps 4, 5, 6, and 7 need the white container for their form content
    // Step 7 (Preview) needs special height handling for PDF viewer
    if (currentStep === 4 || currentStep === 5 || currentStep === 6) {
        return (
            <div className="card bg-base-100 shadow-sm p-4">
                {renderStepContent()}
            </div>
        );
    }

    // Step 7 gets white container with optimized height for PDF preview
    if (currentStep === 7) {
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