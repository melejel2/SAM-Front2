import React from 'react';
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';
import { VOStep1_VODetails } from '../steps/VOStep1_VODetails';
import { VOStep2_LineItems } from '../steps/VOStep2_LineItems';
import { VOStep3_ReviewPreview } from '../steps/VOStep3_ReviewPreview';

/**
 * 3-Step Contract VO Creation Wizard
 * Step 1: VO Details (Basic Info + Building Selection)
 * Step 2: BOQ Line Items
 * Step 3: Review & Preview
 */
export const ContractVOStepRenderer: React.FC = () => {
    const { currentStep } = useContractVOWizardContext();

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return <VOStep1_VODetails />;
            case 2:
                return <VOStep2_LineItems />;
            case 3:
                return <VOStep3_ReviewPreview />;
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