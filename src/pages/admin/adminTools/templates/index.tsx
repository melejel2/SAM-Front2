import Icon from "@/components/Icon";
import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useTemplates from "./use-templates";

const Templates = () => {
    const { columns, tableData, inputFields, hasActions } = useTemplates();

    return (
        <div>
            <MetaData title={"Templates"} />

            <PageTitle title={"Templates"} centerItem={"Admin tools"} />
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

export default Templates;
