import { useEffect } from "react";

import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useVOsTemplates from "./use-vos-templates";

const VOsTemplates = () => {
    const { columns, tableData, inputFields, getVOContractTemplates } = useVOsTemplates();

    useEffect(() => {
        getVOContractTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            <MetaData title={"VO - Templates"} />

            <PageTitle title={"VO Templates"} centerItem={"Admin tools"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions
                    deleteAction
                    previewAction
                    title={"VO Template"}
                    loading={false}
                    addBtn
                    onSuccess={() => {}}
                />
            </div>
        </div>
    );
};

export default VOsTemplates;
