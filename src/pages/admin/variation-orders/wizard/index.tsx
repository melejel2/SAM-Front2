import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VOWizardProvider, useVOWizardContext } from "./context/VOWizardContext";
import { VOStepIndicator } from "./components/VOStepIndicator";
import useToast from "@/hooks/use-toast";
import { UnsavedChangesDialog } from "../../dashboards/subcontractors-BOQs/shared/components/UnsavedChangesDialog";
import { VOStepRenderer } from "./components/VOStepRenderer";
import { Loader } from "@/components/Loader";

// Inner component that uses the context (same pattern as subcontractor wizard)
const VOWizardContent: React.FC = () => {
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
    } = useVOWizardContext();

    const handleConfirmBack = () => {
        setShowBackConfirmDialog(false);
        navigate('/admin/variation-orders');
    };

    const handleCancelBack = () => {
        setShowBackConfirmDialog(false);
    };

    const handleSubmitAndNavigate = async () => {
        await handleSubmit();
        // If submission was successful, navigate back to the list
        if (!loading) {
            navigate('/admin/variation-orders');
        }
    };

    if (loading && currentStep === 1) {
        return <Loader />;
    }

    return (
        <div>
            {/* Same FilePond styles as subcontractor wizard */}
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
            `}</style>

            {/* Header with Back Button, Timeline, and Navigation (same layout as subcontractor) */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={currentStep === 1 && hasUnsavedChanges 
                        ? () => setShowBackConfirmDialog(true) 
                        : currentStep === 1 
                            ? () => navigate('/admin/variation-orders')
                            : goToPreviousStep
                    }
                    className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                >
                    <span className="iconify lucide--arrow-left size-4"></span>
                    <span>Back</span>
                </button>
                
                {/* Timeline in the center */}
                <div className="flex-1 flex justify-center">
                    <VOStepIndicator currentStep={currentStep} />
                </div>

                {/* Next/Save Button */}
                <div>
                    {currentStep < 4 ? (
                        <button
                            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                            onClick={() => {
                                if (validateCurrentStep()) {
                                    goToNextStep();
                                } else {
                                    // Show validation errors based on current step
                                    switch (currentStep) {
                                        case 1:
                                            toaster.error("Please fill in title and description");
                                            break;
                                        case 2:
                                            toaster.error("Please select project and building/sheet");
                                            break;
                                        case 3:
                                            toaster.error("Please upload a file or add VO items");
                                            break;
                                        default:
                                            toaster.error("Please complete all required fields");
                                    }
                                }
                            }}
                            disabled={loading}
                        >
                            {currentStep === 3 ? (
                                <>
                                    <span>Review</span>
                                    <span className="iconify lucide--eye size-4"></span>
                                </>
                            ) : (
                                <>
                                    <span>Next</span>
                                    <span className="iconify lucide--arrow-right size-4"></span>
                                </>
                            )}
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
                                    <span>Create VO</span>
                                    <span className="iconify lucide--check size-4"></span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Main Card Container */}
            <div className="card bg-base-100 shadow-sm p-4">
                {/* Step Content */}
                <VOStepRenderer />
            </div>

            {/* Unsaved Changes Dialog */}
            <UnsavedChangesDialog
                isOpen={showBackConfirmDialog}
                onConfirm={handleConfirmBack}
                onCancel={handleCancelBack}
            />
        </div>
    );
};

// Main component that provides the context (same pattern as subcontractor wizard)
const VOWizard: React.FC = () => {
    return (
        <VOWizardProvider>
            <VOWizardContent />
        </VOWizardProvider>
    );
};

export default VOWizard;
