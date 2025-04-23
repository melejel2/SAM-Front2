import React, { useState } from "react";

import CloseBtn from "@/components/CloseBtn";
import Stepper from "@/components/Stepper";
import { Button } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";

import IPCContractStep from "./Contract";
import PreviewIPCStep from "./Preview";
import IPCProgressStep from "./Progress";
import IPCProjectStep from "./Projects";
import ResourcesStep from "./Resources";
import IPCSubcontractorsStep from "./Subcontractors";
import IPCTypeStep from "./Type";
import useIPCDialog from "./use-ipc-dialog";

interface IPCDialogProps {
    handleHide: () => void;
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    dialogType: "Add" | "Edit" | "Delete" | "Preview" | "Select";
    onSuccess: () => void;
}

const IPCDialog: React.FC<IPCDialogProps> = ({ handleHide, dialogRef, dialogType, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const {
        setSelectedProject,
        selectedProject,
        setSelectedContract,
        selectedContract,
        setSelectedType,
        selectedType,
        setSelectedSubcontractor,
        selectedSubcontractor,
    } = useIPCDialog();

    const { toaster } = useToast();

    const handleSelectProject = (project: any) => {
        setSelectedProject(project);
    };

    const handleSelectContract = (contract: any) => {
        setSelectedContract(contract);
    };

    const handleSelectType = (type: any) => {
        setSelectedType(type);
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
        {
            label: "Project",
            value: selectedProject ? selectedProject.name : null,
            symbol: "P",
            content: <IPCProjectStep onSelectProject={handleSelectProject} />,
        },
        {
            label: "Subcontractor",
            value: "",
            symbol: "S",
            content: <IPCSubcontractorsStep onSelectSubcontractor={handleSelectSubcontractor} />,
        },
        {
            label: "Contract",
            value: selectedContract ? selectedContract.contractNb : null,
            symbol: "C",
            content: <IPCContractStep onSelectContract={handleSelectContract} />,
        },
        {
            label: "Type",
            value: selectedType ? selectedType : null,
            symbol: "T",
            content: <IPCTypeStep onSelectType={handleSelectType} />,
        },
        {
            label: "Progress",
            value: "",
            symbol: "P",
            content: <IPCProgressStep />,
        },
        {
            label: "Resources",
            value: "",
            symbol: "R",
            content: <ResourcesStep />,
        },
        { label: "Preview", value: "", symbol: "", content: <PreviewIPCStep /> },
    ];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);

            toaster.success("Done...");
            onSuccess();
            handleClose();
        }, 1000);
    };

    const handleClose = () => {
        setSelectedProject(null);
        setSelectedContract(null);
        setSelectedType(null);
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
                        <Stepper steps={steps} currentStep={currentStep} />
                        <CloseBtn handleClose={handleClose} />
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
                                (currentStep === 2 && selectedContract) ||
                                (currentStep === 3 && selectedType) ||
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
                                (currentStep === 1 && !selectedSubcontractor) ||
                                (currentStep === 2 && !selectedContract) ||
                                (currentStep === 3 && !selectedType)
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
                        <div className="flex items-center justify-end space-x-2">
                            <Button type="submit" loading={isLoading} disabled={isLoading}>
                                <span>Download</span>
                                <span className="iconify lucide--download size-4" />
                            </Button>
                            <Button type="button" loading={isLoading} disabled={isLoading} color="primary">
                                <span>Save</span>
                                <span className="iconify lucide--save size-4" />
                            </Button>
                        </div>
                    )}
                </form>
            </div>
        </dialog>
    );
};

export default IPCDialog;
