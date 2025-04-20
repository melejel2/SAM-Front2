import { useEffect } from "react";

import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useTrades from "./use-trades";

const Trades = () => {
    const { columns, tableData, inputFields, getTrades } = useTrades();

    useEffect(() => {
        getTrades();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            <MetaData title={"Trades"} />

            <PageTitle title={"Trades"} centerItem={"Admin tools"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions
                    editAction
                    deleteAction
                    title={"Trades"}
                    loading={false}
                    addBtn
                    editEndPoint="Sheets/UpdateSheet"
                    createEndPoint="Sheets/AddSheet"
                    deleteEndPoint="Sheets/DeleteSheet"
                    onSuccess={getTrades}
                />
            </div>
        </div>
    );
};

export default Trades;
