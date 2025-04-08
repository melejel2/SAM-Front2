import React, { useState } from "react";

import { Button } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";

interface BOQDialogProps {
    handleHide: () => void;
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    dialogType: "Add" | "Edit" | "Preview";
    onSuccess: () => void;
}

const BOQDialogComponent: React.FC<BOQDialogProps> = ({ handleHide, dialogRef, dialogType, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);

    const { toaster } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        setIsLoading(false);

        toaster.success("Done...");
        onSuccess();
        handleClose();
    };

    const handleClose = () => {
        handleHide();
    };

    return (
        <dialog ref={dialogRef as React.Ref<HTMLDialogElement>} className="modal" aria-modal="true">
            <div className="modal-box relative max-w-7xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <div className="text-center">
                            <ul className="steps text-sm">
                                <li className="step step-primary">Project</li>
                                <li className="step">Trade</li>
                                <li className="step">Buildings</li>
                                <li className="step">Subcontractor</li>
                                <li className="step">Particular Conditions</li>
                                <li className="step">BOQ</li>
                                <li className="step">Preview</li>
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
                    <div>content here</div>
                    <div className="">
                        <Button
                            className="mt-2 w-full"
                            size="sm"
                            type="submit"
                            disabled={isLoading}
                            loading={isLoading}>
                            {dialogType === "Add" ? "Add" : "Save"}
                        </Button>
                    </div>
                </form>
            </div>
        </dialog>
    );
};

export default BOQDialogComponent;
