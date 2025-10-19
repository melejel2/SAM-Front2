import React from 'react';
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';
import { VOStep1_BasicInfo } from '../steps/VOStep1_BasicInfo';
import { VOStep2_ContractReview } from '../steps/VOStep2_ContractReview';
import { VOStep3_BuildingSelection } from '../steps/VOStep3_BuildingSelection';
import { VOStep4_LineItems } from '../steps/VOStep4_LineItems';
import { VOStep5_Review } from '../steps/VOStep5_Review';
import { VOStep5_Preview } from '../steps/VOStep5_Preview';

export const ContractVOStepRenderer: React.FC = () => {
    const { currentStep } = useContractVOWizardContext();

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return <VOStep1_BasicInfo />;
            case 2:
                return <VOStep2_ContractReview />;
            case 3:
                return <VOStep3_BuildingSelection />;
            case 4:
                return <VOStep4_LineItems />;
            case 5:
                return <VOStep5_Review />;
            case 6:
                return <VOStep5_Preview />;
            default:
                return (
                    <div className="text-center p-8">
                        <p className="text-error">Invalid step: {currentStep}</p>
                    </div>
                );
        }
    };

    return (
        <div className="w-full">
            {renderCurrentStep()}
        </div>
    );
};