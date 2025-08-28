import { WizardStepProps } from "../types";

const TemplateSelectionStep: React.FC<WizardStepProps> = ({
    data,
    onDataChange,
    onValidationChange,
    mode,
    voDataset
}) => {
    // TODO: Implement template selection step
    // This step should include:
    // - List of available VO templates
    // - Template preview functionality
    // - Option to skip template selection
    // - Template upload/management options
    
    return (
        <div className="flex items-center justify-center h-96">
            <div className="text-center">
                <div className="p-4 bg-purple-100 rounded-full mx-auto w-fit mb-4 dark:bg-purple-900/30">
                    <span className="iconify lucide--file-template text-purple-600 dark:text-purple-400 size-8"></span>
                </div>
                <h3 className="text-lg font-semibold text-base-content mb-2">Template Selection</h3>
                <p className="text-base-content/70">Step implementation in progress...</p>
                <p className="text-sm text-base-content/60 mt-2">
                    This step will allow selection of document templates for VO generation.
                </p>
            </div>
        </div>
    );
};

export default TemplateSelectionStep;