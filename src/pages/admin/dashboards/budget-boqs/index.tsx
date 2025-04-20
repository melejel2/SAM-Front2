import { useState } from "react";

import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";
import { useDialog } from "@/components/daisyui";

import BudgetBOQDialog from "./components/Dialog";
import useBudgetBOQs from "./use-budget-boqs";

const BudgetBOQs = () => {
    const [dialogType, setDialogType] = useState<"Add" | "Edit" | "Delete" | "Preview" | "Select">("Add");

    const { columns, tableData, inputFields } = useBudgetBOQs();
    const { dialogRef, handleShow, handleHide } = useDialog();

    const openCreateDialog = async (type: "Add" | "Edit" | "Delete" | "Preview" | "Select") => {
        setDialogType(type);
        handleShow();
    };

    return (
        <div>
            <MetaData title={"Budget BOQs"} />

            <PageTitle title={"Budget BOQs"} centerItem={"Dashboard"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions
                    editAction
                    deleteAction
                    title={"Budget BOQs"}
                    loading={false}
                    addBtn
                    onSuccess={() => {}}
                    dynamicDialog={false}
                    openStaticDialog={openCreateDialog}
                />
            </div>

            <BudgetBOQDialog
                handleHide={handleHide}
                dialogRef={dialogRef}
                dialogType={dialogType}
                onSuccess={() => {}}
            />
        </div>
    );
};

export default BudgetBOQs;
