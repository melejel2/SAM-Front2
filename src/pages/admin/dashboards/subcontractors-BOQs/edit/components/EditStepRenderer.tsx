import React from "react";
import { useEditWizardContext } from "../context/EditWizardContext";
import { EditStep1_ProjectSelection } from "../steps/EditStep1_ProjectSelection";
import { EditStep2_TradeSelection } from "../steps/EditStep2_TradeSelection";
import { EditStep3_BuildingSelection } from "../steps/EditStep3_BuildingSelection";
import { EditStep4_SubcontractorSelection } from "../steps/EditStep4_SubcontractorSelection";
import { EditStep5_ContractDetails } from "../steps/EditStep5_ContractDetails";
import { EditStep6_BOQItems } from "../steps/EditStep6_BOQItems";
import { EditStep7_Review } from "../steps/EditStep7_Review";
import { EditStep8_Preview } from "../steps/EditStep8_Preview";

export const EditStepRenderer: React.FC = () => {
    const { currentStep } = useEditWizardContext();

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <EditStep1_ProjectSelection />;
            case 2:
                return <EditStep2_TradeSelection />;
            case 3:
                return <EditStep3_BuildingSelection />;
            case 4:
                return <EditStep4_SubcontractorSelection />;
            case 5:
                return <EditStep5_ContractDetails />;
            case 6:
                return <EditStep6_BOQItems />;
            case 7:
                return <EditStep7_Review />;
            case 8:
                return <EditStep8_Preview />;
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