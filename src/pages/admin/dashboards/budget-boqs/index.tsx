import { useState } from "react";

import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";
import { useDialog } from "@/components/daisyui";

import BOQDialogComponent from "./components/Dialog";
import useBudgetBOQs from "./use-budget-BOQs";

const BudgetBOQs = () => {
    // const [dialogType, setDialogType] = useState<"Add" | "Edit" | "Delete" | "Preview">("Add");

    const { columns, tableData, inputFields } = useBudgetBOQs();
    const { dialogRef, handleShow, handleHide } = useDialog();

    // const openCreateDialog = async (type: string) => {};

    return (
        <div>
            <MetaData title={"Budget BOQs"} />

            <PageTitle title={"Budget BOQs"} centerItem={"Dashboard"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions={true}
                    editAction={true}
                    deleteAction={true}
                    title={"Budget BOQs"}
                    loading={false}
                    addBtn={true}
                    onSuccess={() => {}}
                    dynamicDialog={false}
                    openStaticDialog={handleShow}
                />
            </div>

            <BOQDialogComponent handleHide={handleHide} dialogRef={dialogRef} dialogType={"Add"} onSuccess={() => {}} />
        </div>
    );
};

export default BudgetBOQs;
