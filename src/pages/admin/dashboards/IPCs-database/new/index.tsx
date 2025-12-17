import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import useToast from "@/hooks/use-toast";

import { UnsavedChangesDialog } from "../../subcontractors-BOQs/shared/components/UnsavedChangesDialog";
import { IPCStepIndicator } from "./components/IPCStepIndicator";
import { IPCStepRenderer } from "./components/IPCStepRenderer";
import { IPCWizardProvider, useIPCWizardContext } from "./context/IPCWizardContext";

// Inner component that uses the context
const NewIPCWizardContent: React.FC = () => {
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
        handleSubmit,
    } = useIPCWizardContext();

    const handleConfirmBack = () => {
        setShowBackConfirmDialog(false);
        navigate("/dashboard/IPCs-database");
    };

    const handleCancelBack = () => {
        setShowBackConfirmDialog(false);
    };

    const handleSubmitAndNavigate = async () => {
        const result = await handleSubmit();
        if (result.success) {
            toaster.success("IPC created successfully");
            navigate("/dashboard/IPCs-database");
        } else {
            toaster.error(result.error || "Failed to create IPC");
        }
    };

    if (loading && currentStep === 1) {
        return <Loader />;
    }

    return (
        <div>
            {/* Custom styles for floating labels and other components */}
            <style>{`
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
            <div className="mb-6 flex items-center justify-between">
                <button
                    onClick={
                        currentStep === 1 && hasUnsavedChanges
                            ? () => setShowBackConfirmDialog(true)
                            : currentStep === 1
                              ? () => navigate("/dashboard/IPCs-database")
                              : goToPreviousStep
                    }
                    className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border">
                    <span className="iconify lucide--arrow-left size-4"></span>
                    <span>Back</span>
                </button>

                {/* Timeline in the center */}
                <div className="flex flex-1 justify-center">
                    <IPCStepIndicator currentStep={currentStep} />
                </div>

                {/* Next/Save Button */}
                <div>
                    {currentStep < 4 ? (
                        <button
                            className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                            onClick={() => {
                                if (validateCurrentStep()) {
                                    goToNextStep();
                                } else {
                                    // Show validation errors based on current step
                                    switch (currentStep) {
                                        case 1:
                                            toaster.error("Please select a contract and configure IPC type");
                                            break;
                                        case 2:
                                            toaster.error(
                                                "Please set work period (from date and to date)",
                                            );
                                            break;
                                        case 3:
                                            toaster.error("Please review deductions and financial calculations");
                                            break;
                                        default:
                                            toaster.error("Please complete all required fields");
                                    }
                                }
                            }}
                            disabled={loading}>
                            <span>Next</span>
                            <span className="iconify lucide--arrow-right size-4"></span>
                        </button>
                    ) : (
                        <button
                            className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                            onClick={handleSubmitAndNavigate}
                            disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <span>Save</span>
                                    <span className="iconify lucide--check size-4"></span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Step Content */}
            <IPCStepRenderer />

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
const NewIPCWizard: React.FC = () => {
    return (
        <IPCWizardProvider>
            <NewIPCWizardContent />
        </IPCWizardProvider>
    );
};

export default NewIPCWizard;
