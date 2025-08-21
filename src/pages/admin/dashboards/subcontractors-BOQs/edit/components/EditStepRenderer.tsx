import React from "react";
import { useEditWizardContext } from "../context/EditWizardContext";
import { EditStep1_ProjectSelection } from "../steps/EditStep1_ProjectSelection";
import { EditStep2_BuildingSelection } from "../steps/EditStep2_BuildingSelection";
import { EditStep3_SubcontractorSelection } from "../steps/EditStep3_SubcontractorSelection";
import { EditStep4_ContractDetails } from "../steps/EditStep4_ContractDetails";
import { EditStep5_BOQItems } from "../steps/EditStep5_BOQItems";
import { EditStep6_Review } from "../steps/EditStep6_Review";
import { EditStep7_Preview } from "../steps/EditStep7_Preview";

export const EditStepRenderer: React.FC = () => {
    const { currentStep } = useEditWizardContext();

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <EditStep1_ProjectSelection />;
            case 2:
                return <EditStep2_BuildingSelection />;
            case 3:
                return <EditStep3_SubcontractorSelection />;
            case 4:
                return <EditStep4_ContractDetails />;
            case 5:
                return <EditStep5_BOQItems />;
            case 6:
                return <EditStep6_Review />;
            case 7:
                return <EditStep7_Preview />;
            default:
                return <div>Invalid step</div>;
        }
    };

    // Steps 4, 5, 6, and 7 need the white container for their form content
    if (currentStep === 4 || currentStep === 5 || currentStep === 6 || currentStep === 7) {
        return (
            <div className="card bg-base-100 shadow-sm p-4">
                {renderStepContent()}
            </div>
        );
    }

    return renderStepContent();
};