import React from "react";
import { Icon } from "@iconify/react";
import folderIcon from "@iconify/icons-lucide/folder";
import userIcon from "@iconify/icons-lucide/user";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import calculatorIcon from "@iconify/icons-lucide/calculator";
import checkCircleIcon from "@iconify/icons-lucide/check-circle";
import eyeIcon from "@iconify/icons-lucide/eye";

interface StepIndicatorProps {
    currentStep: number;
}

const steps = [
    { number: 1, title: "Project", icon: folderIcon },
    { number: 2, title: "Subcontractor", icon: userIcon },
    { number: 3, title: "Contract", icon: fileTextIcon },
    { number: 4, title: "BOQ Items", icon: calculatorIcon },
    { number: 5, title: "Review", icon: checkCircleIcon },
    { number: 6, title: "Preview", icon: eyeIcon }
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
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