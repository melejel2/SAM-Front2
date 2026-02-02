import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";
import arrowRightIcon from "@iconify/icons-lucide/arrow-right";
import checkIcon from "@iconify/icons-lucide/check";

import { Loader } from "@/components/Loader";
import useToast from "@/hooks/use-toast";
import { useTopbarContent } from "@/contexts/topbar-content";
import { useNavigationBlocker } from "@/contexts/navigation-blocker";

import { UnsavedChangesDialog } from "../../subcontractors-BOQs/shared/components/UnsavedChangesDialog";
import { IPCStepIndicator } from "./components/IPCStepIndicator";
import { IPCStepRenderer } from "./components/IPCStepRenderer";
import { IPCWizardProvider, useIPCWizardContext } from "./context/IPCWizardContext";

// Inner component that uses the context
const NewIPCWizardContent: React.FC = () => {
    const navigate = useNavigate();
    const [showBackConfirmDialog, setShowBackConfirmDialog] = useState(false);
    const { toaster } = useToast();
    const { setAllContent, clearContent } = useTopbarContent();
    const { tryNavigate, setBlocking } = useNavigationBlocker();

    const {
        currentStep,
        hasUnsavedChanges,
        loading,
        previewLoading,
        validateCurrentStep,
        goToNextStep,
        goToPreviousStep,
        handleSubmit,
        preselectionState,
    } = useIPCWizardContext();

    // Determine the back navigation destination (contract details or IPC list)
    const backDestination = preselectionState?.returnTo || "/dashboard/IPCs-database";

    // Register navigation blocking for the wizard
    useEffect(() => {
        setBlocking(true, "You are about to leave the IPC wizard. Any unsaved changes will be lost.");

        return () => {
            setBlocking(false);
        };
    }, [setBlocking]);

    // Determine if we should skip step 1 (when coming from contract details)
    const isFromContract = !!preselectionState?.skipStep1;

    // Get the first step (Step 2 when pre-selected, Step 1 otherwise)
    const firstStep = isFromContract ? 2 : 1;

    const handleConfirmBack = () => {
        setShowBackConfirmDialog(false);
        navigate(backDestination);
    };

    const handleCancelBack = () => {
        setShowBackConfirmDialog(false);
    };

    const handleSubmitAndNavigate = useCallback(async () => {
        const result = await handleSubmit();
        if (result.success) {
            toaster.success("IPC created successfully");
            navigate(backDestination);
        } else {
            toaster.error(result.error || "Failed to create IPC");
        }
    }, [handleSubmit, navigate, backDestination, toaster]);

    const handleExitForm = useCallback(() => {
        if (hasUnsavedChanges) {
            setShowBackConfirmDialog(true);
        } else {
            navigate(backDestination);
        }
    }, [hasUnsavedChanges, navigate, backDestination]);

    const handleBackClick = useCallback(() => {
        if (currentStep > firstStep) {
            goToPreviousStep();
        }
    }, [currentStep, firstStep, goToPreviousStep]);

    const handleNextClick = useCallback(() => {
        if (validateCurrentStep()) {
            goToNextStep();
        } else {
            // Show validation errors based on current step
            switch (currentStep) {
                case 1:
                    toaster.error("Please select a contract and configure IPC type");
                    break;
                case 2:
                    toaster.error("Please set work period (from date and to date)");
                    break;
                case 3:
                    toaster.error("Please review deductions and financial calculations");
                    break;
                default:
                    toaster.error("Please complete all required fields");
            }
        }
    }, [validateCurrentStep, goToNextStep, currentStep, toaster]);

    // Set topbar content
    useEffect(() => {
        const leftContent = currentStep <= firstStep ? (
            <button
                onClick={handleExitForm}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
                title="Back to IPCs"
            >
                <Icon icon={arrowLeftIcon} className="w-4 h-4" />
            </button>
        ) : null;

        const centerContent = (
            <div className="flex items-center gap-3">
                {currentStep > firstStep && (
                    <button
                        onClick={handleBackClick}
                        className="btn btn-sm btn-circle border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
                        title="Previous step"
                    >
                        <Icon icon={arrowLeftIcon} className="w-4 h-4" />
                    </button>
                )}
                <IPCStepIndicator currentStep={currentStep} />
                {currentStep < 4 ? (
                    <button
                        className="btn btn-sm btn-circle border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
                        onClick={handleNextClick}
                        disabled={loading}
                        title="Next"
                    >
                        <Icon icon={arrowRightIcon} className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        className="btn btn-sm btn-circle border border-base-300 bg-base-100 text-base-content hover:bg-base-200 tooltip tooltip-bottom"
                        onClick={handleSubmitAndNavigate}
                        disabled={loading || previewLoading}
                        title={previewLoading ? "Wait for document to finish generating" : "Save and Close"}
                        aria-label="Save and Close"
                        data-tip={previewLoading ? "Wait for document to finish generating" : "Save and Close"}
                    >
                        {loading || previewLoading ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <Icon icon={checkIcon} className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>
        );

        setAllContent(leftContent, centerContent, null);

        return () => {
            clearContent();
        };
    }, [currentStep, firstStep, loading, previewLoading, handleExitForm, handleBackClick, handleNextClick, handleSubmitAndNavigate, setAllContent, clearContent]);

    if (loading && currentStep === firstStep) {
        return (
            <Loader
                icon="receipt"
                subtitle="Loading: New IPC"
                description="Preparing payment certificate wizard..."
            />
        );
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
