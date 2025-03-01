import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useDechargesTemplates from "./use-decharge-templates";

const DechargesTemplates = () => {
    const { columns, tableData, inputFields } = useDechargesTemplates();

    return (
        <div>
            <MetaData title={"Decharge - Templates"} />

            <PageTitle title={"Decharge Templates"} centerItem={"Admin tools"} />
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

export default DechargesTemplates;
