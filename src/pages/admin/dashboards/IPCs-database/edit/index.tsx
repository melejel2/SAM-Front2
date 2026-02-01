import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";
import arrowRightIcon from "@iconify/icons-lucide/arrow-right";
import checkIcon from "@iconify/icons-lucide/check";

import { Loader } from "@/components/Loader";
import useToast from "@/hooks/use-toast";
import { useTopbarContent } from "@/contexts/topbar-content";
import { IPCWizardProvider, useIPCWizardContext } from "../new/context/IPCWizardContext";
import { IPCStepIndicator } from "../new/components/IPCStepIndicator";
import { IPCStepRenderer } from "../new/components/IPCStepRenderer";
import { UnsavedChangesDialog } from "../../subcontractors-BOQs/shared/components/UnsavedChangesDialog";

interface NavigationState {
    returnTo?: string;
    returnTab?: string;
}

const IPCEditContent: React.FC<{ ipcId: number }> = ({ ipcId }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toaster } = useToast();
    const { setAllContent, clearContent } = useTopbarContent();

    // Get return navigation from state
    const navigationState = location.state as NavigationState | null;
    const backDestination = navigationState?.returnTo ?? "/dashboard/IPCs-database";

    const {
        formData,
        currentStep,
        setCurrentStep,
        loading,
        previewLoading,
        goToNextStep,
        goToPreviousStep,
        validateCurrentStep,
        handleSubmit,
        loadIpcForEdit,
        hasUnsavedChanges,
        setHasUnsavedChanges,
    } = useIPCWizardContext();

    const [isSaving, setIsSaving] = useState(false);
    const [showBackConfirmDialog, setShowBackConfirmDialog] = useState(false);

    // Load IPC data on mount and start at Step 2 (skip contract selection)
    useEffect(() => {
        if (ipcId) {
            loadIpcForEdit(ipcId);
            // Start at Step 2 for edit mode (contract already selected)
            setCurrentStep(2);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ipcId]); // Only reload if IPC ID changes, not when loadIpcForEdit function changes

    const handleConfirmBack = () => {
        setShowBackConfirmDialog(false);
        navigate(backDestination);
    };

    const handleCancelBack = () => {
        setShowBackConfirmDialog(false);
    };

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            const result = await handleSubmit();
            if (result.success) {
                toaster.success("IPC updated successfully");
                setHasUnsavedChanges(false);
                navigate(backDestination);
            } else {
                toaster.error(result.error || "Failed to update IPC");
            }
        } catch (err) {
            toaster.error("An error occurred while saving");
        } finally {
            setIsSaving(false);
        }
    }, [handleSubmit, toaster, setHasUnsavedChanges, navigate, backDestination]);

    const handleExitForm = useCallback(() => {
        if (hasUnsavedChanges) {
            setShowBackConfirmDialog(true);
        } else {
            navigate(backDestination);
        }
    }, [hasUnsavedChanges, navigate, backDestination]);

    const handleBackClick = useCallback(() => {
        if (currentStep > 2) {
            goToPreviousStep();
        }
    }, [currentStep, goToPreviousStep]);

    const handleNextClick = useCallback(() => {
        if (validateCurrentStep()) {
            goToNextStep();
        } else {
            // Show validation errors based on current step
            switch (currentStep) {
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
        const leftContent = currentStep <= 2 ? (
            <button
                onClick={handleExitForm}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
                title="Back to IPC"
            >
                <Icon icon={arrowLeftIcon} className="w-4 h-4" />
            </button>
        ) : null;

        const centerContent = (
            <div className="flex items-center gap-3">
                {currentStep > 2 && (
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
                        title="Next step"
                    >
                        <Icon icon={arrowRightIcon} className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 gap-1"
                        onClick={handleSave}
                        disabled={isSaving || previewLoading}
                        title={previewLoading ? "Wait for document to finish generating" : "Save and Close"}
                    >
                        {isSaving || previewLoading ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <>
                                <Icon icon={checkIcon} className="w-4 h-4" />
                                <span>Save & Close</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        );

        setAllContent(leftContent, centerContent, null);

        return () => {
            clearContent();
        };
    }, [currentStep, loading, isSaving, previewLoading, handleExitForm, handleBackClick, handleNextClick, handleSave, setAllContent, clearContent]);



    // Show loading state while initial data is being fetched
    if (loading && formData.contractsDatasetId === 0) {
        return (
            <Loader
                icon="receipt"
                subtitle="Loading: IPC Data"
                description="Preparing payment certificate for editing..."
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

const IPCEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toaster } = useToast();

    if (!id) {
        toaster.error("Invalid IPC ID");
        navigate("/dashboard/IPCs-database");
        return null;
    }

    const ipcId = parseInt(id);
    if (isNaN(ipcId)) {
        toaster.error("Invalid IPC ID");
        navigate("/dashboard/IPCs-database");
        return null;
    }

    return (
        <IPCWizardProvider>
            <IPCEditContent ipcId={ipcId} />
        </IPCWizardProvider>
    );
};

export default IPCEdit;
