import React, { useEffect, useState } from "react";

import apiRequest from "@/api/api";
import CloseBtn from "@/components/CloseBtn";
import { Button, Select, SelectOption } from "@/components/daisyui";
import { FileUploader } from "@/components/FileUploader";
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
    dialogType: "Add" | "Edit" | "Delete" | "Preview" | "Select" | "Approve" | "Confirm";
    current: CurrentData | null;
    onSuccess: () => void;
    inputFields?: InputField[];
    previewColumns?: Record<string, string>;
    title: string;
    data?: any[];
    onSelect?: (costCode: any) => void;
    confirmMsg?: string;
    editEndPoint?: string;
    createEndPoint?: string;
    deleteEndPoint?: string;
    onItemCreate?: (item: any) => void | Promise<void>;
    onItemUpdate?: (item: any) => void | Promise<void>;
    onItemDelete?: (item: any) => void | Promise<void>;
    isNested?: boolean;
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
    deleteEndPoint,
    onItemCreate,
    onItemUpdate,
    onItemDelete,
    isNested, // Destructure new prop
}) => {
    // Initialize form data based on inputFields and current data
    const [formData, setFormData] = useState<Record<string, any>>(() => {
        const initialData: Record<string, any> = {};
        inputFields?.forEach((field) => {
            if (dialogType === "Edit" && current && current[field.name] !== undefined) {
                initialData[field.name] = current[field.name];
            } else {
                initialData[field.name] = field.value !== undefined ? field.value : "";
            }
        });
        return initialData;
    });

    const [rejectionNote, setRejectionNote] = useState<string>("");
    const [showRejectionNote, setShowRejectionNote] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);
    const [costCodes, setCostCodes] = useState<any[]>([]);
    const [files, setFiles] = useState<Record<string, File | null>>({});

    const { toaster } = useToast();
    const { getToken } = useAuth();

    // Optional: Update formData when current changes (e.g., when editing a different user)
    useEffect(() => {
        if (dialogType === "Edit" && current) {
            setFormData((prevData) => ({
                ...prevData,
                ...current,
            }));
        } else if (dialogType === "Add") {
            const initialData: Record<string, any> = {};
            inputFields?.forEach((field) => {
                initialData[field.name] = field.value !== undefined ? field.value : "";
            });
            setFormData(initialData);
        }
    }, [current, dialogType, inputFields]);

    const handleRowSelect = (costCode: any) => {
        if (onSelect) {
            onSelect(costCode);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = getToken();
            if (!token) {
                toaster.error("Token is missing, unable to save.");
                return;
            }

            // Check if we have files to upload
            const hasFiles = Object.values(files).some(file => file !== null);
            let requestBody: any = formData;
            
            if (hasFiles) {
                // Create FormData for file uploads
                const formDataBody = new FormData();
                
                // Add all text fields
                Object.entries(formData).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        formDataBody.append(key, value.toString());
                    }
                });
                
                // Add files
                Object.entries(files).forEach(([key, file]) => {
                    if (file) {
                        formDataBody.append(key, file);
                    }
                });

                requestBody = formDataBody;
            }

            if (dialogType === "Edit" && current) {
                if (onItemUpdate) {
                    await onItemUpdate(formData);
                    toaster.success("Updated successfully.");
                    onSuccess();
                    return;
                }
                try {
                    const response = await apiRequest({
                        endpoint: editEndPoint ?? "",
                        method: "PUT",
                        token: token ?? "",
                        body: requestBody,
                    });
                    if (response.isSuccess) {
                        toaster.success("Updated successfully.");
                        onSuccess();
                    }
                    else {
                        toaster.error(response.message || "Failed to update record");
                    }
                } finally {
                    setIsLoading(false);
                    handleHide();
                }
            } else if (dialogType === "Add") {
                if (onItemCreate) {
                    await onItemCreate(formData);
                    toaster.success("Created successfully.");
                    onSuccess();
                    return;
                }
                try {
                    const response = await apiRequest({
                        endpoint: createEndPoint ?? "",
                        method: "POST",
                        token: token ?? "",
                        body: requestBody,
                    });
                    if (response.isSuccess) {
                        toaster.success("Created successfully.");
                        onSuccess();
                    } else {
                        console.error('Create failed:', response);
                        toaster.error(response.message || "Failed to create record");
                    }
                } catch (error: any) {
                    console.error("Create error:", error);
                    toaster.error(error.message || "Failed to create record");
                } finally {
                    setIsLoading(false);
                    handleHide();
                }
            } else if (dialogType === "Preview") {
                // Preview mode - no action needed
            }

            // toaster.success(`${dialogType === "Edit" ? "updated" : "created"} successfully.`);
            // onSuccess();
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
        setCostCodes([]);
        // Clear form data and files to free memory
        setFormData({});
        setFiles({});
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
                onSuccess();

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
                onSuccess();
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

    const handleDelete = async () => {
        if (onItemDelete && current) {
            await onItemDelete(current);
            toaster.success("Item removed.");
            onSuccess();
            handleClose();
            return;
        }
        try {
            setIsLoading(true);
            const token = getToken();
            if (!token) {
                toaster.error("Token is missing, unable to save.");
                return;
            }
            // For templates, we need to add isVo parameter
            let deleteEndPointWithId = "";
            if (deleteEndPoint) {
                if (deleteEndPoint.includes("Templates/DeleteTemplate")) {
                    // Check if it's a contract template (title contains "Contract")
                    const isContractTemplate = title.includes("Contract Template");
                    const isVoParam = isContractTemplate ? "false" : "true";
                    deleteEndPointWithId = `${deleteEndPoint}?id=${current?.id}&isVo=${isVoParam}`;
                } else if (deleteEndPoint.includes("{id}")) {
                    // Handle path parameter format
                    deleteEndPointWithId = deleteEndPoint.replace("{id}", current?.id);
                } else {
                    // Handle query parameter format
                    deleteEndPointWithId = `${deleteEndPoint}?id=${current?.id}`;
                }
            }
            const response = await apiRequest({
                endpoint: deleteEndPointWithId,
                method: "DELETE",
                token: token ?? "",
            });
            if (response.isSuccess) {
                toaster.success("Deleted successfully.");
                onSuccess();
                handleClose();
            } else {
                // Debug: Log full response
                console.error('🗑️ Delete failed:', response);

                // Extract error message
                const errorMessage = response?.message || "Failed to delete record";

                // Provide specific, user-friendly error messages based on error type
                let userFriendlyMessage = errorMessage;

                // Check for specific error types
                if (
                    errorMessage.toLowerCase().includes("project is using in a contract") ||
                    errorMessage.toLowerCase().includes("inuse")
                ) {
                    userFriendlyMessage =
                        "This project cannot be deleted because it has active contracts. Please delete all contracts associated with this project first.";
                } else if (
                    errorMessage.toLowerCase().includes("not found") ||
                    errorMessage.toLowerCase().includes("notfound")
                ) {
                    userFriendlyMessage = "The item could not be found. It may have been deleted by another user.";
                } else if (errorMessage.toLowerCase().includes("validation")) {
                    userFriendlyMessage = `Validation error: ${errorMessage}`;
                }

                toaster.error(userFriendlyMessage);
            }
        } catch (error) {
            console.error("🗑️ Delete error:", error);
            toaster.error("An error occurred while deleting. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        handleClose();
        toaster.success("Confirmed Successfully...");
    };

    useEffect(() => {
        if (title === "Trades" && (dialogType === "Add" || dialogType === "Edit")) {
            const fetchCostCodes = async () => {
                const token = getToken();

                try {
                    const data = await apiRequest({
                        endpoint: "CostCode/GetCodeCostLibrary",
                        method: "GET",
                        token: token ?? "",
                    });
                    const costCodes = data || [];
                    // Do something with costCodes (e.g., set state)
                    setCostCodes(costCodes);
                } catch (error) {
                    console.error(error);
                }
            };

            fetchCostCodes();
        }
    }, [dialogType, getToken, title]);

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
                            onChange={(e) => {
                                if (title === "Trades" && name === "costCode") {
                                    const selectedOption = JSON.parse(e.target.value);
                                    setFormData({
                                        ...formData,
                                        costCode: selectedOption.code,
                                        costCodeId: selectedOption.id,
                                    });
                                } else {
                                    setFormData({ ...formData, [name]: e.target.value });
                                }
                            }}
                            name={name}
                            value={
                                title === "Trades" && name === "costCode"
                                    ? JSON.stringify({
                                          code: formData.costCode,
                                          id: formData.costCodeId,
                                      })
                                    : formData[name]
                            }
                            required={required}
                            onTouchStart={(e) => {
                                if (e.touches.length > 1) {
                                    e.preventDefault();
                                }
                            }}>
                            <>
                                {dialogType === "Add" && (
                                    <SelectOption value="" disabled hidden>
                                        Select {label}
                                    </SelectOption>
                                )}

                                {title === "Trades" && name === "costCode" && costCodes.length > 0
                                    ? costCodes.map((option) => (
                                          <SelectOption
                                              key={option.id}
                                              value={JSON.stringify({ code: option.code, id: option.id })}
                                              className="bg-base-100">
                                              {option.code} - {option.en} / {option.fr}
                                          </SelectOption>
                                      ))
                                    : (options ?? []).map((option, index) => {
                                          // Handle both string options and object options
                                          if (typeof option === 'object' && option !== null) {
                                              return (
                                                  <SelectOption 
                                                      key={option.value || option.id || index} 
                                                      value={option.value || option.id} 
                                                      className="bg-base-100">
                                                      {option.label || option.name || option.value}
                                                  </SelectOption>
                                              );
                                          } else {
                                              return (
                                                  <SelectOption key={option || index} value={option} className="bg-base-100">
                                                      {option}
                                                  </SelectOption>
                                              );
                                          }
                                      })}
                            </>
                        </Select>
                    </label>
                );
            } else if (type === "file") {
                return (
                    <div className="w-full space-y-3">
                        <label className="text-sm font-medium text-base-content/80">{label}</label>
                        <div className="w-full">
                            <FileUploader
                                allowMultiple={false}
                                maxFiles={1}
                                acceptedFileTypes={[".doc", ".docx", ".pdf"]}
                                labelIdle='Drag & Drop your template file or <span class="filepond--label-action">Browse</span>'
                                onupdatefiles={(files) => {
                                    const file = files[0]?.file as File || null;
                                    setFiles(prev => ({ ...prev, [name]: file }));
                                }}
                                required={required}
                                allowProcess={false}
                                instantUpload={false}
                            />
                        </div>
                    </div>
                );
            } else if (type === "hidden") {
                return (
                    <input
                        key={name}
                        type="hidden"
                        name={name}
                        value={formData[name]}
                    />
                );
            } else {
                return (
                    <div className="form-control w-full" key={name}>
                        <label className="label">
                            <span className="label-text text-sm font-normal opacity-70">
                                {label ? label.charAt(0).toUpperCase() + label.slice(1) : ''}
                                {required && <span className="text-error ml-1">*</span>}
                            </span>
                        </label>
                        <input
                            type={type}
                            name={name}
                            value={formData[name]}
                            placeholder={`Enter ${(label || '').toLowerCase()}`}
                            required={required}
                            onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                            className="input input-sm input-bordered w-full focus:input-primary"
                        />
                    </div>
                );
            }
        }
    };

    const dialogContent = (
        <div
            className={cn("modal-box relative", {
                "max-w-7xl": dialogType === "Preview" || dialogType === "Approve",
                "max-w-5xl": dialogType === "Select",
                "max-w-xl": dialogType === "Delete",
            })}>
            <CloseBtn handleClose={handleClose} />
            <h3 className="text-lg font-bold">{dialogType === "Delete" ? `Delete ${title}` : title}</h3>

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
            ) : dialogType === "Delete" ? (
                <div className="space-y-4">
                    <p className="pt-2">This action cannot be undone!</p>
                    <div className="bg-warning/10 border border-warning rounded p-3 mb-4">
                        <p className="text-sm text-warning font-medium">
                            ⚠️ Before deleting, please note: If this {title.toLowerCase().includes('budget') ? 'Budget BOQ' : 'item'} has any active contracts, IPCs, or variation orders linked to it, the deletion will be blocked with a specific error message.
                        </p>
                    </div>
                    <div className="flex items-center justify-end space-x-4">
                        <Button
                            size="sm"
                            type="button"
                            disabled={isLoading}
                            loading={isLoading}
                            onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            color="error"
                            size="sm"
                            type="button"
                            disabled={isLoading}
                            loading={isLoading}
                            onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>
                </div>
            ) : dialogType === "Preview" ? (
                <form onSubmit={handleSubmit}>
                    <SAMTable
                        columns={previewColumns ?? {}}
                        tableData={data ?? []}
                        title={"Request Details"}
                        onSuccess={() => {}}
                        isNested={true} // Add this for nested SAMTable
                    />

                    <Button className="w-full" size="sm" type="submit" disabled={isLoading} loading={isLoading}>
                        Export
                    </Button>
                </form>
            ) : dialogType === "Select" ? (
                <SAMTable
                    columns={previewColumns ?? {}}
                    tableData={data ?? []}
                    title={"Cost Code"}
                    select
                    onRowSelect={handleRowSelect}
                    onSuccess={() => {}}
                    isNested={true} // Add this for nested SAMTable
                />
            ) : dialogType === "Approve" ? (
                <div className="space-y-5">
                    <SAMTable
                        columns={previewColumns ?? {}}
                        tableData={data ?? []}
                        title={"Request Details"}
                        onSuccess={() => {}}
                        isNested={true} // Add this for nested SAMTable
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
                        {inputFields?.map((field) => <div key={field.name}>{renderInput(field)}</div>)}

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
    );

    return (
        <dialog ref={dialogRef as React.Ref<HTMLDialogElement>} className="modal" aria-modal="true">
            {dialogContent}
        </dialog>
    );
};

export default DialogComponent;
