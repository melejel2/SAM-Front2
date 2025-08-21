import React from "react";
import { Icon } from "@iconify/react";
import folderIcon from "@iconify/icons-lucide/folder";
import buildingIcon from "@iconify/icons-lucide/building";
import userIcon from "@iconify/icons-lucide/user";
import contractIcon from "@iconify/icons-lucide/file-signature";
import calculatorIcon from "@iconify/icons-lucide/calculator";
import eyeIcon from "@iconify/icons-lucide/eye";
import sendIcon from "@iconify/icons-lucide/send";

interface StepIndicatorProps {
    currentStep: number;
}

const steps = [
    { number: 1, title: "Project", icon: folderIcon },
    { number: 2, title: "Buildings", icon: buildingIcon },
    { number: 3, title: "Subcontractor", icon: userIcon },
    { number: 4, title: "Details", icon: contractIcon },
    { number: 5, title: "BOQ Items", icon: calculatorIcon },
    { number: 6, title: "Review", icon: eyeIcon },
    { number: 7, title: "Preview", icon: sendIcon }
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
    const getStepColorClass = (stepNumber: number) => {
        if (currentStep === stepNumber) {
            return "bg-primary border-primary text-primary-content";
        }
        if (currentStep > stepNumber) {
            return "bg-success border-success text-success-content";
        }
        return "bg-base-200 border-base-300 text-base-content/60";
    };

    const getConnectorColor = (stepNumber: number) => {
        if (currentStep > stepNumber) {
            return "bg-success";
        }
        return "bg-base-300";
    };

    return (
        <div className="w-full">
            {/* Step indicator with integrated progress */}
            <div className="flex items-center justify-center">
                {steps.map((step, idx) => (
                    <div key={step.number} className="flex items-center">
                        <div className="flex flex-col items-center" style={{ width: "90px" }}>
                            <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${getStepColorClass(step.number)}`}>
                                <Icon icon={step.icon} width={20} height={20} />
                            </div>
                            <span className="text-xs font-medium text-center mt-1.5 text-base-content">
                                {step.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="flex-1 flex items-center" style={{ marginTop: "-16px", minWidth: "50px" }}>
                                <div className="h-1 w-full">
                                    <div className={`h-1 w-full transition-colors duration-500 ${getConnectorColor(step.number)}`} />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                
                {/* Progress percentage - positioned to the right */}
                <div className="ml-6 text-xs font-medium text-base-content/70">
                    {Math.round((currentStep / steps.length) * 100)}%
                </div>
            </div>
        </div>
    );
};