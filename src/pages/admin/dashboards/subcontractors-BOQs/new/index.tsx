import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";
import arrowRightIcon from "@iconify/icons-lucide/arrow-right";
import checkIcon from "@iconify/icons-lucide/check";
import { WizardProvider, useWizardContext } from "./context/WizardContext";
import { StepIndicator } from "../shared/components/StepIndicator";
import useToast from "@/hooks/use-toast";
import { UnsavedChangesDialog } from "../shared/components/UnsavedChangesDialog";
import { StepRenderer } from "./components/StepRenderer";
import { Loader } from "@/components/Loader";

// Inner component that uses the context
const NewSubcontractWizardContent: React.FC = () => {
    const navigate = useNavigate();
    const [showBackConfirmDialog, setShowBackConfirmDialog] = useState(false);
    const { toaster } = useToast();
    
    const {
        currentStep,
        hasUnsavedChanges,
        loading,
        validateCurrentStep,
        goToNextStep,
        goToPreviousStep,
        handleSubmit
    } = useWizardContext();

    const handleConfirmBack = () => {
        setShowBackConfirmDialog(false);
        navigate('/dashboard/contracts');
    };

    const handleCancelBack = () => {
        setShowBackConfirmDialog(false);
    };

    const handleSubmitAndNavigate = async () => {
        const success = await handleSubmit();
        if (success) {
            navigate('/dashboard/contracts');
        }
    };

    if (loading && currentStep === 1) {
        return <Loader />;
    }

    return (
        <div>
            {/* Custom styles for FilePond and other components */}
            <style>{`
                .filepond-wrapper .filepond--root {
                    font-family: inherit;
                }
                
                .filepond-wrapper .filepond--drop-label {
                    color: var(--fallback-bc, oklch(var(--bc)));
                    font-size: 0.875rem;
                }
                
                .filepond-wrapper .filepond--label-action {
                    text-decoration: underline;
                    color: var(--fallback-p, oklch(var(--p)));
                    cursor: pointer;
                }
                
                .filepond-wrapper .filepond--panel-root {
                    background-color: var(--fallback-b2, oklch(var(--b2)));
                    border: 2px dashed var(--fallback-bc, oklch(var(--bc) / 0.2));
                    border-radius: var(--rounded-btn, 0.5rem);
                }
                
                .filepond-wrapper .filepond--item-panel {
                    background-color: var(--fallback-b1, oklch(var(--b1)));
                    border-radius: var(--rounded-btn, 0.5rem);
                }
                
                .filepond-wrapper .filepond--drip {
                    background-color: var(--fallback-p, oklch(var(--p) / 0.1));
                    border-color: var(--fallback-p, oklch(var(--p)));
                }
                
                .filepond-wrapper .filepond--item {
                    margin-bottom: 0.5rem;
                }
                
                .filepond-wrapper .filepond--file-action-button {
                    color: var(--fallback-bc, oklch(var(--bc)));
                    background-color: var(--fallback-b3, oklch(var(--b3)));
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .filepond-wrapper .filepond--file-action-button:hover {
                    background-color: var(--fallback-er, oklch(var(--er)));
                    color: white;
                }
                
                .filepond-wrapper .filepond--file-info {
                    color: var(--fallback-bc, oklch(var(--bc) / 0.7));
                    font-size: 0.75rem;
                }
                
                .filepond-wrapper .filepond--file-status {
                    color: var(--fallback-bc, oklch(var(--bc) / 0.6));
                    font-size: 0.75rem;
                }
                
                /* Hide FilePond status indicators to prevent duplicate feedback */
                .filepond-wrapper .filepond--file-status-main {
                    display: none !important;
                }
                
                .filepond-wrapper .filepond--file-status-sub {
                    display: none !important;
                }
                
                .filepond-wrapper .filepond--load-indicator {
                    display: none !important;
                }
                
                .filepond-wrapper .filepond--progress-indicator {
                    display: none !important;
                }
                
                /* Custom styles for floating labels */
                .floating-label-group {
                    position: relative;
                }
                
                .floating-label-group input:focus + .floating-label,
                .floating-label-group input:not(:placeholder-shown) + .floating-label,
                .floating-label-group select:focus + .floating-label,
                .floating-label-group select:not([value=""]) + .floating-label,
                .floating-label-group textarea:focus + .floating-label,
                .floating-label-group textarea:not(:placeholder-shown) + .floating-label {
                    transform: translateY(-1.5rem) scale(0.75);
                    color: var(--fallback-p, oklch(var(--p)));
                    background-color: var(--fallback-b1, oklch(var(--b1)));
                    padding: 0 0.5rem;
                    z-index: 10;
                }
                
                .floating-label {
                    position: absolute;
                    left: 0.75rem;
                    top: 0.75rem;
                    pointer-events: none;
                    transition: all 0.2s ease-out;
                    transform-origin: left center;
                    color: var(--fallback-bc, oklch(var(--bc) / 0.6));
                    font-size: 1rem;
                }
                
                .floating-input {
                    padding-top: 1.5rem !important;
                    padding-bottom: 0.5rem !important;
                }
            `}</style>

            {/* Header with Back Button, Timeline, and Navigation */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={currentStep === 1 && hasUnsavedChanges
                        ? () => setShowBackConfirmDialog(true)
                        : currentStep === 1
                            ? () => navigate('/dashboard/contracts')
                            : goToPreviousStep
                    }
                    className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                >
                    <Icon icon={arrowLeftIcon} className="w-4 h-4" />
                    <span>Back</span>
                </button>
                
                {/* Timeline in the center */}
                <div className="flex-1 flex justify-center">
                    <StepIndicator currentStep={currentStep} />
                </div>

                {/* Next/Save Button */}
                <div>
                    {currentStep < 5 ? (
                        <button
                            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                            onClick={() => {
                                if (validateCurrentStep()) {
                                    goToNextStep();
                                } else {
                                    // Show validation errors based on current step
                                    switch (currentStep) {
                                        case 1:
                                            toaster.error("Please select a project");
                                            break;
                                        case 2:
                                            toaster.error("Please select a subcontractor");
                                            break;
                                        case 3:
                                            toaster.error("Please fill in all required contract details");
                                            break;
                                        case 4:
                                            toaster.error("Please add at least one BOQ item");
                                            break;
                                        default:
                                            toaster.error("Please complete all required fields");
                                    }
                                }
                            }}
                            disabled={loading}
                        >
                            <span>Next</span>
                            <Icon icon={arrowRightIcon} className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                            onClick={handleSubmitAndNavigate}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <span>Save</span>
                                    <Icon icon={checkIcon} className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Step Content */}
            <StepRenderer />

            {/* Unsaved Changes Dialog */}
            <UnsavedChangesDialog
                isOpen={showBackConfirmDialog}
                onConfirm={handleConfirmBack}
                onCancel={handleCancelBack}
            />
        </div>
    );
};

// Main component that provides the context
const NewSubcontractWizard: React.FC = () => {
    return (
        <WizardProvider>
            <NewSubcontractWizardContent />
        </WizardProvider>
    );
};

export default NewSubcontractWizard;