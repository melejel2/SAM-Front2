import React from "react";
import { useNavigate } from "react-router-dom";
import useToast from "@/hooks/use-toast";

interface NavigationButtonsProps {
    currentStep: number;
    hasUnsavedChanges: boolean;
    loading: boolean;
    validateCurrentStep: () => boolean;
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    handleSubmit: () => Promise<void>;
    onShowBackConfirmDialog: () => void;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
    currentStep,
    hasUnsavedChanges,
    loading,
    validateCurrentStep,
    goToNextStep,
    goToPreviousStep,
    handleSubmit,
    onShowBackConfirmDialog
}) => {
    const navigate = useNavigate();
    const { toaster } = useToast();

    const handleNext = () => {
        if (!validateCurrentStep()) {
            // Show specific validation errors based on current step
            switch (currentStep) {
                case 1:
                    toaster.error("Please select a project");
                    break;
                case 2:
                    toaster.error("Please select at least one building");
                    break;
                case 3:
                    toaster.error("Please select a subcontractor");
                    break;
                case 4:
                    toaster.error("Please fill in all required contract details");
                    break;
                case 5:
                    toaster.error("Please add at least one BOQ item");
                    break;
                default:
                    toaster.error("Please complete all required fields");
            }
            return;
        }
        
        goToNextStep();
    };

    const handleBack = () => {
        if (currentStep === 1) {
            // If on first step, check for unsaved changes
            if (hasUnsavedChanges) {
                onShowBackConfirmDialog();
            } else {
                navigate('/dashboard/subcontractors-boqs');
            }
        } else {
            // If on other steps, go back one step in wizard
            goToPreviousStep();
        }
    };

    const handleSaveAndContinue = async () => {
        if (!validateCurrentStep()) {
            toaster.error("Please complete all required fields before saving");
            return;
        }
        
        await handleSubmit();
    };

    return (
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-base-300">
            {/* Back Button */}
            <button
                type="button"
                className="btn border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
                onClick={handleBack}
                disabled={loading}
            >
                {currentStep === 1 ? "Cancel" : "Back"}
            </button>

            {/* Next/Submit Button */}
            <div className="flex gap-3">
                {currentStep < 7 ? (
                    <>
                        {/* Next Button */}
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleNext}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Loading...
                                </>
                            ) : (
                                "Next"
                            )}
                        </button>
                    </>
                ) : (
                    <>
                        {/* Save & Continue Button (Preview step) */}
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={handleSaveAndContinue}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Saving...
                                </>
                            ) : (
                                "Save & Continue"
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};