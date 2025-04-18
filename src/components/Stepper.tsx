import React, { ReactNode } from "react";

import "./Stepper.css";

// Optional: for SVG animations or styles not covered by Tailwind

interface Step {
    label: string;
    value: string;
    symbol: string;
    content: ReactNode;
}

interface StepperProps {
    steps: Step[];
    currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
    return (
        <div className="w-full">
            <div className="flex items-center justify-center">
                {steps.map((step, i) => {
                    const isComplete = currentStep > i;
                    const isActive = currentStep == i;

                    return (
                        <div key={i} className="relative space-x-4">
                            {/* Check Circle SVG */}
                            <div className="flex items-center justify-around space-x-4">
                                <div
                                    className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full border-4 ${isComplete ? "border-success bg-success" : isActive ? "border-primary bg-primary" : "border-base-300 bg-base-300"}`}>
                                    <svg viewBox="0 0 100 100" className="h-12 w-12">
                                        {isComplete && (
                                            <polyline
                                                points="28.5,51.9 41.9,65.3 72.5,32.8"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="8"
                                            />
                                        )}
                                    </svg>
                                </div>

                                {/* Progress line (only if not last) */}
                                {i !== steps.length - 1 && (
                                    <div className="flex h-1 w-24 items-center justify-between overflow-hidden rounded-full">
                                        {isComplete ? (
                                            <div className="bg-success h-full w-full" />
                                        ) : isActive ? (
                                            <>
                                                <div className="bg-primary h-full w-1/2" />
                                                <div className="bg-base-300 h-full w-1/2" />
                                            </>
                                        ) : (
                                            <div className="bg-base-300 h-full w-full" />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Step name */}
                            <span
                                className={`light:text-white mt-4 cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium ${isComplete ? "bg-success" : isActive ? "bg-primary" : "bg-base-300"}`}>
                                {step.value ? step.value : step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Stepper;
