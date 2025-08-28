import { WizardStepProps } from "../types";

const FinancialReviewStep: React.FC<WizardStepProps> = ({
    data,
    onDataChange,
    onValidationChange,
    mode,
    voDataset
}) => {
    // TODO: Implement financial review step
    // This step should include:
    // - Financial impact summary
    // - Total calculations display
    // - Currency conversion if needed
    // - Impact on overall project budget
    // - Financial approval workflow triggers
    
    return (
        <div className="flex items-center justify-center h-96">
            <div className="text-center">
                <div className="p-4 bg-yellow-100 rounded-full mx-auto w-fit mb-4 dark:bg-yellow-900/30">
                    <span className="iconify lucide--calculator text-yellow-600 dark:text-yellow-400 size-8"></span>
                </div>
                <h3 className="text-lg font-semibold text-base-content mb-2">Financial Review</h3>
                <p className="text-base-content/70">Step implementation in progress...</p>
                <p className="text-sm text-base-content/60 mt-2">
                    This step will provide financial calculations and impact analysis.
                </p>
            </div>
        </div>
    );
};

export default FinancialReviewStep;