import { ReactNode } from "react";

interface step {
    label: string;
    value: string;
    symbol: string;
    content: ReactNode;
}

interface StepperProps {
    steps: step[];
    currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
    return (
        <div className="text-center">
            <ul className="steps overflow-x-auto text-sm">
                {steps.map((step, index) => (
                    <li
                        key={index}
                        data-content={step.symbol}
                        className={`step ${index <= currentStep ? "step-primary" : ""}`}>
                        <span>{step.value ? step.value : step.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Stepper;
