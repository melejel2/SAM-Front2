import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useBudgetBOQs from "./use-budget-BOQs";

const BudgetBOQs = () => {
    const { columns, tableData, inputFields } = useBudgetBOQs();

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
                />
            </div>
        </div>
    );
};

export default BudgetBOQs;
