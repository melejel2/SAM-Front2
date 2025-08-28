import React, { ReactNode } from "react";

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
        <div className="flex w-full items-center justify-center">
            {steps.map((step, i) => {
                const isComplete = currentStep > i;
                const isActive = currentStep === i;

                return (
                    <div key={i} className="flex h-16 items-start">
                        {/* Step Container - Fixed 80px width */}
                        <div className="static flex flex-col items-center" style={{ width: "80px" }}>
                            {/* Step indicator: circular with 2px borders and 32px diameter (w-8 h-8) */}
                            <div
                                className={`flex w-8 h-8 items-center justify-center rounded-full border-2 font-semibold transition-all duration-300 ${
                                    isComplete
                                        ? "bg-success/10 border-success/20 text-success"
                                        : isActive
                                          ? "bg-primary/10 border-primary/20 text-primary"
                                          : "bg-base-200 border-base-300 text-base-content/50"
                                }`}>
                                {isComplete && (
                                    <svg viewBox="0 0 100 100" className="w-4 h-4">
                                        <polyline
                                            points="28.5,51.9 41.9,65.3 72.5,32.8"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                        />
                                    </svg>
                                )}
                            </div>
                            {/* Step labels: small text (text-xs), centered below indicators */}
                            <span
                                className={`mt-2 text-xs font-medium transition-colors duration-300 ${
                                    isComplete
                                        ? "text-success"
                                        : isActive
                                          ? "text-primary"
                                          : "text-base-content/50"
                                }`}>
                                {step.value || step.label}
                            </span>
                        </div>

                        {/* Flexible connector line */}
                        {i !== steps.length - 1 && (
                            <div className="mx-2 mt-6 flex h-1 w-24 items-center justify-between overflow-hidden rounded-full">
                                {isComplete ? (
                                    <div className="bg-success/30 animated-width h-full w-full" />
                                ) : isActive ? (
                                    <>
                                        <div className="bg-primary/30 h-full w-1/2" />
                                        <div className="bg-base-300 h-full w-1/2" />
                                    </>
                                ) : (
                                    <div className="bg-base-300 h-full w-full" />
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Stepper;
