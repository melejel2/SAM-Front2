import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useContractsTemplates from "./use-contracts-templates";

const ContractsTemplates = () => {
    const { columns, tableData, inputFields } = useContractsTemplates();

    return (
        <div>
            <MetaData title={"Contract - Templates"} />

            <PageTitle title={"Contract Templates"} centerItem={"Admin tools"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions={true}
                    deleteAction={true}
                    showAction={true}
                    title={"Template"}
                    loading={false}
                    addBtn={true}
                />
            </div>
        </div>
    );
};

export default ContractsTemplates;
