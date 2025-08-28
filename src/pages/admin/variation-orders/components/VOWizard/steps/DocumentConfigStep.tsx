import { WizardStepProps } from "../types";

const DocumentConfigStep: React.FC<WizardStepProps> = ({
    data,
    onDataChange,
    onValidationChange,
    mode,
    voDataset
}) => {
    // TODO: Implement document configuration step
    // This step should include:
    // - Document generation settings
    // - Output format selection (Word, PDF, both)
    // - Language selection
    // - Template customization options
    // - Preview options
    
    return (
        <div className="flex items-center justify-center h-96">
            <div className="text-center">
                <div className="p-4 bg-indigo-100 rounded-full mx-auto w-fit mb-4 dark:bg-indigo-900/30">
                    <span className="iconify lucide--file-cog text-indigo-600 dark:text-indigo-400 size-8"></span>
                </div>
                <h3 className="text-lg font-semibold text-base-content mb-2">Document Configuration</h3>
                <p className="text-base-content/70">Step implementation in progress...</p>
                <p className="text-sm text-base-content/60 mt-2">
                    This step will configure document generation settings and formats.
                </p>
            </div>
        </div>
    );
};

export default DocumentConfigStep;