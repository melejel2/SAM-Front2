import { useState } from "react";

import Icon from "@/components/Icon";
import { Button } from "@/components/daisyui/Button";
import { useDialog } from "@/components/daisyui/Modal";

import DialogComponent from "./Dialog";

interface AccordionProps {
    rowData: object;
    actions: boolean;
    previewAction?: boolean;
    deleteAction?: boolean;
    editAction?: boolean;
    onEdit?: (data: any) => void;
    onDelete?: (id: number) => void;
    onShow?: (data: any) => void;
    title: string;
    previewLoadingRowId?: string | null;
    // Added property for selectable mode
    select?: boolean;
}

interface AccordionsProps {
    accordionData: any[];
    columns: Record<string, string>;
    previewColumns?: Record<string, string>;
    actions: boolean;
    previewAction?: boolean;
    deleteAction?: boolean;
    editAction?: boolean;
    inputFields?: Array<{
        name: string;
        label: string;
        type: string;
        required: boolean;
    }>;
    title: string;
    addBtn?: boolean;
    openStaticDialog?: (type: "Add" | "Edit" | "Delete" | "Preview", Data?: any) => void | Promise<void>;
    dynamicDialog?: boolean;
    // Added property for selectable mode
    select?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({
    onDelete,
    onEdit,
    onShow,
    title,
    rowData,
    actions,
    previewAction,
    deleteAction,
    editAction,
    previewLoadingRowId,
    select, // now destructured and used
}) => {
    const handleDelete = () => {
        if (onDelete) {
            onDelete(0); // Replace 0 with appropriate id if needed
        }
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(rowData);
        }
    };

    return (
        <div className="collapse-arrow bg-base-200 collapse">
            <input type="radio" name="my-accordion-2" />
            <div className="collapse-title text-xl font-medium">{title}</div>
            <div className="collapse-content space-y-2 text-lg">
                {/* If select mode is enabled, show a checkbox */}
                {select && (
                    <div className="mb-2 flex items-center">
                        <input type="checkbox" className="checkbox" />
                        <span className="ml-2 text-sm">Select</span>
                    </div>
                )}
                {Object.entries(rowData).map(([key, value], index) => (
                    <span key={index} className="block">
                        {key}: {value}
                    </span>
                ))}
                {actions && (
                    <div className="flex w-full items-center justify-end">
                        {previewAction && (
                            <Button
                                color="ghost"
                                size="sm"
                                shape={"square"}
                                aria-label="Preview"
                                disabled={previewLoadingRowId === ((rowData as any).id || (rowData as any).contractId || (rowData as any).projectId || String(rowData))}
                                onClick={() => {
                                    if (onShow) onShow(rowData);
                                }}>
                                {previewLoadingRowId === ((rowData as any).id || (rowData as any).contractId || (rowData as any).projectId || String(rowData)) ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                    <Icon icon={"eye"} className="text-base-content/70" fontSize={4} />
                                )}
                            </Button>
                        )}
                        {editAction && (
                            <Button color="ghost" size="sm" shape={"square"} aria-label="Edit" onClick={handleEdit}>
                                <Icon icon={"pencil"} className="text-base-content/70" fontSize={4} />
                            </Button>
                        )}
                        {deleteAction && (
                            <Button
                                color="ghost"
                                className="text-error/70 hover:bg-error/20"
                                size="sm"
                                shape={"square"}
                                aria-label="Delete"
                                onClick={handleDelete}>
                                <Icon icon={"trash"} fontSize={4} />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const AccordionComponent: React.FC<AccordionsProps> = ({
    actions,
    accordionData,
    inputFields,
    title,
    previewAction,
    deleteAction,
    editAction,
    addBtn,
    openStaticDialog,
    dynamicDialog = true,
    select, // destructured here as well
}) => {
    const { dialogRef, handleShow, handleHide } = useDialog();
    const [dialogType, setDialogType] = useState<"Add" | "Edit" | "Preview">("Add");
    const [currentRow, setCurrentRow] = useState<any | null>(null);
    const [previewLoadingRowId, setPreviewLoadingRowId] = useState<string | null>(null);

    const openCreateDialog = () => {
        setDialogType("Add");
        setCurrentRow(null);
        handleShow();
    };

    const openEditDialog = (data: any) => {
        setDialogType("Edit");
        setCurrentRow(data);
        handleShow();
    };

    const openPreviewDialog = async (data: any) => {
        setDialogType("Preview");
        setCurrentRow(data);
        
        // Set loading state for this specific row
        const rowId = data.id || data.contractId || data.projectId || String(data);
        setPreviewLoadingRowId(rowId);
        
        if (dynamicDialog) {
            handleShow();
            // Clear loading state after dialog opens
            setPreviewLoadingRowId(null);
        } else {
            if (openStaticDialog) {
                try {
                    await openStaticDialog("Preview", data);
                } finally {
                    // Clear loading state after preview is handled
                    setPreviewLoadingRowId(null);
                }
            }
        }
    };

    const handleDelete = (id: number) => {
        console.log(`Delete row with ID: ${id}`);
    };

    const handleSuccess = () => {
        console.log("Dialog action completed!");
        handleHide();
    };

    return (
        <>
            {addBtn && (
                <Button
                    onClick={openCreateDialog}
                    className="btn btn-ghost btn-xs border-base-content/20 mb-4 h-8 border">
                    <Icon icon={"plus"} fontSize={4} />
                    New {title}
                </Button>
            )}
            <div className="w-full space-y-4">
                {accordionData.length > 0 &&
                    accordionData.map((data, index) => (
                        <Accordion
                            rowData={data}
                            key={index}
                            onEdit={openEditDialog}
                            onDelete={handleDelete}
                            onShow={openPreviewDialog}
                            title={"title"}
                            actions={actions}
                            previewAction={previewAction}
                            editAction={editAction}
                            deleteAction={deleteAction}
                            previewLoadingRowId={previewLoadingRowId}
                            select={select} // pass the prop to each Accordion
                        />
                    ))}
            </div>

            {(addBtn || actions) && (
                <DialogComponent
                    dialogRef={dialogRef}
                    handleHide={handleHide}
                    dialogType={dialogType}
                    current={currentRow}
                    onSuccess={handleSuccess}
                    inputFields={inputFields}
                    title={title}
                />
            )}
        </>
    );
};

export default AccordionComponent;
