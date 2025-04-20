import { useEffect } from "react";

import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useContractsTemplates from "./use-contracts-templates";

const ContractsTemplates = () => {
    const { columns, tableData, inputFields, getContractTemplates } = useContractsTemplates();

    useEffect(() => {
        getContractTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            <MetaData title={"Contract - Templates"} />

            <PageTitle title={"Contract Templates"} centerItem={"Admin tools"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions
                    deleteAction
                    showAction
                    title={"Template"}
                    loading={false}
                    addBtn
                    onSuccess={() => {}}
                />
            </div>
        </div>
    );
};

export default ContractsTemplates;
