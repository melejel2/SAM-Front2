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
                    editAction
                    deleteAction
                    title={"IPC"}
                    loading={false}
                    addBtn
                    showAction
                    exportAction
                    generateAction
                    onSuccess={() => {}}
                />
            </div>
        </div>
    );
};

export default IPCsDatabase;
