import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useConnection from "./use-connection";

const Connection = () => {
    const { columns, tableData, inputFields } = useConnection();

    return (
        <div>
            <MetaData title={"Connection"} />

            <PageTitle title={"Connection"} centerItem={"Admin tools"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions={true}
                    editAction={true}
                    deleteAction={true}
                    title={"Connection"}
                    loading={false}
                    addBtn={true}
                    onSuccess={() => {}}
                />
            </div>
        </div>
    );
};

export default Connection;
