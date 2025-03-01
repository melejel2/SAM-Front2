import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useVOsTemplates from "./use-vos-templates";

const VOsTemplates = () => {
    const { columns, tableData, inputFields } = useVOsTemplates();

    return (
        <div>
            <MetaData title={"VO - Templates"} />

            <PageTitle title={"VO Templates"} centerItem={"Admin tools"} />
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

export default VOsTemplates;
