import Icon from "@/components/Icon";
import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useConnection from "./use-connection";

const Connection = () => {
    const { columns, tableData, inputFields, hasActions } = useConnection();

    return (
        <div>
            <MetaData title={"Connection"} />

            <PageTitle title={"Connection"} centerItem={"Admin tools"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions={hasActions}
                    title={"Connection"}
                    loading={false}
                />
            </div>
        </div>
    );
};

export default Connection;
