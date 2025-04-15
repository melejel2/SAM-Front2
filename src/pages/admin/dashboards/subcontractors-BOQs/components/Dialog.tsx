import React, { useState } from "react";

import { Button } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";

import SubcontractorBOQStep from "./BOQ";
import BuildingsStep from "./Buildings";
import useBuildings from "./Buildings/use-buildings";
import ParticularConditionsStep from "./ParticularConditions";
import PreviewStep from "./Preview";
import ProjectStep from "./Projects";
import SubcontractorsStep from "./Subcontractors";
import TradeStep from "./Trade";
import useSubcontractorBOQsDialog from "./use-subcontractor-boq-dialog";

interface SubcontractorsBOQDialogProps {
    handleHide: () => void;
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    dialogType: "Add" | "Edit" | "Delete" | "Preview" | "Select";
    onSuccess: () => void;
}

const SubcontractorsBOQDialog: React.FC<SubcontractorsBOQDialogProps> = ({
    handleHide,
    dialogRef,
    dialogType,
    onSuccess,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const {
        setSelectedProject,
        selectedProject,
        setSelectedTrade,
        selectedTrade,
        setSelectedBuilding,
        selectedBuilding,
        setSelectedSubcontractor,
        selectedSubcontractor,
    } = useSubcontractorBOQsDialog();

    const { tableData } = useBuildings();

    const { toaster } = useToast();

    const handleSelectProject = (project: any) => {
        setSelectedProject(project);
    };

    const handleSelectTrade = (trade: any) => {
        setSelectedTrade(trade);
    };

    const handleSelectBuilding = (building: any) => {
        setSelectedBuilding(building);
    };

    const handleSelectSubcontractor = (subcontractor: any) => {
        setSelectedSubcontractor(subcontractor);
    };

    const handleBack = () => {
        setCurrentStep((prev) => prev - 1);
    };

    const handleNext = () => {
        setCurrentStep((prev) => prev + 1);
    };

    const steps = [
        { label: "Project", content: <ProjectStep onSelectProject={handleSelectProject} /> },
        { label: "Trade", content: <TradeStep onSelectTrade={handleSelectTrade} /> },
        { label: "Buildings", content: <BuildingsStep onSelectBuilding={handleSelectBuilding} /> },
        { label: "Subcontractor", content: <SubcontractorsStep onSelectSubcontractor={handleSelectSubcontractor} /> },
        { label: "Particular Conditions", content: <ParticularConditionsStep /> },
        { label: "BOQ", content: <SubcontractorBOQStep dialogType={dialogType} buildings={tableData} /> },
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
        setSelectedProject(null);
        setSelectedTrade(null);
        setSelectedBuilding(null);
        setSelectedSubcontractor(null);
        handleHide();
        setCurrentStep(0);
    };

    return (
        <dialog ref={dialogRef as React.Ref<HTMLDialogElement>} className="modal" aria-modal="true">
            <div className="modal-box relative flex h-[85%] max-w-[85%] flex-col">
                <form onSubmit={handleSubmit} className="flex h-full flex-col space-y-4">
                    {/* Stepper & Close */}
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

                    {/* Navigation + Content Area */}
                    <div className="flex flex-1 items-center justify-between overflow-hidden">
                        {/* Back Btn */}
                        <Button
                            type="button"
                            color="ghost"
                            className="btn-circle"
                            disabled={
                                currentStep === 0 ||
                                (currentStep === 1 && selectedProject) ||
                                (currentStep === 2 && selectedTrade) ||
                                (currentStep === 3 && selectedBuilding) ||
                                (currentStep === 4 && selectedSubcontractor)
                            }
                            onClick={handleBack}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                                <g
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M16 12H8m4-4l-4 4l4 4" />
                                </g>
                            </svg>
                        </Button>

                        {/* Main Content */}
                        <div className="h-full w-full overflow-y-auto px-2">{steps[currentStep].content}</div>

                        {/* Next Btn */}
                        <Button
                            type="button"
                            color="ghost"
                            className="btn-circle"
                            disabled={
                                currentStep === steps.length - 1 ||
                                !selectedProject ||
                                (currentStep === 1 && !selectedTrade) ||
                                (currentStep === 2 && !selectedBuilding) ||
                                (currentStep === 3 && !selectedSubcontractor)
                            }
                            onClick={handleNext}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                                <g
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M8 12h8m-4 4l4-4l-4-4" />
                                </g>
                            </svg>
                        </Button>
                    </div>

                    {/* Submit Button */}
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

export default SubcontractorsBOQDialog;
