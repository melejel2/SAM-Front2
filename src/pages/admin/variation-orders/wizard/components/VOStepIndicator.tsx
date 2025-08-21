import React from "react";
import { Icon } from "@iconify/react";
import infoIcon from "@iconify/icons-lucide/info";
import buildingIcon from "@iconify/icons-lucide/building";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import eyeIcon from "@iconify/icons-lucide/eye";

interface VOStepIndicatorProps {
    currentStep: number;
}

// Simplified 4-step process (vs 7 steps for subcontractor)
const steps = [
    { number: 1, title: "Basic Info", icon: infoIcon },
    { number: 2, title: "Project/Building", icon: buildingIcon },
    { number: 3, title: "VO Data", icon: fileTextIcon },
    { number: 4, title: "Review", icon: eyeIcon }
];

export const VOStepIndicator: React.FC<VOStepIndicatorProps> = ({ currentStep }) => {
    const getStepColorClass = (stepNumber: number) => {
        if (currentStep === stepNumber) {
            return "bg-primary border-primary text-primary-content";
        }
        if (currentStep > stepNumber) {
            return "bg-success border-success text-success-content";
        }
        return "bg-base-200 border-base-300 text-base-content";
    };

    const getConnectorClass = (stepNumber: number) => {
        return currentStep > stepNumber ? "bg-success" : "bg-base-300";
    };

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <React.Fragment key={step.number}>
                        {/* Step Circle */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${getStepColorClass(step.number)}`}
                            >
                                <Icon 
                                    icon={step.icon} 
                                    className="w-5 h-5" 
                                />
                            </div>
                            <span className={`text-xs mt-2 font-medium transition-colors duration-300 ${
                                currentStep === step.number 
                                    ? "text-primary" 
                                    : currentStep > step.number 
                                        ? "text-success" 
                                        : "text-base-content/60"
                            }`}>
                                {step.title}
                            </span>
                        </div>
                        
                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div
                                className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${getConnectorClass(step.number)}`}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
