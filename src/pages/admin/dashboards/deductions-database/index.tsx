import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useDeductionsDatabase from "./use-deductions-database";

const DeductionsDatabase = () => {
    const { columns, tableData, inputFields } = useDeductionsDatabase();

    return (
        <div>
            <MetaData title={"Deductions Database"} />

            <PageTitle title={"Deductions Database"} centerItem={"Dashboard"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions
                    editAction
                    deleteAction
                    title={"Deduction"}
                    loading={false}
                    addBtn
                    onSuccess={() => {}}
                />
            </div>
        </div>
    );
};

export default DeductionsDatabase;
