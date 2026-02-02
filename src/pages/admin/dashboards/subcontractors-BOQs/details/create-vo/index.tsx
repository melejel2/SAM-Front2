import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";
import arrowRightIcon from "@iconify/icons-lucide/arrow-right";
import checkIcon from "@iconify/icons-lucide/check";
import { ContractVOWizardProvider, useContractVOWizardContext } from "./context/ContractVOWizardContext";
import { ContractVOStepIndicator } from "./components/ContractVOStepIndicator";
import useToast from "@/hooks/use-toast";
import { UnsavedChangesDialog } from "../../shared/components/UnsavedChangesDialog";
import { ContractVOStepRenderer } from "./components/ContractVOStepRenderer";
import { Loader } from "@/components/Loader";
import { useTopbarContent } from "@/contexts/topbar-content";

// Inner component that uses the context
const CreateContractVOContent: React.FC = () => {
    const navigate = useNavigate();
    const { contractIdentifier } = useParams<{ contractIdentifier: string }>();
    const location = useLocation();
    const [showBackConfirmDialog, setShowBackConfirmDialog] = useState(false);
    const { toaster } = useToast();
    const { setAllContent, clearContent } = useTopbarContent();
    
    // Get actual contract ID from navigation state (for API calls)
    const contractId = location.state?.contractId;
    
    const {
        currentStep,
        hasUnsavedChanges,
        loading,
        validateCurrentStep,
        goToNextStep,
        goToPreviousStep,
        handleSubmit
    } = useContractVOWizardContext();

    const firstStep = 1;

    const handleConfirmBack = () => {
        setShowBackConfirmDialog(false);
        navigate(`/dashboard/contracts/details/${contractIdentifier}`, {
            state: { contractId }
        });
    };

    const handleCancelBack = () => {
        setShowBackConfirmDialog(false);
    };

    const handleSubmitAndNavigate = useCallback(async () => {
        await handleSubmit();
        // If submission was successful, navigate back to contract details
        if (!loading) {
            navigate(`/dashboard/contracts/details/${contractIdentifier}`, {
                state: { contractId }
            });
        }
    }, [handleSubmit, loading, navigate, contractIdentifier, contractId]);

    const handleExitForm = useCallback(() => {
        if (hasUnsavedChanges) {
            setShowBackConfirmDialog(true);
        } else {
            navigate(`/dashboard/contracts/details/${contractIdentifier}`, {
                state: { contractId }
            });
        }
    }, [hasUnsavedChanges, navigate, contractIdentifier, contractId]);

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
                    toaster.error("Please fill in all required VO information and select at least one building");
                    break;
                case 2:
                    toaster.error("Please add at least one VO line item. Items with units must have quantity and unit price greater than 0.");
                    break;
                default:
                    toaster.error("Please complete all required fields");
            }
        }
    }, [validateCurrentStep, goToNextStep, currentStep, toaster]);

    useEffect(() => {
        const leftContent = currentStep <= firstStep ? (
            <button
                onClick={handleExitForm}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
                title="Back to Contract"
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
                <ContractVOStepIndicator currentStep={currentStep} />
                {currentStep < 3 ? (
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
                        className="btn btn-sm btn-circle border border-base-300 bg-base-100 text-base-content hover:bg-base-200 tooltip tooltip-bottom"
                        onClick={handleSubmitAndNavigate}
                        disabled={loading}
                        title="Save and Close"
                        aria-label="Save and Close"
                        data-tip="Save and Close"
                    >
                        {loading ? (
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
    }, [currentStep, firstStep, loading, handleExitForm, handleBackClick, handleNextClick, handleSubmitAndNavigate, setAllContent, clearContent]);

    if (loading && currentStep === 1) {
        return (
            <Loader
                icon="file-diff"
                subtitle="Loading: Create VO"
                description="Preparing variation order form..."
            />
        );
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
            {/* Contract context banner - removed to avoid duplication */}

            {/* Step Content */}
            <ContractVOStepRenderer />

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
const CreateContractVO: React.FC = () => {
    const location = useLocation();
    const { voDatasetId: voDatasetIdParam } = useParams<{ voDatasetId: string }>(); // Get from URL params
    const contractId = location.state?.contractId;
    const voDatasetId = voDatasetIdParam ? parseInt(voDatasetIdParam) : undefined; // Convert to number
    
    if (!contractId) {
        return (
            <div className="p-6">
                <p className="text-error">Invalid contract ID</p>
            </div>
        );
    }

    return (
        <ContractVOWizardProvider 
            contractId={String(contractId)} 
            voDatasetId={voDatasetId}
        >
            <CreateContractVOContent />
        </ContractVOWizardProvider>
    );
};

export default CreateContractVO;
