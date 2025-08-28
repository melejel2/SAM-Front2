import React from "react";
import { Icon } from "@iconify/react";
import infoIcon from "@iconify/icons-lucide/info";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import buildingIcon from "@iconify/icons-lucide/building";
import calculatorIcon from "@iconify/icons-lucide/calculator";
import eyeIcon from "@iconify/icons-lucide/eye";

interface ContractVOStepIndicatorProps {
    currentStep: number;
}

const steps = [
    { number: 1, title: "VO Info", icon: infoIcon },
    { number: 3, title: "Buildings", icon: buildingIcon },
    { number: 4, title: "VO Items", icon: calculatorIcon },
    { number: 5, title: "Preview", icon: eyeIcon }
];

export const ContractVOStepIndicator: React.FC<ContractVOStepIndicatorProps> = ({ currentStep }) => {
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