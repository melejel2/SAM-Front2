import { WizardStepProps } from "../types";

const ProjectBuildingStep: React.FC<WizardStepProps> = ({
    data,
    onDataChange,
    onValidationChange,
    mode,
    voDataset
}) => {
    // TODO: Implement project and building selection step
    // This step should include:
    // - Project selection dropdown
    // - Building selection (filtered by project)
    // - Level selection (Project, Building, Sheet)
    // - Sheet selection (if Sheet level is chosen)
    
    return (
        <div className="flex items-center justify-center h-96">
            <div className="text-center">
                <div className="p-4 bg-blue-100 rounded-full mx-auto w-fit mb-4 dark:bg-blue-900/30">
                    <span className="iconify lucide--building-2 text-blue-600 dark:text-blue-400 size-8"></span>
                </div>
                <h3 className="text-lg font-semibold text-base-content mb-2">Project & Building Selection</h3>
                <p className="text-base-content/70">Step implementation in progress...</p>
                <p className="text-sm text-base-content/60 mt-2">
                    This step will include project selection, building assignment, and scope level configuration.
                </p>
            </div>
        </div>
    );
};

export default ProjectBuildingStep;