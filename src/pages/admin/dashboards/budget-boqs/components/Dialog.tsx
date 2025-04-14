import React, { useState } from "react";

import { Button, Select, SelectOption } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";

import BOQStep from "./BOQ";
import useBudgetBOQsDialog from "./use-budget-boq-dialog";

interface BudgetBOQDialogProps {
    handleHide: () => void;
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    dialogType: "Add" | "Edit" | "Delete" | "Preview" | "Select";
    onSuccess: () => void;
}

const BudgetBOQDialog: React.FC<BudgetBOQDialogProps> = ({ handleHide, dialogRef, dialogType, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { setSelectedTrade, buildings } = useBudgetBOQsDialog();

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
        setSelectedTrade(null);
        handleHide();
    };

    return (
        <>
            <dialog ref={dialogRef as React.Ref<HTMLDialogElement>} className="modal" aria-modal="true">
                <div className="modal-box relative h-[85%] max-w-[85%]">
                    <form onSubmit={handleSubmit} className="h-full">
                        <div className="flex h-full flex-col space-y-4">
                            <div>
                                <span className="font-semibold">Budget BOQ</span>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
                                    onClick={handleClose}
                                    aria-label="Close">
                                    ✕
                                </button>
                            </div>
                            <div className="h-full">
                                <BOQStep dialogType={dialogType} buildings={buildings} />
                            </div>
                            <div>
                                <Button
                                    className="w-full"
                                    size="sm"
                                    type="submit"
                                    disabled={isLoading}
                                    loading={isLoading}>
                                    Save
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </dialog>
        </>
    );
};

export default BudgetBOQDialog;
