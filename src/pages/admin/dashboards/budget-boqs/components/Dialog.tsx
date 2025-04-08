import React, { useState } from "react";

import { Button } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";

import BOQStep from "./BOQStep";
import BuildingsStep from "./BuildingsStep";
import ParticularConditionsStep from "./ParticularConditionsStep";
import PreviewStep from "./PreviewStep";
import ProjectStep from "./ProjectStep";
import SubcontractorsStep from "./SubcontractorsStep";
import TradeStep from "./TradeStep";

interface BOQDialogProps {
    handleHide: () => void;
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    dialogType: "Add" | "Edit" | "Preview";
    onSuccess: () => void;
}

const BOQDialogComponent: React.FC<BOQDialogProps> = ({ handleHide, dialogRef, dialogType, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const { toaster } = useToast();

    const steps = [
        { label: "Project", content: <ProjectStep /> },
        { label: "Trade", content: <TradeStep /> },
        { label: "Buildings", content: <BuildingsStep /> },
        { label: "Subcontractor", content: <SubcontractorsStep /> },
        { label: "Particular Conditions", content: <ParticularConditionsStep /> },
        { label: "BOQ", content: <BOQStep /> },
        { label: "Preview", content: <PreviewStep /> },
    ];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        setIsLoading(false);

        toaster.success("Done...");
        onSuccess();
        handleClose();
    };

    const handleClose = () => {
        handleHide();
    };

    return (
        <dialog ref={dialogRef as React.Ref<HTMLDialogElement>} className="modal" aria-modal="true">
            <div className="modal-box relative h-[85%] max-w-[85%]">
                <form onSubmit={handleSubmit} className="h-[84%] space-y-4">
                    <div>
                        <div className="text-center">
                            <ul className="steps overflow-x-auto text-sm">
                                {steps.map((step, index) => (
                                    <li key={index} className={`step ${index <= currentStep ? "step-primary" : ""}`}>
                                        {step.label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
                            onClick={handleClose}
                            aria-label="Close">
                            ✕
                        </button>
                    </div>
                    <div className="mt-4 flex h-full items-center justify-between">
                        <Button
                            type="button"
                            color="ghost"
                            className="btn-circle"
                            disabled={currentStep === 0}
                            onClick={() => setCurrentStep((prev) => prev - 1)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                                <g
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M16 12H8m4-4l-4 4l4 4" />
                                </g>
                            </svg>
                        </Button>

                        {/* Content */}
                        <div className="h-full px-2">{steps[currentStep].content}</div>

                        <Button
                            type="button"
                            color="ghost"
                            className="btn-circle"
                            disabled={currentStep === steps.length - 1}
                            onClick={() => setCurrentStep((prev) => prev + 1)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                                <g
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M8 12h8m-4 4l4-4l-4-4" />
                                </g>
                            </svg>
                        </Button>
                    </div>
                    {currentStep === steps.length - 1 && (
                        <Button className="w-full" size="sm" type="submit" disabled={isLoading} loading={isLoading}>
                            {dialogType === "Add" ? "Add" : "Save"}
                        </Button>
                    )}
                </form>
            </div>
        </dialog>
    );
};

export default BOQDialogComponent;
