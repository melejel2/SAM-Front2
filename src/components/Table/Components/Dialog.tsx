import React, { useEffect, useState } from "react";

import apiRequest from "@/api/api";
import { Button, Select, SelectOption } from "@/components/daisyui";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/helpers/utils/cn";
import useToast from "@/hooks/use-toast";

import SAMTable from "./Table";

interface InputField {
    name: string;
    label: string;
    type: string;
    value?: any;
    required?: boolean;
    options?: any[];
}

interface CurrentData {
    [key: string]: any;
}

interface DialogProps {
    handleHide: () => void;
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    dialogType: "Add" | "Edit" | "Preview" | "Select" | "Approve" | "Confirm";
    current: CurrentData | null;
    onSuccess: (type: "Add" | "Edit" | "Preview" | "Select" | "Approve" | "Confirm", formData: any) => void;
    inputFields: InputField[];
    previewColumns?: Record<string, string>;
    title: string;
    data?: any[];
    onSelect?: (costCode: any) => void;
    confirmMsg?: string;
    editEndPoint?: string;
    createEndPoint?: string;
}

const DialogComponent: React.FC<DialogProps> = ({
    handleHide,
    dialogRef,
    dialogType,
    current,
    onSuccess,
    inputFields,
    title,
    previewColumns,
    data,
    onSelect,
    confirmMsg,
    editEndPoint,
    createEndPoint,
}) => {
    // Initialize form data based on inputFields and current data
    const [formData, setFormData] = useState<Record<string, any>>(() => {
        const initialData: Record<string, any> = {};
        inputFields.forEach((field) => {
            if (dialogType === "Edit" && current && current[field.name] !== undefined) {
                initialData[field.name] = current[field.name];
            } else {
                initialData[field.name] = field.value || "";
            }
        });
        return initialData;
    });

    const [rejectionNote, setRejectionNote] = useState<string>("");
    const [showRejectionNote, setShowRejectionNote] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);

    const { toaster } = useToast();
    const { getToken } = useAuth();

    // Optional: Update formData when current changes (e.g., when editing a different user)
    useEffect(() => {
        if (dialogType === "Edit" && current) {
            setFormData((prevData) => ({
                ...prevData,
                ...current,
            }));
        }
    }, [current, dialogType]);

    const handleRowSelect = (costCode: any) => {
        if (onSelect) {
            onSelect(costCode);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        console.log("formData", formData);

        try {
            const token = getToken();
            if (!token) {
                toaster.error("Token is missing, unable to save.");
                return;
            }

            if (dialogType === "Edit" && current) {
                try {
                    const response = await apiRequest({
                        endpoint: editEndPoint ?? "",
                        method: "PUT",
                        token: token ?? "",
                        body: formData,
                    });
                    console.log(response);
                    if (response.isSuccess) {
                        console.log("isSuccess");
                        toaster.success("Updated successfully.");
                        onSuccess(dialogType, formData);
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsLoading(false);
                }
            } else if (dialogType === "Add") {
                try {
                    const response = await apiRequest({
                        endpoint: createEndPoint ?? "",
                        method: "POST",
                        token: token ?? "",
                        body: formData,
                    });
                    console.log(response);
                    if (response.isSuccess) {
                        toaster.success("Created successfully.");
                        onSuccess(dialogType, formData);
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsLoading(false);
                }
            } else if (dialogType === "Preview") {
                console.log("");
            }

            // toaster.success(`${dialogType === "Edit" ? "updated" : "created"} successfully.`);
            // onSuccess(dialogType, formData);
        } catch (error: any) {
            console.error("Error saving user:", error);
            if (error.response) {
                toaster.error(
                    `Failed to save user. Server responded with status ${error.response.status}: ${error.response.data}`,
                );
            } else if (error.request) {
                toaster.error("Failed to save user. No response received from the server.");
            } else {
                toaster.error(`Failed to save user. Error: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
            handleHide();
        }
    };

    const handleClose = () => {
        setShowRejectionNote(false);
        setRejectionNote("");
        setIsLoading(false);
        handleHide();
    };

    const handleApprove = async () => {
        setIsLoading(true);

        try {
            const token = getToken();
            if (!token) {
                toaster.error("Token is missing, unable to save.");
                return;
            }

            try {
                toaster.success("Approved successfully.");
                onSuccess(dialogType, formData);

                handleClose();
            } catch (error) {
                console.error("Error approving request:", error);
                toaster.error("Failed to approve request.");
            }
        } catch (error: any) {
            console.error("Error approve request:", error);
            if (error.response) {
                toaster.error(
                    `Failed to approve request. Server responded with status ${error.response.status}: ${error.response.data}`,
                );
            } else if (error.request) {
                toaster.error("Failed to approve request. No response received from the server.");
            } else {
                toaster.error(`Failed to approve request. Error: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        if (!showRejectionNote) {
            setShowRejectionNote(true);
            return;
        }
        setIsLoading(true);

        try {
            const token = getToken();
            if (!token) {
                toaster.error("Token is missing, unable to save.");
                return;
            }

            try {
                toaster.success("Rejected successfully.");
                onSuccess(dialogType, formData);
                handleClose();
            } catch (error) {
                console.error("Error reject request:", error);
                toaster.error("Failed to reject request.");
            }
        } catch (error: any) {
            console.error("Error reject request:", error);
            if (error.response) {
                toaster.error(
                    `Failed to reject request. Server responded with status ${error.response.status}: ${error.response.data}`,
                );
            } else if (error.request) {
                toaster.error("Failed to reject request. No response received from the server.");
            } else {
                toaster.error(`Failed to reject request. Error: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        console.log("Confirmed");
        handleClose();
        toaster.success("Confirmed Successfully...");
    };

    // Dynamically render inputs based on inputFields
    const renderInput = (field: InputField) => {
        const { name, type, required, options, label } = field;
        {
            if (type === "select") {
                return (
                    <label className="input input-sm input-bordered xs:gap-4 flex w-full items-center text-sm lg:gap-12">
                        <span className="w-20 font-normal capitalize opacity-45">{label}</span>
                        <Select
                            className="w-full border-none bg-transparent focus:ring-0 focus:outline-none"
                            onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                            name={name}
                            value={formData[name]}
                            required={required}
                            onTouchStart={(e) => {
                                if (e.touches.length > 1) {
                                    e.preventDefault();
                                }
                            }}>
                            {(options ?? []).map((option) => (
                                <SelectOption key={option} value={option} className="bg-base-100">
                                    {option}
                                </SelectOption>
                            ))}
                        </Select>
                    </label>
                );
            } else {
                return (
                    <label
                        className="input input-sm input-bordered flex w-full flex-col items-center gap-2 sm:flex-row"
                        key={name}>
                        <span className="min-w-16 text-sm font-normal opacity-45 md:w-28">
                            {label.charAt(0).toUpperCase() + label.slice(1)}
                        </span>
                        <input
                            type={type}
                            name={name}
                            className="grow"
                            value={formData[name]}
                            required={required}
                            onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                        />
                    </label>
                );
            }
        }
    };

    return (
        <dialog ref={dialogRef as React.Ref<HTMLDialogElement>} className="modal" aria-modal="true">
            <div
                className={cn("modal-box relative", {
                    "max-w-7xl": dialogType === "Preview" || dialogType === "Approve",
                    "max-w-5xl": dialogType === "Select",
                })}>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
                    onClick={handleClose}
                    aria-label="Close">
                    ✕
                </button>
                <h3 className="text-lg font-bold">{title}</h3>

                {dialogType === "Confirm" ? (
                    <div>
                        <p>{confirmMsg}</p>
                        <div className="flex items-center justify-end space-x-4">
                            <Button
                                color="success"
                                size="sm"
                                type="button"
                                disabled={isLoading}
                                loading={isLoading}
                                onClick={handleConfirm}>
                                Confirm
                            </Button>
                            <Button
                                color="error"
                                size="sm"
                                type="button"
                                disabled={isLoading}
                                loading={isLoading}
                                onClick={handleClose}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : dialogType === "Preview" ? (
                    <form onSubmit={handleSubmit}>
                        <SAMTable
                            columns={previewColumns ?? {}}
                            tableData={data ?? []}
                            inputFields={[]}
                            actions={false}
                            title={"Request Details"}
                        />

                        <Button className="w-full" size="sm" type="submit" disabled={isLoading} loading={isLoading}>
                            Export
                        </Button>
                    </form>
                ) : dialogType === "Select" ? (
                    <SAMTable
                        columns={previewColumns ?? {}}
                        tableData={data ?? []}
                        inputFields={[]}
                        actions={false}
                        title={"Cost Code"}
                        select
                        onRowSelect={handleRowSelect}
                    />
                ) : dialogType === "Approve" ? (
                    <div className="space-y-5">
                        <SAMTable
                            columns={previewColumns ?? {}}
                            tableData={data ?? []}
                            inputFields={[]}
                            actions={false}
                            title={"Request Details"}
                        />
                        {showRejectionNote && (
                            <>
                                <label className="input input-sm input-bordered flex flex-col items-center gap-2 sm:flex-row">
                                    <span className="min-w-16 text-sm font-normal opacity-45 md:w-28">
                                        Rejection Note
                                    </span>
                                    <input
                                        type="text"
                                        className="grow"
                                        value={rejectionNote}
                                        required={false}
                                        onChange={(e) => setRejectionNote(e.target.value)}
                                    />
                                </label>

                                {showRejectionNote && rejectionNote === "" && (
                                    <span className="label-text-alt text-error !-mt-2 text-sm">
                                        Enter the rejection reason
                                    </span>
                                )}
                            </>
                        )}
                        <div className="text-right">
                            <div className="flex items-center justify-end space-x-4">
                                <Button
                                    color="success"
                                    size="sm"
                                    type="button"
                                    disabled={isLoading}
                                    loading={isLoading}
                                    onClick={handleApprove}>
                                    Approve
                                </Button>
                                <Button
                                    className="disabled:bg-error/30"
                                    size="sm"
                                    type="button"
                                    color="error"
                                    disabled={isLoading || (showRejectionNote && rejectionNote === "")}
                                    loading={isLoading}
                                    onClick={handleReject}>
                                    Reject
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="py-4">
                        <div className="space-y-4">
                            {inputFields.map((field) => (
                                <div key={field.name}>{renderInput(field)}</div>
                            ))}

                            {(dialogType === "Add" || dialogType === "Edit") && (
                                <Button
                                    className="mt-2 w-full"
                                    size="sm"
                                    type="submit"
                                    disabled={isLoading}
                                    loading={isLoading}>
                                    {dialogType === "Add" ? "Add" : "Save"}
                                </Button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </dialog>
    );
};

export default DialogComponent;
