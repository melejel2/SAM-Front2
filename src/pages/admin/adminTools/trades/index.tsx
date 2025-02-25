import Icon from "@/components/Icon";
import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useTrades from "./use-trades";

const Trades = () => {
    const { columns, tableData, inputFields } = useTrades();

    return (
        <div>
            <MetaData title={"Trades"} />

            <PageTitle title={"Trades"} centerItem={"Admin tools"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions={true}
                    editAction={true}
                    deleteAction={true}
                    title={"Trades"}
                    loading={false}
                    addBtn
                />
            </div>
        </div>
    );
};

export default Trades;
