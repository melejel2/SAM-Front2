import { Button } from "@/components/daisyui";
import { VOWizardSteps, VO_WIZARD_STEP_DEFINITIONS, VOWizardStepInfo } from "./types";

interface VOWizardNavigationProps {
    currentStep: VOWizardSteps;
    completedSteps: Set<VOWizardSteps>;
    onStepClick: (step: VOWizardSteps) => void;
    collapsed?: boolean;
}

const VOWizardNavigation: React.FC<VOWizardNavigationProps> = ({
    currentStep,
    completedSteps,
    onStepClick,
    collapsed = false
}) => {

    const getStepStatus = (step: VOWizardSteps) => {
        if (completedSteps.has(step)) return 'completed';
        if (step === currentStep) return 'current';
        return 'pending';
    };

    const getStepButtonClass = (stepInfo: VOWizardStepInfo) => {
        const status = getStepStatus(stepInfo.key);
        const baseClass = "w-full text-left transition-all duration-200";
        
        switch (status) {
            case 'completed':
                return `${baseClass} bg-green-100 hover:bg-green-200 border-green-300 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:border-green-700 dark:text-green-200`;
            case 'current':
                return `${baseClass} bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary dark:bg-primary/20 dark:hover:bg-primary/30`;
            default:
                return `${baseClass} bg-base-100 hover:bg-base-200 border-base-300 text-base-content/70 hover:text-base-content`;
        }
    };

    const getStepIcon = (stepInfo: VOWizardStepInfo) => {
        const status = getStepStatus(stepInfo.key);
        
        if (status === 'completed') {
            return 'lucide--check-circle';
        } else if (status === 'current') {
            return stepInfo.icon;
        } else {
            return stepInfo.icon;
        }
    };

    const isStepClickable = (step: VOWizardSteps) => {
        // Can click on completed steps and current step
        return completedSteps.has(step) || step === currentStep;
    };

    const getStepNumber = (stepInfo: VOWizardStepInfo) => {
        return VO_WIZARD_STEP_DEFINITIONS.findIndex(s => s.key === stepInfo.key) + 1;
    };

    return (
        <div className="space-y-2">
            {VO_WIZARD_STEP_DEFINITIONS.map((stepInfo) => {
                const status = getStepStatus(stepInfo.key);
                const stepNumber = getStepNumber(stepInfo);
                
                return (
                    <div
                        key={stepInfo.key}
                        className={`rounded-lg border-2 transition-all duration-200 ${
                            status === 'current' ? 'shadow-sm' : ''
                        }`}
                    >
                        <Button
                            type="button"
                            className={`${getStepButtonClass(stepInfo)} p-3 rounded-lg border-0 ${
                                collapsed ? 'lg:p-2' : ''
                            }`}
                            onClick={() => isStepClickable(stepInfo.key) && onStepClick(stepInfo.key)}
                            disabled={!isStepClickable(stepInfo.key)}
                        >
                            <div className={`flex items-center ${collapsed ? 'lg:justify-center' : 'gap-3'}`}>
                                {/* Step Number/Icon */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                                    status === 'completed' 
                                        ? 'bg-green-600 text-white' 
                                        : status === 'current'
                                        ? 'bg-primary text-white'
                                        : 'bg-base-300 text-base-content/70'
                                }`}>
                                    {status === 'completed' ? (
                                        <span className="iconify lucide--check size-4"></span>
                                    ) : (
                                        stepNumber
                                    )}
                                </div>

                                {/* Step Details - Hidden when collapsed */}
                                <div className={`flex-1 min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`iconify ${getStepIcon(stepInfo)} size-4`}></span>
                                            <h4 className="font-medium truncate">{stepInfo.title}</h4>
                                        </div>
                                        
                                        {/* Required indicator */}
                                        {stepInfo.isRequired && (
                                            <span className="text-red-500 text-xs font-bold">*</span>
                                        )}
                                    </div>
                                    
                                    <p className="text-xs text-current/70 mt-1 truncate">
                                        {stepInfo.description}
                                    </p>
                                    
                                    {/* Time estimate and status */}
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-current/50">
                                            {stepInfo.estimatedTime}
                                        </span>
                                        
                                        {status === 'completed' && (
                                            <div className="flex items-center gap-1">
                                                <span className="iconify lucide--check size-3"></span>
                                                <span className="text-xs font-medium">Complete</span>
                                            </div>
                                        )}
                                        
                                        {status === 'current' && (
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                                                <span className="text-xs font-medium">Active</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Collapsed tooltip indicator */}
                                <div className={`hidden lg:block tooltip tooltip-right ${collapsed ? '' : 'lg:hidden'}`}
                                     data-tip={`${stepInfo.title}: ${stepInfo.description}`}>
                                    <span className={`iconify ${getStepIcon(stepInfo)} size-5`}></span>
                                </div>
                            </div>
                        </Button>

                        {/* Step Connection Line - Only show when not collapsed */}
                        {stepNumber < VO_WIZARD_STEP_DEFINITIONS.length && (
                            <div className={`flex justify-center py-1 ${collapsed ? 'lg:hidden' : ''}`}>
                                <div className={`w-0.5 h-4 transition-colors duration-200 ${
                                    completedSteps.has(stepInfo.key) 
                                        ? 'bg-green-300 dark:bg-green-700' 
                                        : 'bg-base-300'
                                }`}></div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Overall Progress Summary - Hidden when collapsed */}
            <div className={`mt-6 p-3 bg-base-300/50 rounded-lg ${collapsed ? 'lg:hidden' : ''}`}>
                <div className="text-sm text-base-content/70">
                    <div className="flex items-center justify-between">
                        <span>Overall Progress</span>
                        <span className="font-medium">
                            {completedSteps.size}/{VO_WIZARD_STEP_DEFINITIONS.length}
                        </span>
                    </div>
                    
                    <div className="w-full bg-base-300 rounded-full h-1.5 mt-2">
                        <div 
                            className="bg-primary h-1.5 rounded-full transition-all duration-500"
                            style={{ 
                                width: `${(completedSteps.size / VO_WIZARD_STEP_DEFINITIONS.length) * 100}%` 
                            }}
                        ></div>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs">
                        <span>
                            {completedSteps.size === VO_WIZARD_STEP_DEFINITIONS.length 
                                ? 'Ready to submit' 
                                : `${VO_WIZARD_STEP_DEFINITIONS.length - completedSteps.size} steps remaining`
                            }
                        </span>
                        <span>
                            {Math.round((completedSteps.size / VO_WIZARD_STEP_DEFINITIONS.length) * 100)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VOWizardNavigation;