import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useIPCsDatabase from "./use-IPCs-database";

const IPCsDatabase = () => {
    const { columns, tableData, inputFields } = useIPCsDatabase();

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
                    showAction
                    exportAction
                    rowActions={(row) => ({
                        deleteAction: row.status === "Editable",
                        generateAction: row.status === "Editable",
                        editAction: row.status === "Editable",
                    })}
                    onSuccess={() => {}}
                />
            </div>
        </div>
    );
};

export default IPCsDatabase;
