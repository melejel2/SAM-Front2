import { useState } from "react";

import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";
import { useDialog } from "@/components/daisyui";

import SubcontractorsBOQDialog from "./components/Dialog";
import useSubcontractorsBOQs from "./use-subcontractors-boqs";

const SubcontractorsBOQs = () => {
    const [dialogType, setDialogType] = useState<"Add" | "Edit" | "Delete" | "Preview" | "Select">("Add");

    const { columns, tableData, inputFields } = useSubcontractorsBOQs();
    const { dialogRef, handleShow, handleHide } = useDialog();

    const openCreateDialog = async (type: "Add" | "Edit" | "Delete" | "Preview" | "Select") => {
        setDialogType(type);
        handleShow();
    };

    return (
        <div>
            <MetaData title={"Subcontractors BOQs"} />

            <PageTitle title={"Subcontractors BOQs"} centerItem={"Dashboard"} />
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
