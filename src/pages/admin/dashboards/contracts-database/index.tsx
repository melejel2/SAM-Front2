import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useContractsDatabase from "./use-contracts-database";

const ContractsDatabase = () => {
    const { columns, tableData, inputFields } = useContractsDatabase();

    return (
        <div>
            <MetaData title={"Contracts Database"} />

            <PageTitle title={"Contracts Database"} centerItem={"Dashboard"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions
                    editAction
                    deleteAction
                    title={"Contract"}
                    loading={false}
                    addBtn
                    onSuccess={() => {}}
                />
            </div>
        </div>
    );
};

export default ContractsDatabase;
