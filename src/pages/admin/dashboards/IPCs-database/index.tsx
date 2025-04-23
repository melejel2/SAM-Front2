import { useState } from "react";

import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";
import { useDialog } from "@/components/daisyui";

import IPCDialog from "./components/Dialog";
import useIPCsDatabase from "./use-IPCs-database";

const IPCsDatabase = () => {
    const [dialogType, setDialogType] = useState<"Add" | "Edit" | "Delete" | "Preview" | "Select">("Add");

    const { columns, tableData, inputFields } = useIPCsDatabase();
    const { dialogRef, handleShow, handleHide } = useDialog();

    const openCreateDialog = async (type: "Add" | "Edit" | "Delete" | "Preview" | "Select") => {
        setDialogType(type);
        handleShow();
    };
    return (
        <div>
            <MetaData title={"IPCs Database"} />

            <PageTitle title={"IPCs Database"} centerItem={"Dashboard"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions
                    title={"IPC"}
                    loading={false}
                    addBtn
                    previewAction
                    exportAction
                    rowActions={(row) => ({
                        deleteAction: row.status === "Editable",
                        generateAction: row.status === "Editable",
                        editAction: row.status === "Editable",
                    })}
                    onSuccess={() => {}}
                    dynamicDialog={false}
                    openStaticDialog={openCreateDialog}
                />
            </div>
            <IPCDialog handleHide={handleHide} dialogRef={dialogRef} dialogType={dialogType} onSuccess={() => {}} />
        </div>
    );
};

export default IPCsDatabase;
