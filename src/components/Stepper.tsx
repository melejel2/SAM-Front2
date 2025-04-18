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
                        {/* Step */}
                        <div className="static flex flex-col items-center">
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-full border-4 font-semibold text-white ${
                                    isComplete
                                        ? "border-success bg-success"
                                        : isActive
                                          ? "border-primary bg-primary"
                                          : "border-base-300 bg-base-300"
                                }`}>
                                {isComplete && (
                                    <svg viewBox="0 0 100 100" className="h-6 w-6">
                                        <polyline
                                            points="28.5,51.9 41.9,65.3 72.5,32.8"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="8"
                                        />
                                    </svg>
                                )}
                            </div>
                            <span
                                className={`absolute top-18 mt-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                                    isComplete
                                        ? "bg-success text-white"
                                        : isActive
                                          ? "bg-primary text-white"
                                          : "bg-base-300 text-white"
                                }`}>
                                {step.value || step.label}
                            </span>
                        </div>

                        {/* Progress line */}
                        {i !== steps.length - 1 && (
                            <div className="mx-2 mt-6 flex h-1 w-24 items-center justify-between overflow-hidden rounded-full">
                                {isComplete ? (
                                    <div className="bg-success animated-width h-full w-full" />
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
                );
            })}
        </div>
    );
};

export default Stepper;
