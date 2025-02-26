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
                    actions={true}
                    editAction={true}
                    deleteAction={true}
                    title={"Deduction"}
                    loading={false}
                    addBtn={true}
                />
            </div>
        </div>
    );
};

export default DeductionsDatabase;
