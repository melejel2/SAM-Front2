import { useState } from "react";
import { useNavigate } from "react-router-dom";

import SAMTable from "@/components/Table";
import { useDialog } from "@/components/daisyui";

import SubcontractorsBOQDialog from "./components/Dialog";
import useSubcontractorsBOQs from "./use-subcontractors-boqs";

const SubcontractorsBOQs = () => {
    const [dialogType, setDialogType] = useState<"Add" | "Edit" | "Delete" | "Preview" | "Select">("Add");
    const navigate = useNavigate();

    const { columns, tableData, inputFields } = useSubcontractorsBOQs();
    const { dialogRef, handleShow, handleHide } = useDialog();

    const openCreateDialog = async (type: "Add" | "Edit" | "Delete" | "Preview" | "Select") => {
        setDialogType(type);
        handleShow();
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div>
            {/* Header with Back Button */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToDashboard}
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <span className="iconify lucide--arrow-left size-4"></span>
                        <span>Back</span>
                    </button>
                </div>
            </div>

            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions
                    editAction
                    deleteAction
                    title={"Subcontractor BOQ"}
                    loading={false}
                    addBtn
                    onSuccess={() => {}}
                    dynamicDialog={false}
                    openStaticDialog={openCreateDialog}
                />
            </div>
            <SubcontractorsBOQDialog
                handleHide={handleHide}
                dialogRef={dialogRef}
                dialogType={dialogType}
                onSuccess={() => {}}
            />
        </div>
    );
};

export default SubcontractorsBOQs;
