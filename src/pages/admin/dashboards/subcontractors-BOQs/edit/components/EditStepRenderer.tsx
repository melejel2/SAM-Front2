import React from "react";
import { useEditWizardContext } from "../context/EditWizardContext";
import { EditStep1_ProjectSelection } from "../steps/EditStep1_ProjectSelection";
import { EditStep2_SubcontractorSelection } from "../steps/EditStep2_SubcontractorSelection";
import { EditStep3_ContractDetails } from "../steps/EditStep3_ContractDetails";
import { EditStep4_BOQItems } from "../steps/EditStep4_BOQItems";
import { EditStep5_Review } from "../steps/EditStep5_Review";
import { EditStep6_Preview } from "../steps/EditStep6_Preview";

export const EditStepRenderer: React.FC = () => {
    const { currentStep } = useEditWizardContext();

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <EditStep1_ProjectSelection />;
            case 2:
                return <EditStep2_SubcontractorSelection />;
            case 3:
                return <EditStep3_ContractDetails />;
            case 4:
                return <EditStep4_BOQItems />;
            case 5:
                return <EditStep5_Review />;
            case 6:
                return <EditStep6_Preview />;
            default:
                return <div>Invalid step</div>;
        }
    };

    // Steps 3, 4, and 5 need the white container for their form content
    // Step 6 (Preview) needs special height handling for PDF viewer
    if (currentStep === 3 || currentStep === 4 || currentStep === 5) {
        return (
            <div className="card bg-base-100 shadow-sm p-4">
                {renderStepContent()}
            </div>
        );
    }

    // Step 6 gets white container with optimized height for PDF preview
    if (currentStep === 6) {
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