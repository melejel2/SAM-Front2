import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useTerminateTemplates from "./use-terminate-templates";

const TerminatesTemplates = () => {
    const { columns, tableData, inputFields } = useTerminateTemplates();

    return (
        <div>
            <MetaData title={"Terminate - Templates"} />

            <PageTitle title={"Terminate Templates"} centerItem={"Admin tools"} />
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

export default TerminatesTemplates;
