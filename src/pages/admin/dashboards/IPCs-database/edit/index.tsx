import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import { Loader } from "@/components/Loader";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import { IPCWizardProvider, useIPCWizardContext } from "../new/context/IPCWizardContext";
import { IPCStepIndicator } from "../new/components/IPCStepIndicator";
import { IPCStepRenderer } from "../new/components/IPCStepRenderer";
import { UnsavedChangesDialog } from "../../subcontractors-BOQs/shared/components/UnsavedChangesDialog";
import PenaltyForm from "../components/PenaltyForm";

interface NavigationState {
    returnTo?: string;
    returnTab?: string;
}

const IPCEditContent: React.FC<{ ipcId: number }> = ({ ipcId }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toaster } = useToast();

    // Get return navigation from state
    const navigationState = location.state as NavigationState | null;
    const backDestination = navigationState?.returnTo ?? "/dashboard/IPCs-database";

    const {
        formData,
        currentStep,
        setCurrentStep,
        loading,
        goToNextStep,
        goToPreviousStep,
        validateCurrentStep,
        handleSubmit,
        loadIpcForEdit,
        setFormData,
        hasUnsavedChanges,
        setHasUnsavedChanges,
    } = useIPCWizardContext();

    const [isSaving, setIsSaving] = useState(false);
    const [showPenaltyForm, setShowPenaltyForm] = useState(false);
    const [penaltyData, setPenaltyData] = useState({ penalty: 0, previousPenalty: 0, reason: "" });
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

    // Update penalty data when form data changes
    useEffect(() => {
        setPenaltyData({
            penalty: formData.penalty || 0,
            previousPenalty: formData.previousPenalty || 0,
            reason: formData.penaltyReason || "",
        });
    }, [formData.penalty, formData.previousPenalty, formData.penaltyReason]);

    const handleConfirmBack = () => {
        setShowBackConfirmDialog(false);
        navigate(backDestination);
    };

    const handleCancelBack = () => {
        setShowBackConfirmDialog(false);
    };

    const handleSave = async () => {
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
    };

    const handlePenaltySave = (penaltyFormData: typeof penaltyData) => {
        setFormData({
            penalty: penaltyFormData.penalty,
            previousPenalty: penaltyFormData.previousPenalty,
            penaltyReason: penaltyFormData.reason,
        });
        setHasUnsavedChanges(true);
        setShowPenaltyForm(false);
        toaster.success("Penalty information updated");
    };



    // Show loading state while initial data is being fetched
    if (loading && formData.contractsDatasetId === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader />
                <p className="text-base-content/70 text-sm">Loading IPC data...</p>
            </div>
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

            {/* Header with Back Button, Timeline, and Action Buttons */}
            <div className="mb-6 flex items-center justify-between">
                <button
                    onClick={
                        currentStep === 2 && hasUnsavedChanges
                            ? () => setShowBackConfirmDialog(true)
                            : currentStep === 2
                              ? () => navigate(backDestination)
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

                {/* Action Buttons - Edit-specific features */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPenaltyForm(true)}
                        className="btn btn-sm flex items-center gap-2 bg-red-600 text-white hover:bg-red-700">
                        <span className="iconify lucide--alert-triangle size-4"></span>
                        <span>Penalties</span>
                    </button>

                    {/* Next/Save Navigation Button - Edit mode has 3 steps (2, 3, 4) */}
                    {currentStep < 4 ? (
                        <button
                            className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                            onClick={() => {
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
                            }}
                            disabled={loading}>
                            <span>Next</span>
                            <span className="iconify lucide--arrow-right size-4"></span>
                        </button>
                    ) : (
                        <button
                            className="btn btn-sm btn-primary flex items-center gap-2"
                            onClick={handleSave}
                            disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <span>Save and Close</span>
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

            {/* Penalty Form Modal */}
            <PenaltyForm
                isOpen={showPenaltyForm}
                onClose={() => setShowPenaltyForm(false)}
                onSave={handlePenaltySave}
                initialData={penaltyData}
                loading={isSaving}
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
