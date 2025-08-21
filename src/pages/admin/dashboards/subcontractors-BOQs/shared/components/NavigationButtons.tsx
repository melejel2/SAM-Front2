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
    const { showToast } = useToast();

    const handleNext = () => {
        if (!validateCurrentStep()) {
            // Show specific validation errors based on current step
            switch (currentStep) {
                case 1:
                    showToast("Please select a project", "error");
                    break;
                case 2:
                    showToast("Please select at least one building", "error");
                    break;
                case 3:
                    showToast("Please select a subcontractor", "error");
                    break;
                case 4:
                    showToast("Please fill in all required contract details", "error");
                    break;
                case 5:
                    showToast("Please add at least one BOQ item", "error");
                    break;
                default:
                    showToast("Please complete all required fields", "error");
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
            showToast("Please complete all required fields before saving", "error");
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