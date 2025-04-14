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
                    <form onSubmit={handleSubmit} className="h-[82%] space-y-4">
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
                        <div className="flex w-full items-center justify-between">
                            <Button type="button" size="sm">
                                Clear BOQ
                            </Button>
                            <div className="flex items-center justify-end space-x-2">
                                <Select
                                    className="w-full border-none bg-transparent focus:ring-0 focus:outline-none"
                                    onChange={(e) => {
                                        // setFormData({ ...formData, [name]: e.target.value });
                                    }}
                                    name="building"
                                    onTouchStart={(e) => {
                                        if (e.touches.length > 1) {
                                            e.preventDefault();
                                        }
                                    }}>
                                    <>
                                        {dialogType === "Add" && (
                                            <SelectOption value="" disabled hidden>
                                                Select Building
                                            </SelectOption>
                                        )}

                                        {(buildings ?? []).map((building) => (
                                            <SelectOption key={building.id} value={building.id} className="bg-base-100">
                                                {building.name}
                                            </SelectOption>
                                        ))}
                                    </>
                                </Select>
                                <Button type="button" size="sm">
                                    Create buildings
                                </Button>
                                <Button type="button" size="sm">
                                    Import BOQ
                                </Button>
                            </div>
                        </div>
                        <div className="h-full w-full">
                            <BOQStep />
                        </div>
                        <Button className="w-full" size="sm" type="submit" disabled={isLoading} loading={isLoading}>
                            Save
                        </Button>
                    </form>
                </div>
            </dialog>
        </>
    );
};

export default BudgetBOQDialog;
