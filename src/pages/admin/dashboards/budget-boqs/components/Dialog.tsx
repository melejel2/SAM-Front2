import React, { useState } from "react";

import CloseBtn from "@/components/CloseBtn";
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

    const handleSubmit = async () => {
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
                    <div className="h-full">
                        <div className="flex h-full flex-col space-y-4">
                            <div>
                                <span className="font-semibold">Budget BOQ</span>
                                <CloseBtn handleClose={handleClose} />
                            </div>
                            <div className="h-full">
                                <BOQStep dialogType={dialogType} buildings={buildings} />
                            </div>
                            <div>
                                <Button
                                    className="w-full"
                                    size="sm"
                                    type="button"
                                    disabled={isLoading}
                                    loading={isLoading}
                                    onClick={handleSubmit}>
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </dialog>
        </>
    );
};

export default BudgetBOQDialog;
