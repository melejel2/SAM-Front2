import React from "react";
import { Icon } from "@iconify/react";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import calendarDaysIcon from "@iconify/icons-lucide/calendar-days";
import minusCircleIcon from "@iconify/icons-lucide/minus-circle";
import checkIcon from "@iconify/icons-lucide/check";

interface IPCStepIndicatorProps {
    currentStep: number;
}

const steps = [
    { number: 1, title: "Contract & Type", icon: fileTextIcon },
    { number: 2, title: "Period & BOQ", icon: calendarDaysIcon },
    { number: 3, title: "Deductions", icon: minusCircleIcon },
    { number: 4, title: "Preview", icon: checkIcon }
];

export const IPCStepIndicator: React.FC<IPCStepIndicatorProps> = ({ currentStep }) => {
    const getStepColorClass = (stepNumber: number) => {
        if (currentStep === stepNumber) {
            // Current Active Step: Use primary color with opacity variations
            return "bg-primary/10 border-primary/20 text-primary";
        }
        if (currentStep > stepNumber) {
            // Completed/Approved Steps: Use success green with opacity variations
            return "bg-success/10 border-success/20 text-success";
        }
        // Future/Inactive Steps: Use muted base colors
        return "bg-base-200 border-base-300 text-base-content/50";
    };

    const getConnectorColor = (stepNumber: number) => {
        if (currentStep > stepNumber) {
            // Connector lines between completed steps: success with opacity
            return "bg-success/30";
        }
        // Future connector lines: muted
        return "bg-base-300";
    };

    return (
        <div className="w-full">
            {/* Step indicator */}
            <div className="flex items-center justify-center">
                {steps.map((step, idx) => (
                    <div key={step.number} className="flex items-center">
                        {/* Step Container - Fixed 80px width */}
                        <div className="flex flex-col items-center" style={{ width: "80px" }}>
                            {/* Step indicator: circular with 2px borders and 32px diameter (w-8 h-8) */}
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${getStepColorClass(step.number)}`}>
                                {/* Icons: 16x16 pixels when present, centered */}
                                <Icon icon={step.icon} width={16} height={16} />
                            </div>
                            {/* Step labels: small text (text-xs), centered below indicators */}
                            <span className={`text-xs font-medium text-center mt-1.5 transition-colors duration-300 ${
                                currentStep === step.number
                                    ? "text-primary"
                                    : currentStep > step.number
                                        ? "text-success"
                                        : "text-base-content/50"
                            }`}>
                                {step.title}
                            </span>
                        </div>
                        {/* Flexible connectors between steps */}
                        {idx < steps.length - 1 && (
                            <div className="flex-1 flex items-center" style={{ marginTop: "-16px", minWidth: "50px" }}>
                                <div className="h-1 w-full">
                                    <div className={`h-1 w-full transition-colors duration-500 ${getConnectorColor(step.number)}`} />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
