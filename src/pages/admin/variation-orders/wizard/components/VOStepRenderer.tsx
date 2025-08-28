import React from "react";
import { useVOWizardContext } from "../context/VOWizardContext";
import { VOStep1_BasicInfo } from "../steps/VOStep1_BasicInfo";
import { VOStep2_ProjectSelection } from "../steps/VOStep2_ProjectSelection";
import { VOStep3_VOData } from "../steps/VOStep3_VOData";
import { VOStep3_MultiBuildingGeneration } from "../steps/VOStep3_MultiBuildingGeneration";
import { VOStep4_Review } from "../steps/VOStep4_Review";

// Step renderer component (enhanced for Multi-Building support)
export const VOStepRenderer: React.FC = () => {
    const { currentStep, formData } = useVOWizardContext();
    
    switch (currentStep) {
        case 1:
            return <VOStep1_BasicInfo />;
        case 2:
            return <VOStep2_ProjectSelection />;
        case 3:
            // Use different step component based on VO level
            if (formData.level === 'Multi-Building') {
                return <VOStep3_MultiBuildingGeneration />;
            } else {
                return <VOStep3_VOData />;
            }
        case 4:
            return <VOStep4_Review />;
        default:
            return <VOStep1_BasicInfo />;
    }
};
